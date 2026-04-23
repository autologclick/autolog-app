import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  verifyPassword,
  generateToken,
  generateRefreshToken,
  generateTrustedDeviceToken,
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_DEVICE_EXPIRY_DAYS,
} from '@/lib/auth';
import { jsonResponse, errorResponse, validationErrorResponse, getClientIp } from '@/lib/api-helpers';
import { AUTH_ERRORS, SUCCESS_MESSAGES } from '@/lib/messages';
import {
  isAccountLocked,
  getLockoutTimeRemaining,
  recordFailedAttempt,
  resetFailedAttempts,
  recordIpSuspiciousActivity,
  checkLoginRateLimit,
} from '@/lib/rate-limit';
import { createRequestLogger } from '@/lib/logger';
import { logAuthEvent } from '@/lib/audit-log';
import { verifyEmailOtp } from '@/lib/email-otp';
import { verifyTotp, verifyBackupCode } from '@/lib/totp';

const verifyLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  emailOtp: z.string().regex(/^\d{6}$/, 'קוד האימות חייב להיות 6 ספרות'),
  totpCode: z.string().optional(), // admin only
});

/**
 * STEP 2 of login:
 *   Re-validate password (defense in depth — the client sends it again so step 1 cannot be bypassed).
 *   Verify the email OTP.
 *   If admin + TOTP enabled, also verify the TOTP code.
 *   On full success: issue access + refresh cookies.
 */
export async function POST(req: NextRequest) {
  const logger = createRequestLogger('auth-verify', req);
  const clientIp = getClientIp(req);

  try {
    const rateLimit = checkLoginRateLimit(req);
    if (!rateLimit.allowed) {
      const s = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return errorResponse(`יותר מדי ניסיונות. נסה שוב ב-${s} שניות.`, 429);
    }

    const body = await req.json();
    const validation = verifyLoginSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { email, password, emailOtp, totpCode } = validation.data;
    const normalizedEmail = email.toLowerCase();

    if (isAccountLocked(normalizedEmail)) {
      const remainingMs = getLockoutTimeRemaining(normalizedEmail);
      const s = Math.ceil(remainingMs / 1000);
      return errorResponse(`החשבון נעול. נסה שוב ב-${s > 120 ? Math.ceil(s / 60) + ' דקות' : s + ' שניות'}.`, 403);
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      recordFailedAttempt(normalizedEmail);
      recordIpSuspiciousActivity(clientIp);
      return errorResponse(AUTH_ERRORS.INVALID_EMAIL_OR_PASSWORD, 401);
    }

    // Re-verify password — step 2 must stand on its own
    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      recordFailedAttempt(normalizedEmail);
      recordIpSuspiciousActivity(clientIp);
      logAuthEvent('LOGIN', user.id, { status: 'failure', errorMessage: 'Invalid password (step 2)', req });
      return errorResponse(AUTH_ERRORS.INVALID_EMAIL_OR_PASSWORD, 401);
    }

    // Verify email OTP
    const otpResult = await verifyEmailOtp(normalizedEmail, emailOtp);
    if (!otpResult.ok) {
      recordFailedAttempt(normalizedEmail);
      const msg =
        otpResult.reason === 'expired' ? 'הקוד פג תוקף. התחל התחברות מחדש.' :
        otpResult.reason === 'too_many_attempts' ? 'יותר מדי ניסיונות. התחל התחברות מחדש.' :
        otpResult.reason === 'not_found' ? 'אין קוד פעיל. התחל התחברות מחדש.' :
        'קוד אימות שגוי.';
      logAuthEvent('LOGIN', user.id, { status: 'failure', errorMessage: `Email OTP: ${otpResult.reason}`, req });
      return errorResponse(msg, 401);
    }

    // Admin + TOTP enabled → also require TOTP code
    if (user.role === 'admin' && user.twoFactorEnabled && user.twoFactorSecret) {
      if (!totpCode) {
        return errorResponse('חשבון מנהל דורש גם קוד מאפליקציית האימות.', 401);
      }
      let totpOk = verifyTotp(user.twoFactorSecret, totpCode);
      if (!totpOk && user.twoFactorBackupCodes) {
        const list: string[] = JSON.parse(user.twoFactorBackupCodes);
        const res = verifyBackupCode(totpCode, list);
        if (res.ok) {
          totpOk = true;
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(res.remaining) },
          });
        }
      }
      if (!totpOk) {
        recordFailedAttempt(normalizedEmail);
        logAuthEvent('LOGIN', user.id, { status: 'failure', errorMessage: 'TOTP invalid', req });
        return errorResponse('קוד אפליקציית האימות שגוי.', 401);
      }
    }

    // All factors verified — issue tokens
    resetFailedAttempts(normalizedEmail);

    const accessToken = generateToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.setUserId(user.id);
    logger.info('Login complete', { userId: user.id, role: user.role });
    logAuthEvent('LOGIN', user.id, { status: 'success', req });

    const response = jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
      message: SUCCESS_MESSAGES.LOGIN,
    });

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
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Set trusted device cookie — next login from this browser won't require OTP
    const trustedToken = generateTrustedDeviceToken(user.id);
    response.cookies.set(TRUSTED_DEVICE_COOKIE, trustedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * TRUSTED_DEVICE_EXPIRY_DAYS,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('verify-login error', { error: error instanceof Error ? error.message : 'Unknown' });
    return errorResponse(AUTH_ERRORS.LOGIN_ERROR, 500);
  }
}
