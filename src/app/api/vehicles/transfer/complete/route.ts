import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
  enforceRateLimit,
} from '@/lib/api-helpers';

// ─── POST — Complete the transfer (seller triggers after buyer accepted) ───
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { transferId } = body;

    if (!transferId) {
      return errorResponse('מזהה העברה נדרש', 400);
    }

    const transfer = await prisma.vehicleTransfer.findUnique({
      where: { id: transferId },
    });
    if (!transfer) return errorResponse('העברה לא נמצאה', 404);

    // Only seller can complete
    if (transfer.fromUserId !== payload.userId) {
      return errorResponse('רק המוכר יכול להשלים את ההעברה', 403);
    }

    if (transfer.status !== 'accepted') {
      return errorResponse('ההעברה טרם אושרה על ידי הקונה', 400);
    }

    if (!transfer.toUserId) {
      return errorResponse('הקונה עדיין לא רשום במערכת', 400);
    }

    const buyerId = transfer.toUserId;

    // ── Execute transfer in a transaction ──
    await prisma.$transaction(async (tx) => {
      // 1. Transfer the vehicle ownership
      await tx.vehicle.update({
        where: { id: transfer.vehicleId },
        data: {
          userId: buyerId,
          isPrimary: false, // buyer will set primary themselves
        },
      });

      // 2. Selectively transfer or delete related data

      // Inspections
      if (!transfer.includeInspections) {
        await tx.inspection.deleteMany({ where: { vehicleId: transfer.vehicleId } });
      }
      // If included — inspections stay linked to vehicleId, which now belongs to buyer

      // Treatments
      if (transfer.includeTreatments) {
        // Update userId on treatments to buyer
        await tx.treatment.updateMany({
          where: { vehicleId: transfer.vehicleId },
          data: { userId: buyerId },
        });
      } else {
        await tx.treatment.deleteMany({ where: { vehicleId: transfer.vehicleId } });
      }

      // Expenses
      if (!transfer.includeExpenses) {
        await tx.expense.deleteMany({ where: { vehicleId: transfer.vehicleId } });
      }
      // If included — expenses stay linked to vehicleId

      // Documents
      if (!transfer.includeDocuments) {
        await tx.document.deleteMany({ where: { vehicleId: transfer.vehicleId } });
      }
      // If included — documents stay linked to vehicleId

      // 3. Clean up: remove shares, drivers, SOS events (not transferable)
      await tx.vehicleShare.deleteMany({ where: { vehicleId: transfer.vehicleId } });
      await tx.vehicleDriver.deleteMany({ where: { vehicleId: transfer.vehicleId } });

      // 4. Cancel any pending/future appointments
      await tx.appointment.updateMany({
        where: {
          vehicleId: transfer.vehicleId,
          status: { in: ['pending', 'confirmed'] },
        },
        data: { status: 'cancelled' },
      });

      // 5. Mark transfer as completed
      await tx.vehicleTransfer.update({
        where: { id: transferId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // 6. Notify buyer
      await tx.notification.create({
        data: {
          userId: buyerId,
          type: 'system',
          title: '🎉 קיבלת רכב חדש!',
          message: 'העברת הבעלות הושלמה בהצלחה. הרכב נוסף לרשימת הרכבים שלך.',
          link: `/user/vehicles/${transfer.vehicleId}`,
        },
      });

      // 7. Notify seller
      await tx.notification.create({
        data: {
          userId: transfer.fromUserId,
          type: 'system',
          title: '✅ העברת הבעלות הושלמה',
          message: 'הרכב הועבר בהצלחה לקונה.',
          link: '/user/vehicles',
        },
      });
    });

    return jsonResponse({ message: 'העברת הבעלות הושלמה בהצלחה! הרכב הועבר לקונה.' });

  } catch (error) {
    return handleApiError(error);
  }
}
