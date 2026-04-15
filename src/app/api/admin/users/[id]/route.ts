import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, errorResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';
import { hashPassword } from '@/lib/auth';
import { sendEmail, buildPasswordResetEmailHtml } from '@/lib/email';
import { randomBytes, createHash } from 'crypto';
import { createLogger } from '@/lib/logger';

const logger = createLogger('admin-users');

const updateUserSchema = z.object({
  fullName: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100).optional(),
  phone: z.string().regex(/^[\d\-+() ]{7,20}$/, 'מספר טלפון לא תקין').optional(),
  role: z.enum(['user', 'admin', 'garage_owner'], { errorMap: () => ({ message: 'תפקיד לא תקין' }) }).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/users/[id] - Get single user with vehicles, appointments, and SOS events
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(req);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        vehicles: {
          select: {
            id: true,
            nickname: true,
            manufacturer: true,
            model: true,
            year: true,
            licensePlate: true,
            testStatus: true,
            insuranceStatus: true,
          },
        },
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            serviceType: true,
            vehicle: {
              select: {
                nickname: true,
                licensePlate: true,
              },
            },
            garage: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        sosEvents: {
          select: {
            id: true,
            eventType: true,
            status: true,
            priority: true,
            createdAt: true,
            vehicle: {
              select: {
                nickname: true,
                licensePlate: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return errorResponse(NOT_FOUND.USER, 404);
    }

    return jsonResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(req);

    const body = await req.json();

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: validation.data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return jsonResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/admin/users/[id] - Admin actions: reset password, send reset email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const { action } = body;

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return errorResponse(NOT_FOUND.USER, 404);
    }

    if (action === 'reset_password') {
      // Generate random password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let tempPass = '';
      for (let i = 0; i < 10; i++) {
        tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const hashed = await hashPassword(tempPass);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed },
      });

      // Email the temporary password to the user rather than returning it in the response
      try {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: user.email,
          subject: 'AutoLog — סיסמה זמנית חדשה',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2>סיסמה זמנית אופסה</h2>
              <p>שלום ${user.fullName || ''},</p>
              <p>מנהל מערכת איפס את הסיסמה שלך. להלן הסיסמה הזמנית:</p>
              <p style="font-family: monospace; font-size: 20px; background:#f4f4f4; padding:12px; border-radius:8px; letter-spacing: 2px;">${tempPass}</p>
              <p>מומלץ להתחבר ולהחליף מיד את הסיסמה.</p>
              <p style="color:#888;font-size:12px;">אם לא ביקשת איפוס — צור קשר עם התמיכה מייד.</p>
            </div>
          `,
        });
      } catch {
        // non-fatal — admin can retry
      }

      return jsonResponse({
        message: 'הסיסמה אופסה ונשלחה למייל המשתמש',
        email: user.email,
      });
    }

    if (action === 'send_reset_email') {
      // Generate reset token and send email
      const resetToken = randomBytes(32).toString('hex');
      const hashedToken = createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: expiresAt,
        },
      });

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
        logger.warn('Failed to send admin-triggered reset email', { email: user.email });
        return errorResponse('שליחת המייל נכשלה. בדוק הגדרות RESEND_API_KEY.', 500);
      }

      return jsonResponse({
        message: `קישור איפוס סיסמה נשלח ל-${user.email}`,
        emailSent: true,
      });
    }

    return errorResponse('פעולה לא חוקית', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
    