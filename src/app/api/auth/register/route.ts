import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { jsonResponse, errorResponse, validationErrorResponse, sanitizeInput } from '@/lib/api-helpers';
import { registerSchema } from '@/lib/validations';
import { AUTH_ERRORS, SUCCESS_MESSAGES } from '@/lib/messages';
import { checkRegisterRateLimit } from '@/lib/rate-limit';
import { createRequestLogger } from '@/lib/logger';
import { logAuthEvent, logCreateEvent } from '@/lib/audit-log';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  const logger = createRequestLogger('auth', req);

  try {
    // Check rate limiting - 3 attempts per minute per IP
    const rateLimit = checkRegisterRateLimit(req);
    if (!rateLimit.allowed) {
      const secondsRemaining = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      logger.warn('Registration rate limit exceeded', { secondsRemaining });
      return errorResponse(
        `יותר מדי ניסיונות רישום. אנא נסה שוב ב-${secondsRemaining} שניות.`,
        429
      );
    }

    const body = await req.json();

    // Validate input with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      logger.debug('Registration validation failed', { email: body.email });
      return validationErrorResponse(validation.error);
    }

    let { email, password, fullName, phone, idNumber, licenseNumber } = validation.data;

    // Sanitize inputs to prevent XSS
    email = sanitizeInput(email)?.toLowerCase() || '';
    fullName = sanitizeInput(fullName) || '';
    phone = sanitizeInput(phone) || undefined;
    idNumber = sanitizeInput(idNumber) || undefined;
    licenseNumber = sanitizeInput(licenseNumber) || undefined;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.warn('Registration failed: email already exists', { email });
      return errorResponse(AUTH_ERRORS.EMAIL_EXISTS, 409);
    }

    // Check if ID number already exists (if provided)
    if (idNumber) {
      const existingId = await prisma.user.findUnique({ where: { idNumber } });
      if (existingId) {
        logger.warn('Registration failed: ID number already exists', { idNumber });
        return errorResponse(AUTH_ERRORS.ID_NUMBER_EXISTS, 409);
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone: phone || null,
        idNumber: idNumber || null,
        licenseNumber: licenseNumber || null,
        role: 'user',
      },
    });

    logger.setUserId(user.id);
    logger.info('User registration successful', {
      userId: user.id,
      email,
      fullName,
    });
    logCreateEvent(user.id, 'user', user.id, {
      email,
      fullName,
      role: 'user',
    }, { req });

    // Generate access token (2 hours) and refresh token (30 days) — same as login
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

    const response = jsonResponse({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      message: SUCCESS_MESSAGES.REGISTERED,
    }, 201);

    // Set access token (2 hours) — same as login flow
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 hours
      path: '/',
    });

    // Set refresh token (30 days) — keeps user logged in across sessions
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    logger.error('Registration error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Handle Prisma constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return errorResponse(AUTH_ERRORS.EMAIL_OR_ID_EXISTS, 409);
    }

    return errorResponse(AUTH_ERRORS.REGISTER_ERROR, 500);
  }
}
