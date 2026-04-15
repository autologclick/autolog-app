import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { jsonResponse, errorResponse, validationErrorResponse, getClientIp } from '@/lib/api-helpers';
import { loginSchema } from '@/lib/validations';
import { AUTH_ERRORS } from '@/lib/messages';
import {
  checkLoginRateLimit,
  isAccountLocked,
  getLockoutTimeRemaining,
  recordFailedAttempt,
  recordIpSuspiciousActivity,
} from '@/lib/rate-limit';
import { createRequestLogger } from '@/lib/logger';
import { logAuthEvent } from '@/lib/audit-log';
import { issueEmailOtp, pruneOldOtps } from '@/lib/email-otp';

/**
 * STEP 1 of login:
 *   Validate email + password.
 *   On success: issue a 6-digit email OTP and return { requiresOtp: true }.
 *   Client then calls /api/auth/verify-login with email + password + otp (+ totp for admins).
 *
 * No JWT / cookies are issued here — only after the OTP is verified.
 */
export async function POST(req: NextRequest) {
  const logger = createRequestLogger('auth', req);
  const clientIp = getClientIp(req);

  try {
    const rateLimit = checkLoginRateLimit(req);
    if (!rateLimit.allowed) {
      const secondsRemaining = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      logger.warn('Login rate limit exceeded', { secondsRemaining });
      return errorResponse(
        `יותר מדי ניסיונות התחברות. אנא נסה שוב ב-${secondsRemaining} שניות.`,
        429
      );
    }

    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();

    if (isAccountLocked(normalizedEmail)) {
      const remainingMs = getLockoutTimeRemaining(normalizedEmail);
      const secondsRemaining = Math.ceil(remainingMs / 1000);
      const minutesRemaining = Math.ceil(secondsRemaining / 60);
      const timeMessage = secondsRemaining > 120
        ? `${minutesRemaining} דקות`
        : `${secondsRemaining} שניות`;

      logger.warn('Login failed: account locked', { email: normalizedEmail });
      recordIpSuspiciousActivity(clientIp);
      return errorResponse(
        `החשבון נעול עקב מספר ניסיונות כושלים. אנא נסה שוב ב-${timeMessage}.`,
        403
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      recordFailedAttempt(normalizedEmail);
      recordIpSuspiciousActivity(clientIp);
      logger.warn('Login failed: user not found', { email: normalizedEmail });
      logAuthEvent('LOGIN', 'unknown', { status: 'failure', errorMessage: 'User not found', req });
      return errorResponse(AUTH_ERRORS.INVALID_EMAIL_OR_PASSWORD, 401);
    }

    if (!user.isActive) {
      logger.warn('Login failed: account inactive', { userId: user.id });
      logAuthEvent('LOGIN', user.id, { status: 'failure', errorMessage: 'Account inactive', req });
      return errorResponse(AUTH_ERRORS.ACCOUNT_INACTIVE, 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      recordFailedAttempt(normalizedEmail);
      recordIpSuspiciousActivity(clientIp);
      logger.warn('Login failed: invalid password', { userId: user.id });
      logAuthEvent('LOGIN', user.id, { status: 'failure', errorMessage: 'Invalid password', req });
      return errorResponse(AUTH_ERRORS.INVALID_EMAIL_OR_PASSWORD, 401);
    }

    // Admins must have TOTP enrolled — only enforced when REQUIRE_ADMIN_2FA=true
    const enforceAdmin2FA = process.env.REQUIRE_ADMIN_2FA === 'true';
    if (enforceAdmin2FA && user.role === 'admin' && !user.twoFactorEnabled) {
      logger.warn('Admin login blocked: TOTP not enrolled', { userId: user.id });
      return errorResponse(
        'חשבון מנהל חייב להפעיל אימות דו-שלבי (TOTP). פנה למנהל המערכת.',
        403
      );
    }

    // Password is correct — issue OTP to email
    try {
      await issueEmailOtp(user.email, user.fullName);
    } catch (e) {
      logger.error('Failed to issue email OTP', { userId: user.id, error: String(e) });
      return errorResponse('שגיאה בשליחת קוד אימות. נסה שוב.', 500);
    }

    pruneOldOtps().catch(() => {});

    logger.info('Login step 1 success — OTP issued', { userId: user.id });

    return jsonResponse({
      requiresOtp: true,
      requiresTotp: user.role === 'admin' && user.twoFactorEnabled,
      message: 'נשלח קוד אימות לאימייל שלך. אנא הזן אותו כדי להשלים כניסה.',
    });
  } catch (error) {
    logger.error('Login error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return errorResponse(AUTH_ERRORS.LOGIN_ERROR, 500);
  }
}
