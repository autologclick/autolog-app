import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { randomBytes, createHash } from 'crypto';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth');

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@') || email.trim().length < 5) {
      return errorResponse('נא למלא כתובת אימייל תקינה', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, fullName: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return jsonResponse({
        message: 'אם הכתובת קיימת במערכת, נשלח אליך קישור לאיפוס סיסמה',
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token using parameterized Prisma query
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiresAt,
      },
    });

    // In production, send email here
    // For now, log the token in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Password reset token generated', { email: user.email, resetUrl: `/auth/forgot-password?token=${resetToken}` });
    }

    return jsonResponse({
      message: 'אם הכתובת קיימת במערכת, נשלח אליך קישור לאיפוס סיסמה',
      // Token is logged via logger.debug above — never returned in response
    });
  } catch (error) {
    return handleApiError(error);
  }
}
