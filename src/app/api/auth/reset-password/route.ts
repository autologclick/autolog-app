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

    // Find user with matching, non-expired token using parameterized Prisma query
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return errorResponse(AUTH_ERRORS.RESET_LINK_EXPIRED, 400);
    }

    // Hash new password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return jsonResponse({
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
