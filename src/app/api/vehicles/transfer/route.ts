import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
  enforceRateLimit,
  sanitizeInput,
} from '@/lib/api-helpers';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// ─── helpers ───────────────────────────────────────────────────────
function generateCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F1B9"
}

function buildTransferEmailHtml(
  sellerName: string,
  vehicleLabel: string,
  code: string,
  appUrl: string,
  isRegistered: boolean,
) {
  const actionLink = isRegistered
    ? `${appUrl}/user/vehicles/transfer/accept?code=${code}`
    : `${appUrl}/auth/login?mode=register&transfer=${code}`;
  const actionText = isRegistered ? 'צפה ואשר העברה' : 'הירשם ואשר העברה';

  return `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;">
    <div style="background:#f8fafc;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
      <h2 style="color:#1e40af;margin-top:0;">🚗 העברת בעלות על רכב</h2>
      <p><strong>${sellerName}</strong> רוצה להעביר לך את הרכב <strong>${vehicleLabel}</strong> באפליקציית AutoLog.</p>
      <p>קוד האימות שלך: <span style="font-family:monospace;font-size:24px;font-weight:bold;color:#1e40af;letter-spacing:4px;">${code}</span></p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${actionLink}" style="background:#1e40af;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">
          ${actionText}
        </a>
      </div>
      <p style="font-size:13px;color:#64748b;">הבקשה תפוג בעוד 7 ימים. אם אינך מכיר את השולח — התעלם מהודעה זו.</p>
      <p style="margin-top:20px;color:#94a3b8;font-size:12px;">— AutoLog</p>
    </div>
  </div>`;
}

function buildCancelRequestEmailHtml(
  requesterName: string,
  vehicleLabel: string,
  appUrl: string,
) {
  return `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;">
    <div style="background:#fef2f2;border-radius:12px;padding:24px;border:1px solid #fecaca;">
      <h2 style="color:#dc2626;margin-top:0;">⚠️ בקשת ביטול העברת בעלות</h2>
      <p><strong>${requesterName}</strong> ביקש לבטל את העברת הבעלות על הרכב <strong>${vehicleLabel}</strong>.</p>
      <p>כדי שהביטול ייכנס לתוקף, יש לאשר אותו:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${appUrl}/user/vehicles/transfer" style="background:#dc2626;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">
          צפה בבקשות העברה
        </a>
      </div>
      <p style="margin-top:20px;color:#94a3b8;font-size:12px;">— AutoLog</p>
    </div>
  </div>`;
}

// ─── POST — Create transfer request (seller initiates) ─────────────
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { vehicleId, toEmail, includeInspections, includeTreatments, includeExpenses, includeDocuments } = body;

    if (!vehicleId || !toEmail) {
      return errorResponse('יש למלא מזהה רכב ומייל של הקונה', 400);
    }

    const cleanEmail = sanitizeInput(toEmail).toLowerCase().trim();

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return errorResponse('כתובת מייל לא תקינה', 400);
    }

    // Can't transfer to yourself
    const seller = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, fullName: true },
    });
    if (!seller) return errorResponse('משתמש לא נמצא', 404);

    if (seller.email.toLowerCase() === cleanEmail) {
      return errorResponse('אין אפשרות להעביר רכב לעצמך', 400);
    }

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: payload.userId },
    });
    if (!vehicle) {
      return errorResponse('הרכב לא נמצא או שאינך הבעלים', 404);
    }

    // Check for existing pending transfer
    const existingTransfer = await prisma.vehicleTransfer.findFirst({
      where: {
        vehicleId,
        status: { in: ['pending', 'accepted'] },
      },
    });
    if (existingTransfer) {
      return errorResponse('כבר קיימת בקשת העברה פעילה לרכב זה', 400);
    }

    // Check if buyer is a registered user
    const buyer = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, fullName: true },
    });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const transfer = await prisma.vehicleTransfer.create({
      data: {
        vehicleId,
        fromUserId: payload.userId,
        toEmail: cleanEmail,
        toUserId: buyer?.id || null,
        status: 'pending',
        verificationCode: code,
        expiresAt,
        includeInspections: includeInspections !== false,
        includeTreatments: includeTreatments !== false,
        includeExpenses: includeExpenses !== false,
        includeDocuments: includeDocuments !== false,
      },
    });

    // Create notification for buyer if registered
    if (buyer) {
      await prisma.notification.create({
        data: {
          userId: buyer.id,
          type: 'system',
          title: '🚗 בקשת העברת בעלות על רכב',
          message: `${seller.fullName} רוצה להעביר לך את הרכב ${vehicle.nickname || vehicle.licensePlate}. לחץ לצפייה ואישור.`,
          link: `/user/vehicles/transfer/accept?code=${code}`,
        },
      });
    }

    // Send email to buyer
    const vehicleLabel = `${vehicle.nickname || ''} ${vehicle.manufacturer} ${vehicle.model} (${vehicle.licensePlate})`.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';

    await sendEmail({
      to: cleanEmail,
      subject: `העברת בעלות על רכב — ${vehicleLabel}`,
      html: buildTransferEmailHtml(seller.fullName, vehicleLabel, code, appUrl, !!buyer),
    });

    return jsonResponse({
      message: buyer
        ? 'בקשת ההעברה נשלחה! הקונה יקבל התראה במערכת ובמייל'
        : 'בקשת ההעברה נשלחה! הקונה יקבל הזמנה להרשמה במייל',
      transferId: transfer.id,
      buyerRegistered: !!buyer,
    }, 201);

  } catch (error) {
    return handleApiError(error);
  }
}

