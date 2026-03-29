import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { jsonResponse, errorResponse, validationErrorResponse, getClientIp } from '@/lib/api-helpers';
import { loginSchema } from '@/lib/validations';
import { AUTH_ERRORS, SUCCESS_MESSAGES } from '@/lib/messages';
import {
  checkLoginRateLimit,
  isAccountLocked,
  getLockoutTimeRemaining,
  recordFailedAttempt,
  resetFailedAttempts,
  recordIpSuspiciousActivity,
} from '@/lib/rate-limit';
import { createRequestLogger } from '@/lib/logger';
import { logAuthEvent } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const logger = createRequestLogger('auth', req);
  const clientIp = getClientIp(req);

  try {
    // Check rate limiting - 5 attempts per minute per IP
    const rateLimit = checkLoginRateLimit(req);
    if (!rateLimit.allowed) {
      const secondsRemaining = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      logger.warn('Login rate limit exceeded', { email: 'unknown', secondsRemaining });
      return errorResponse(
        `יותר מדי ניסיונות התחברות. אנא נסה שוב ב-${secondsRemaining} שניות.`,
        429
      );
    }

    const body = await req.json();

    // Validate input with Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      logger.debug('Login validation failed', { email: body.email });
      return validationErrorResponse(validation.error);
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // ========================================================================
    // CHECK ACCOUNT LOCKOUT (After 5 failed attempts for 15 minutes)
    // ========================================================================
    if (isAccountLocked(normalizedEmail)) {
      const remainingMs = getLockoutTimeRemaining(normalizedEmail);
    const secondsRemaining = Math.ceil(remainingMs / 1000);
    const minutesRemaining = Math.ceil(secondsRemaining / 60);
    const timeMessage = secondsRemaining > 120
      ? `${minutesRemaining} דקות`
      : `${secondsRemaining} שניות`;

    logger.warn('Login failed: account locked', {
      email: normalizedEmail,
      secondsRemaining,
    });
    recordIpSuspiciousActivity(clientIp);

    return errorResponse(
      `החשבון נעול עקב מספר ניסיונות כושלים. אנא נסה שוב ב-${timeMessage}.`,
      403
    );
    }

    // ========================================================================
    // FIND USER AND VALIDATE PASSWORD
    // ========================================================================
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // User not found - record failed attempt for account lockout
      recordFailedAttempt(normalizedEmail);
      recordIpSuspiciousActivity(clientIp);

      logger.warn('Login failed: user not found', { email: normalizedEmail });
      logAuthEvent('LOGIN', 'unknown', {
        status: 'failure',
        errorMessage: 'User not found',
        req,
      });
      return errorResponse(AUTH_ERRORS.INVALID_EMAIL_OR_PASSWORD, 401);
    }

    if (!user.isActive) {
      logger.warn('Login failed: account inactive', { userId: user.id, email });
      logAuthEvent('LOGIN', user.id, {
        status: 'failure',
        errorMessage: 'Account inactive',
        req,
      });
      return errorResponse(AUTH_ERRORS.ACCOUNT_INACTIVE, 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      // Invalid password - record failed attempt for account lockout
      recordFailedAttempt(normalizedEmail);
      recordIpSuspiciousActivity(clientIp);

      logger.warn('Login failed: invalid password', {
        userId: user.id,
        email: normalizedEmail,
      });
      logAuthEvent('LOGIN', user.id, {
        status: 'failure',
        errorMessage: 'Invalid password',
        req,
      });
      return errorResponse(AUTH_ERRORS.INVALID_EMAIL_OR_PASSWORD, 401);
    }

    // ========================================================================
    // SUCCESSFUL LOGIN - RESET ATTEMPTS AND ISSUE TOKENS
    // ========================================================================
    // Reset failed attempts on successful login
    resetFailedAttempts(normalizedEmail);

    // Generate short-lived access token (15 minutes) and longer-lived refresh token (7 days)
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.setUserId(user.id);
    logger.info('User login successful', {
      userId: user.id,
      email,
      role: user.role,
    });
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

    // Set access token (2 hours)
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 hours
      path: '/',
    });

    // Set longer-lived refresh token (7 days) in separate httpOnly cookie
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    logger.error('Login error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse(AUTH_ERRORS.LOGIN_ERROR, 500);
  }
}
