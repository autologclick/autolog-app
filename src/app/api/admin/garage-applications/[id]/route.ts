import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, handleApiError, requireAdmin } from '@/lib/api-helpers';
import { getApplicationById, updateApplicationStatus } from '@/lib/garage-applications-db';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { GARAGE_APP_ERRORS } from '@/lib/messages';
import { sendEmail, buildGarageWelcomeEmailHtml } from '@/lib/email';
import { createLogger } from '@/lib/logger';

const logger = createLogger('garage-applications');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req);
    const application = await getApplicationById(params.id);
    if (!application) {
      return errorResponse(GARAGE_APP_ERRORS.NOT_FOUND, 404);
    }
    return jsonResponse(application);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);
    const body = await req.json();
    const { status, adminNotes } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return errorResponse(GARAGE_APP_ERRORS.INVALID_STATUS, 400);
    }

    const application = await getApplicationById(params.id);
    if (!application) {
      return errorResponse(GARAGE_APP_ERRORS.NOT_FOUND, 404);
    }

    if (application.status !== 'pending') {
      return errorResponse(GARAGE_APP_ERRORS.ALREADY_PROCESSED, 400);
    }

    // Update application status
    await updateApplicationStatus(params.id, status, adminNotes || null, admin.userId);

    // If approved, create the garage owner user and garage
    if (status === 'approved') {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: application.email },
      });

      let userId: string;

      if (existingUser) {
        // Update existing user role to garage_owner
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'garage_owner' },
        });
        userId = existingUser.id;
      } else {
        // Create new user with garage_owner role and random temp password
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let tempPass = '';
        for (let i = 0; i < 10; i++) {
          tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const hashedPass = await hashPassword(tempPass);
        const newUser = await prisma.user.create({
          data: {
            email: application.email,
            fullName: application.ownerName,
            phone: application.phone,
            passwordHash: hashedPass,
            role: 'garage_owner',
          },
        });
        userId = newUser.id;
        // Store temp password to return to admin
        (application as any)._tempPassword = tempPass;
      }

      // Check if garage already exists for this owner
      const existingGarage = await prisma.garage.findUnique({
        where: { ownerId: userId },
      });

      if (!existingGarage) {
        // Create the garage
        await prisma.garage.create({
          data: {
            ownerId: userId,
            name: application.garageName,
            city: application.city,
            address: application.address || undefined,
            phone: application.phone,
            email: application.email,
            description: application.description || undefined,
            services: application.services || '[]',
            isActive: true,
            isPartner: true,
          },
        });
      }

      const tempPass = (application as any)._tempPassword;

      // Send welcome email with credentials to new garage owner
      if (tempPass) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
          await sendEmail({
            to: application.email,
            subject: 'ברוכים הבאים ל-AutoLog! פרטי ההתחברות שלך',
            html: buildGarageWelcomeEmailHtml({
              ownerName: application.ownerName,
              garageName: application.garageName,
              email: application.email,
              tempPassword: tempPass,
              loginUrl: `${baseUrl}/auth/login`,
            }),
          });
        } catch (emailErr) {
          logger.warn('Failed to send welcome email to garage owner', {
            email: application.email,
            error: emailErr instanceof Error ? emailErr.message : String(emailErr),
          });
        }
      }

      return jsonResponse({
        message: 'הבקשה אושרה! המוסך נוסף למערכת בהצלחה.',
        userCreated: !existingUser,
        tempPassword: tempPass || undefined,
        loginEmail: application.email,
      });
    }

    // ─── Send rejection email to applicant ───
    // Without this, applicants submit a heartfelt application and never hear
    // back — terrible brand experience. Fire-and-forget so a Resend outage
    // doesn't break the admin's UI flow.
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
      const reasonHtml = adminNotes
        ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin:0 0 20px"><p style="margin:0 0 6px;font-size:15px;color:#92400e;font-weight:600">📋 הסבר מהצוות:</p><p style="margin:0;font-size:14px;color:#92400e;line-height:1.5">${adminNotes}</p></div>`
        : '';
      const rejectionHtml = `<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:24px 8px;direction:rtl">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:520px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
<tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:22px 28px;text-align:center"><h1 style="color:#fff;margin:0;font-size:20px">❌ עדכון לגבי הבקשה שלך</h1></td></tr>
<tr><td style="padding:28px">
<p style="font-size:16px;color:#1e293b;margin:0 0 18px;line-height:1.6">שלום ${application.ownerName},</p>
<p style="font-size:16px;color:#1e293b;margin:0 0 18px;line-height:1.6">לצערנו, הבקשה של <strong>${application.garageName}</strong> להצטרפות ל-AutoLog לא אושרה כרגע.</p>
${reasonHtml}
<p style="font-size:15px;color:#475569;margin:0 0 18px;line-height:1.6">אתם מוזמנים לפנות אלינו במייל לקבלת הבהרות, או להגיש בקשה מחודשת לאחר השלמת הפרטים החסרים.</p>
<div style="text-align:center;margin:24px 0"><a href="${baseUrl}/garage-apply" style="display:inline-block;background:#2E77D0;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700">הגש/י בקשה חדשה</a></div>
<p style="font-size:13px;color:#94a3b8;margin:24px 0 0;line-height:1.4">תודה על ההתעניינות ב-AutoLog · צוות AutoLog</p>
</td></tr></table></td></tr></table></body></html>`;
      await sendEmail({
        to: application.email,
        subject: `AutoLog — עדכון לגבי בקשת ההצטרפות של ${application.garageName}`,
        html: rejectionHtml,
      });
    } catch (emailErr) {
      logger.warn('Failed to send rejection email to applicant', {
        email: application.email,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }

    return jsonResponse({
      message: 'הבקשה נדחתה בהצלחה.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}