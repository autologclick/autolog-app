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

// POST /api/vehicles/share
// Two flows:
//  A) Owner-initiated invite  { vehicleId, sharedWithEmail } — the owner grants
//     access to someone (family / employee). Approved immediately by definition.
//  B) Requester-initiated     { licensePlate } — someone asks the owner for access
//     (the original flow, triggered when adding an already-registered plate).
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { licensePlate, vehicleId, sharedWithEmail } = body;

    // ── Flow A: owner invites someone to a vehicle they own ──
    if (vehicleId && sharedWithEmail) {
      const email = String(sharedWithEmail).trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return errorResponse('כתובת מייל לא תקינה', 400);
      }

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: String(vehicleId) },
        select: { id: true, userId: true, nickname: true, licensePlate: true },
      });
      if (!vehicle) return errorResponse('רכב לא נמצא', 404);
      if (vehicle.userId !== payload.userId) {
        return errorResponse('אפשר לשתף רק רכב בבעלותך', 403);
      }

      const owner = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { fullName: true, email: true },
      });
      if (owner?.email && owner.email.toLowerCase() === email) {
        return errorResponse('אין אפשרות לשתף רכב עם עצמך', 400);
      }

      // link to an existing account when the invitee is already registered;
      // otherwise the share is linked on signup (see /api/auth/register)
      const invitee = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, fullName: true },
      });

      await prisma.vehicleShare.upsert({
        where: { vehicleId_sharedWithEmail: { vehicleId: vehicle.id, sharedWithEmail: email } },
        create: {
          vehicleId: vehicle.id,
          ownerUserId: payload.userId,
          sharedWithEmail: email,
          sharedWithUserId: invitee?.id ?? null,
          status: 'approved', // the owner is the authority — no extra approval needed
        },
        update: {
          status: 'approved',
          ...(invitee?.id ? { sharedWithUserId: invitee.id } : {}),
        },
      });

      const vehicleLabel = `${vehicle.nickname || ''} (${vehicle.licensePlate})`.trim();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
      await sendEmail({
        to: email,
        subject: `שותף איתך רכב ב-AutoLog — ${vehicleLabel}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;">
          <h2>שותף איתך רכב</h2>
          <p><strong>${owner?.fullName || 'בעל הרכב'}</strong> שיתף איתך את הרכב <strong>${vehicleLabel}</strong> ב-AutoLog.</p>
          ${invitee
            ? `<p>הרכב כבר מופיע ברשימת הרכבים שלך.</p><p><a href="${appUrl}/user/vehicles">לצפייה ברכב</a></p>`
            : `<p>כדי לצפות ברכב, יש להירשם ל-AutoLog עם כתובת המייל הזו — והרכב יופיע אצלך אוטומטית.</p><p><a href="${appUrl}/auth/signup">להרשמה</a></p>`}
          <p style="margin-top:20px;color:#888;">— AutoLog</p>
        </div>`,
      });

      return jsonResponse({
        message: invitee
          ? 'הרכב שותף בהצלחה'
          : 'ההזמנה נשלחה — הרכב יופיע אצלו מיד לאחר ההרשמה',
      }, 201);
    }

    // ── Flow B: requester asks the owner for access (by plate) ──
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
    const rateLimitError = await enforceRateLimit(payload.userId);
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
    const rateLimitError = await enforceRateLimit(payload.userId);
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

// DELETE /api/vehicles/share — owner revokes a share / removes a member
export async function DELETE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json().catch(() => null);
    const shareId = body?.shareId;
    if (!shareId) return errorResponse('פרמטרים לא תקינים', 400);

    const share = await prisma.vehicleShare.findUnique({
      where: { id: String(shareId) },
      select: { id: true, ownerUserId: true },
    });
    if (!share) return errorResponse('שיתוף לא נמצא', 404);
    if (share.ownerUserId !== payload.userId) {
      return errorResponse('אין הרשאה לפעולה זו', 403);
    }

    await prisma.vehicleShare.delete({ where: { id: share.id } });
    return jsonResponse({ message: 'השיתוף בוטל' });
  } catch (error) {
    return handleApiError(error);
  }
}
