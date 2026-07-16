import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { exchangeCodeForProfile } from '@/lib/oauth/google';
import { consumeOAuthState } from '@/lib/oauth/state-store';
import {
  generateToken,
  generateRefreshToken,
  generateTrustedDeviceToken,
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_DEVICE_EXPIRY_DAYS,
} from '@/lib/auth';
import { sanitizeInput } from '@/lib/api-helpers';
import { createRequestLogger } from '@/lib/logger';
import { logAuthEvent, logCreateEvent } from '@/lib/audit-log';
import { creditReferral } from '@/lib/services/partner-service';
import { notifyAdmins } from '@/lib/services/notification-service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';

/**
 * GET /api/auth/google/callback?code=...&state=...
 *
 * Steps:
 *  1. Validate state cookie matches query state
 *  2. Pull PKCE verifier + next destination from Redis (single-use)
 *  3. Exchange code → ID token, verify signature against Google JWKS
 *  4. Refuse if email_verified=false (Workspace edge case, prevents takeover)
 *  5. Look up user by (provider, providerAccountId) → fallback to email
 *  6. Auto-link or create
 *  7. Refuse Google sign-in for admins with TOTP enabled (v1 policy)
 *  8. Issue access + refresh + trusted-device cookies, redirect to `next`
 */
export async function GET(req: NextRequest) {
  const logger = createRequestLogger('auth/google/callback', req);
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateQuery = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const stateCookie = req.cookies.get('g_oauth_state')?.value;

  const fail = (reason: string) => {
    logger.warn('Google OAuth failure', { reason });
    return NextResponse.redirect(`${APP_URL}/auth/login?error=${encodeURIComponent(reason)}`);
  };

  if (errorParam) {
    return fail(errorParam === 'access_denied' ? 'access_denied' : 'google_error');
  }
  if (!code || !stateQuery || !stateCookie) return fail('missing_state');
  if (stateCookie !== stateQuery) return fail('state_mismatch');

  const stateData = await consumeOAuthState(stateQuery);
  if (!stateData) return fail('state_expired');

  let profile;
  try {
    profile = await exchangeCodeForProfile(code, stateData.codeVerifier);
  } catch (e) {
    logger.error('Google token exchange failed', {
      error: e instanceof Error ? e.message : String(e),
    });
    return fail('token_exchange_failed');
  }

  if (!profile.email_verified) return fail('email_not_verified');

  const normalizedEmail = profile.email.toLowerCase();
  const fullNameFromGoogle =
    sanitizeInput(profile.name || '') ||
    sanitizeInput([profile.given_name, profile.family_name].filter(Boolean).join(' ')) ||
    normalizedEmail.split('@')[0];

  // 1) Look up by Google sub (handles user changing their Google email)
  let user = await prisma.user.findFirst({
    where: {
      oauthAccounts: { some: { provider: 'google', providerAccountId: profile.sub } },
    },
  });

  let isNewUser = false;

  if (!user) {
    // 2) Fall back to email match → auto-link
    const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (byEmail) {
      if (!byEmail.isActive) return fail('account_inactive');
      await prisma.oAuthAccount.create({
        data: {
          userId: byEmail.id,
          provider: 'google',
          providerAccountId: profile.sub,
          email: normalizedEmail,
        },
      });
      user = byEmail;
      logger.info('Linked Google account to existing user', { userId: byEmail.id });
      logAuthEvent('LOGIN', byEmail.id, {
        status: 'success',
        metadata: JSON.stringify({ method: 'google', linked: true }),
        req,
      });
    } else {
      // 3) Brand new user
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: fullNameFromGoogle,
          passwordHash: null,            // Google-only
          avatarUrl: profile.picture || null,
          emailVerified: true,            // Google verified it
          role: 'user',
          oauthAccounts: {
            create: {
              provider: 'google',
              providerAccountId: profile.sub,
              email: normalizedEmail,
            },
          },
        },
      });

      logger.setUserId(user.id);
      logCreateEvent(
        user.id,
        'user',
        user.id,
        { email: normalizedEmail, fullName: fullNameFromGoogle, role: 'user', method: 'google' },
        { req },
      );

      if (stateData.referralCode) {
        creditReferral({ userId: user.id, rawCode: stateData.referralCode })
          .then((r) => logger.info('Referral credit attempt', { credited: r.credited }))
          .catch((e) =>
            logger.warn('Referral credit failed', {
              error: e instanceof Error ? e.message : String(e),
            }),
          );
      }

      notifyAdmins(
        'system',
        'משתמש חדש נרשם 🎉 (Google)',
        `${fullNameFromGoogle} (${normalizedEmail}) הצטרף/ה ל-AutoLog דרך Google`,
        `/admin/users/${user.id}`,
      ).catch(() => {});
    }
  }

  if (!user.isActive) return fail('account_inactive');

  // 4) v1 policy: admins with TOTP enabled must use password flow.
  // (Avoids implementing a Google-specific 2FA gate in the first pass.)
  if (user.role === 'admin' && user.twoFactorEnabled && user.twoFactorSecret) {
    logAuthEvent('LOGIN', user.id, {
      status: 'failure',
      errorMessage: 'Admin TOTP — Google sign-in blocked by policy',
      req,
    });
    return fail('admin_must_use_password');
  }

  // 5) Issue session
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const accessToken = generateToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
  const trustedDeviceToken = generateTrustedDeviceToken(user.id);

  logger.setUserId(user.id);
  logger.info('Google login complete', { userId: user.id, isNewUser });
  logAuthEvent('LOGIN', user.id, {
    status: 'success',
    metadata: JSON.stringify({ method: 'google', isNewUser }),
    req,
  });

  const safeNext =
    stateData.next && stateData.next.startsWith('/') && !stateData.next.startsWith('//')
      ? stateData.next
      : '/user';

  const roleDest = user.role === 'admin' ? '/admin' : user.role === 'garage_owner' ? '/garage' : safeNext;
  const response = NextResponse.redirect(`${APP_URL}${roleDest}`);

  response.cookies.set('auth-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 2 * 60 * 60,
    path: '/',
  });
  response.cookies.set('refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  response.cookies.set(TRUSTED_DEVICE_COOKIE, trustedDeviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * TRUSTED_DEVICE_EXPIRY_DAYS,
    path: '/',
  });

  response.cookies.delete('g_oauth_state');

  return response;
}