// ─── GET — List transfers (sent / received) ───────────────────────
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all'; // sent | received | all

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true },
    });
    if (!user) return errorResponse('משתמש לא נמצא', 404);

    const where =
      type === 'sent'
        ? { fromUserId: payload.userId }
        : type === 'received'
          ? { OR: [{ toUserId: payload.userId }, { toEmail: user.email.toLowerCase() }] }
          : {
              OR: [
                { fromUserId: payload.userId },
                { toUserId: payload.userId },
                { toEmail: user.email.toLowerCase() },
              ],
            };

    const transfers = await prisma.vehicleTransfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        vehicleId: true,
        fromUserId: true,
        toEmail: true,
        toUserId: true,
        status: true,
        expiresAt: true,
        includeInspections: true,
        includeTreatments: true,
        includeExpenses: true,
        includeDocuments: true,
        cancelRequestedBy: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // Enrich with vehicle and user info
    const vehicleIds = [...new Set(transfers.map((t: { vehicleId: string }) => t.vehicleId))] as string[];
    const fromUserIds = [...new Set(transfers.map((t: { fromUserId: string }) => t.fromUserId))] as string[];

    const [vehicles, users] = await Promise.all([
      prisma.vehicle.findMany({
        where: { id: { in: vehicleIds } },
        select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true, year: true, imageUrl: true },
      }),
      prisma.user.findMany({
        where: { id: { in: fromUserIds } },
        select: { id: true, fullName: true, email: true },
      }),
    ]);

    const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = transfers.map((t: any) => ({
      ...t,
      vehicle: vehicleMap[t.vehicleId] || null,
      fromUser: userMap[t.fromUserId] || null,
      isSender: t.fromUserId === payload.userId,
      isExpired: t.status === 'pending' && new Date(t.expiresAt) < new Date(),
    }));

    return jsonResponse({ transfers: enriched });

  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PATCH — Accept / Cancel transfer ──────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { transferId, action, code } = body;
    // action: "accept" | "reject" | "cancel_request" | "cancel_confirm"

    if (!transferId || !action) {
      return errorResponse('פרמטרים חסרים', 400);
    }

    const transfer = await prisma.vehicleTransfer.findUnique({
      where: { id: transferId },
    });
    if (!transfer) return errorResponse('העברה לא נמצאה', 404);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) return errorResponse('משתמש לא נמצא', 404);

    const isSender = transfer.fromUserId === payload.userId;
    const isReceiver = transfer.toUserId === payload.userId || transfer.toEmail === user.email.toLowerCase();

    if (!isSender && !isReceiver) {
      return errorResponse('אין הרשאה לפעולה זו', 403);
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: transfer.vehicleId },
      select: { nickname: true, licensePlate: true, manufacturer: true, model: true },
    });
    const vehicleLabel = vehicle
      ? `${vehicle.nickname || ''} ${vehicle.manufacturer} ${vehicle.model} (${vehicle.licensePlate})`.trim()
      : 'רכב';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';

    // ── ACCEPT (buyer) ──
    if (action === 'accept') {
      if (!isReceiver) return errorResponse('רק הקונה יכול לאשר', 403);
      if (transfer.status !== 'pending') return errorResponse('ההעברה אינה ממתינה לאישור', 400);

      // Check expiry
      if (new Date(transfer.expiresAt) < new Date()) {
        await prisma.vehicleTransfer.update({ where: { id: transferId }, data: { status: 'cancelled' } });
        return errorResponse('בקשת ההעברה פגה. יש ליצור בקשה חדשה.', 400);
      }

      // Verify code
      if (!code || code.toUpperCase() !== transfer.verificationCode) {
        return errorResponse('קוד אימות שגוי', 400);
      }

      // Link buyer if not linked yet
      const updateData: Record<string, unknown> = { status: 'accepted' };
      if (!transfer.toUserId) {
        updateData.toUserId = payload.userId;
      }

      await prisma.vehicleTransfer.update({ where: { id: transferId }, data: updateData });

      // Notify seller
      await prisma.notification.create({
        data: {
          userId: transfer.fromUserId,
          type: 'system',
          title: '✅ העברת בעלות אושרה',
          message: `${user.fullName} אישר/ה את העברת הרכב ${vehicleLabel}. לחץ להשלמת ההעברה.`,
          link: `/user/vehicles/transfer`,
        },
      });

      return jsonResponse({ message: 'ההעברה אושרה! ממתינים להשלמה על ידי המוכר.' });
    }

    // ── REJECT (buyer declines) ──
    if (action === 'reject') {
      if (!isReceiver) return errorResponse('רק הקונה יכול לדחות', 403);
      if (transfer.status !== 'pending') return errorResponse('ההעברה אינה ממתינה', 400);

      await prisma.vehicleTransfer.update({ where: { id: transferId }, data: { status: 'cancelled', cancelledAt: new Date() } });

      // Notify seller
      await prisma.notification.create({
        data: {
          userId: transfer.fromUserId,
          type: 'system',
          title: '❌ העברת בעלות נדחתה',
          message: `הקונה דחה את העברת הרכב ${vehicleLabel}.`,
          link: `/user/vehicles/transfer`,
        },
      });

      return jsonResponse({ message: 'ההעברה נדחתה.' });
    }

    // ── CANCEL REQUEST (either side can initiate) ──
    if (action === 'cancel_request') {
      if (!['pending', 'accepted'].includes(transfer.status)) {
        return errorResponse('אין אפשרות לבטל העברה בסטטוס זה', 400);
      }

      // If still pending — sender can cancel directly
      if (transfer.status === 'pending' && isSender) {
        await prisma.vehicleTransfer.update({
          where: { id: transferId },
          data: { status: 'cancelled', cancelledAt: new Date(), cancelRequestedBy: payload.userId },
        });
        return jsonResponse({ message: 'ההעברה בוטלה.' });
      }

      // If accepted — need both sides to confirm
      if (transfer.cancelRequestedBy) {
        // Someone already requested — check it's the other party confirming
        if (transfer.cancelRequestedBy === payload.userId) {
          return errorResponse('כבר ביקשת ביטול. ממתינים לאישור הצד השני.', 400);
        }
        // Other party confirms
        await prisma.vehicleTransfer.update({
          where: { id: transferId },
          data: {
            status: 'cancelled',
            cancelConfirmedBy: payload.userId,
            cancelledAt: new Date(),
          },
        });

        // Notify the original cancel requester
        await prisma.notification.create({
          data: {
            userId: transfer.cancelRequestedBy,
            type: 'system',
            title: '🚫 ביטול העברה אושר',
            message: `הביטול של העברת הרכב ${vehicleLabel} אושר על ידי שני הצדדים.`,
            link: `/user/vehicles/transfer`,
          },
        });

        return jsonResponse({ message: 'הביטול אושר על ידי שני הצדדים. ההעברה בוטלה.' });
      }

      // First cancel request — notify other party
      await prisma.vehicleTransfer.update({
        where: { id: transferId },
        data: { cancelRequestedBy: payload.userId },
      });

      const otherPartyId = isSender ? transfer.toUserId : transfer.fromUserId;
      const otherPartyEmail = isSender ? transfer.toEmail : null;

      if (otherPartyId) {
        await prisma.notification.create({
          data: {
            userId: otherPartyId,
            type: 'system',
            title: '⚠️ בקשת ביטול העברת בעלות',
            message: `${user.fullName} ביקש/ה לבטל את העברת הרכב ${vehicleLabel}. נדרש אישורך.`,
            link: `/user/vehicles/transfer`,
          },
        });
      }

      // Also send email
      const emailTarget = isSender ? transfer.toEmail : null;
      if (emailTarget) {
        await sendEmail({
          to: emailTarget,
          subject: `בקשת ביטול העברת רכב — ${vehicleLabel}`,
          html: buildCancelRequestEmailHtml(user.fullName, vehicleLabel, appUrl),
        });
      }

      return jsonResponse({ message: 'בקשת הביטול נשלחה. ממתינים לאישור הצד השני.' });
    }

    return errorResponse('פעולה לא מזוהה', 400);

  } catch (error) {
    return handleApiError(error);
  }
}
