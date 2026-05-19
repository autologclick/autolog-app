import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { AUTH_ERRORS, SUCCESS_MESSAGES } from '@/lib/messages';

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return errorResponse(AUTH_ERRORS.INVALID_RESET_LINK, 400);
    }

    if (!password || typeof password !== 'string') {
      return errorResponse(AUTH_ERRORS.PASSWORD_REQUIRED, 400);
    }

    // Validate password strength consistency with registration
    if (password.length < 8) {
      return errorResponse(AUTH_ERRORS.PASSWORD_MIN_LENGTH, 400);
    }
    if (!/[A-Z]/.test(password)) {
      return errorResponse(AUTH_ERRORS.PASSWORD_UPPERCASE, 400);
    }
    if (!/[a-z]/.test(password)) {
      return errorResponse(AUTH_ERRORS.PASSWORD_LOWERCASE, 400);
    }
    if (!/[0-9]/.test(password)) {
      return errorResponse(AUTH_ERRORS.PASSWORD_DIGIT, 400);
    }

    // Hash the token to compare with stored hash
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // Hash new password first (so an attacker who finds the token can't
    // exploit a slow bcrypt to extend the race window).
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atomic "consume + update" — updateMany returns count=0 if the token was
    // already consumed (cleared), eliminating the replay race condition where
    // two simultaneous requests with the same token could both succeed.
    const result = await prisma.user.updateMany({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    if (result.count === 0) {
      // Either token didn't exist, expired, or was already used by another request
      return errorResponse(AUTH_ERRORS.RESET_LINK_EXPIRED, 400);
    }

    return jsonResponse({
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
