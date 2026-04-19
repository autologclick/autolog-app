import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { VALIDATION_ERRORS } from '@/lib/messages';
import { randomBytes, createHash } from 'crypto';
import { createLogger } from '@/lib/logger';
import { sendEmail, buildPasswordResetEmailHtml } from '@/lib/email';

const logger = createLogger('auth');

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@') || email.trim().length < 5) {
      return errorResponse(VALIDATION_ERRORS.INVALID_EMAIL, 400);
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

    // Store token — wrapped in try/catch so DB issues don't break the endpoint
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: expiresAt,
        },
      });
    } catch (dbError) {
      logger.error('Failed to store reset token', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        userId: user.id,
      });
      // Still return success message to prevent email enumeration
      return jsonResponse({
        message: 'אם הכתובת קיימת במערכת, נשלח אליך קישור לאיפוס סיסמה',
      });
    }

    // Send password reset email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
    const resetUrl = `${baseUrl}/auth/forgot-password?token=${resetToken}`;

    const emailSent = await sendEmail({
      to: user.email,
      subject: 'איפוס סיסמה - AutoLog',
      html: buildPasswordResetEmailHtml({
        fullName: user.fullName,
        resetUrl,
      }),
    });

    if (!emailSent) {
      logger.warn('Failed to send password reset email', { email: user.email });
    } else {
      logger.info('Password reset email sent', { email: user.email });
    }

    return jsonResponse({
      message: 'אם הכתובת קיימת במערכת, נשלח אליך קישור לאיפוס סיסמה',
    });
  } catch (error) {
    return handleApiError(error);
  }
}