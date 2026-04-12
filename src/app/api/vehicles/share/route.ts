import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { sendEmail, buildVehicleShareRequestEmailHtml } from '@/lib/email';

// POST /api/vehicles/share — Request to share a vehicle
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { licensePlate } = body;

    if (!licensePlate) {
      return errorResponse('מספר רכב נדרש', 400);
    }

    const cleanPlate = licensePlate.replace(/[-\s]/g, '');

    // Find the vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: cleanPlate },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    if (!vehicle) {
      return errorResponse('רכב לא נמצא במערכת', 404);
    }

    // Can't share with yourself
    if (vehicle.userId === payload.userId) {
      return errorResponse('אין אפשרות לשתף רכב עם עצמך', 400);
    }

    // Get requesting user details
    const requestingUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, fullName: true },
    });

    if (!requestingUser) {
      return errorResponse('משתמש לא נמצא', 404);
    }

    // Check if already shared or pending
    const existing = await prisma.vehicleShare.findUnique({
      where: {
        vehicleId_sharedWithEmail: {
          vehicleId: vehicle.id,
          sharedWithEmail: requestingUser.email,
        },
      },
    });

    if (existing) {
      if (existing.status === 'approved') {
        return errorResponse('הרכב כבר משותף איתך', 400);
      }
      // If pending or rejected, reset to pending and re-send email
      await prisma.vehicleShare.update({
        where: { id: existing.id },
        data: { status: 'pending', updatedAt: new Date() },
      });
    } else {
      await prisma.vehicleShare.create({
        data: {
          vehicleId: vehicle.id,
          ownerUserId: vehicle.userId,
          sharedWithEmail: requestingUser.email,
          sharedWithUserId: payload.userId,
          status: 'pending',
        },
      });
    }

    // Send email to vehicle owner
    const vehicleLabel = `${vehicle.nickname || ''} (${vehicle.licensePlate})`.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';

    await sendEmail({
      to: vehicle.user.email,
      subject: `בקשת שיתוף רכב — ${vehicleLabel}`,
      html: buildVehicleShareRequestEmailHtml(
        vehicle.user.fullName,
        requestingUser.fullName,
        requestingUser.email,
        vehicleLabel,
        `${appUrl}/user/vehicles`,
      ),
    });

    return jsonResponse({
      message: 'בקשת השיתוף נשלחה בהצלחה! הבעלים יקבל הודעה במייל',
      ownerName: vehicle.user.fullName.charAt(0) + '***',
    }, 201);

  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/vehicles/share — List share requests (as owner or as requester)
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'received'; // received | sent

    if (type === 'received') {
      // Requests others sent TO me (I'm the owner)
      const requests = await prisma.vehicleShare.findMany({
        where: { ownerUserId: payload.userId },
        include: {
          vehicle: { select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true } },
          sharedUser: { select: { fullName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return jsonResponse({ requests });
    } else {
      // Requests I sent to others
      const requests = await prisma.vehicleShare.findMany({
        where: { sharedWithUserId: payload.userId },
        include: {
          vehicle: { select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true } },
          owner: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return jsonResponse({ requests });
    }

  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/vehicles/share — Approve or reject a share request
export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { shareId, action } = body;

    if (!shareId || !['approve', 'reject'].includes(action)) {
      return errorResponse('פרמטרים לא תקינים', 400);
    }

    const share = await prisma.vehicleShare.findUnique({
      where: { id: shareId },
      include: {
        vehicle: { select: { nickname: true, licensePlate: true } },
        sharedUser: { select: { email: true, fullName: true } },
      },
    });

    if (!share) {
      return errorResponse('בקשת שיתוף לא נמצאה', 404);
    }

    // Only the vehicle owner can approve/reject
    if (share.ownerUserId !== payload.userId) {
      return errorResponse('אין הרשאה לפעולה זו', 403);
    }

    if (share.status !== 'pending') {
      return errorResponse('בקשה זו כבר טופלה', 400);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await prisma.vehicleShare.update({
      where: { id: shareId },
      data: { status: newStatus },
    });

    // Notify the requester by email
    if (share.sharedUser?.email) {
      const vehicleLabel = `${share.vehicle.nickname || ''} (${share.vehicle.licensePlate})`.trim();
      const statusText = action === 'approve' ? 'אושרה' : 'נדחתה';
      await sendEmail({
        to: share.sharedUser.email,
        subject: `בקשת שיתוף רכב ${statusText} — ${vehicleLabel}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;">
          <h2>בקשת שיתוף ${statusText}</h2>
          <p>הבקשה שלך לשתף את הרכב <strong>${vehicleLabel}</strong> ${statusText}.</p>
          ${action === 'approve' ? '<p>הרכב נוסף לרשימת הרכבים שלך ב-AutoLog.</p>' : '<p>בעל הרכב בחר לא לאשר את השיתוף.</p>'}
          <p style="margin-top:20px;color:#888;">— AutoLog</p>
        </div>`,
      });
    }

    const msg = action === 'approve' ? 'השיתוף אושר בהצלחה' : 'הבקשה נדחתה';
    return jsonResponse({ message: msg });

  } catch (error) {
    return handleApiError(error);
  }
}
