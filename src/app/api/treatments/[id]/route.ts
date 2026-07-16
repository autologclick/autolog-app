import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { NOT_FOUND, TREATMENT_ERRORS, SUCCESS_MESSAGES } from '@/lib/messages';
import {
  getTreatmentById,
  updateTreatment,
  deleteTreatment,
  approveTreatment,
  rejectTreatment,
} from '@/lib/treatments-db';
import prisma from '@/lib/db';
import { updateVehicleMileage, MileageError } from '@/lib/mileage';
import { createNotification } from '@/lib/services/notification-service';
import { sendEmail, buildTreatmentEmailHtml } from '@/lib/email';
import { sendPushToUser } from '@/lib/push-sender';

const TREATMENT_TYPE_HEB: Record<string, string> = {
  maintenance: 'טיפול תקופתי',
  repair: 'תיקון',
  oil_change: 'החלפת שמן',
  tires: 'צמיגים',
  brakes: 'בלמים',
  electrical: 'חשמל',
  ac: 'מיזוג',
  bodywork: 'פחחות/צבע',
  inspection: 'אבחון',
  other: 'אחר',
};

/**
 * Notify the garage owner when their customer approves or rejects a treatment.
 * Best-effort — does not throw on failure.
 */
async function notifyGarageOfDecision(
  treatmentId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string,
) {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: {
        vehicle: { select: { nickname: true, licensePlate: true, manufacturer: true, model: true } },
        user: { select: { fullName: true } },
      },
    });
    if (!treatment || !treatment.garageId) return;

    const garage = await prisma.garage.findUnique({
      where: { id: treatment.garageId },
      select: { ownerId: true, name: true, owner: { select: { email: true, fullName: true } } },
    });
    if (!garage) return;

    const vehicleLabel = treatment.vehicle.nickname || `${treatment.vehicle.manufacturer} ${treatment.vehicle.model}`;
    const customerName = treatment.user.fullName || 'לקוח/ה';
    const typeLabel = TREATMENT_TYPE_HEB[treatment.type] || treatment.type;

    const reasonSuffix = decision === 'rejected' && rejectionReason ? ` סיבה: ${rejectionReason}` : '';

    // 1. In-app notification
    createNotification({
      userId: garage.ownerId,
      type: 'system',
      title: decision === 'approved' ? 'הטיפול אושר ✅' : 'הטיפול נדחה ❌',
      message: `${customerName} ${decision === 'approved' ? 'אישר/ה' : 'דחה/דחתה'} את הטיפול "${treatment.title}" לרכב ${vehicleLabel} (${treatment.vehicle.licensePlate}).${reasonSuffix}`,
      link: '/garage/treatments',
    }).catch(() => {});

    // 2. Email to garage owner
    if (garage.owner?.email) {
      sendEmail({
        to: garage.owner.email,
        subject: `AutoLog — ${decision === 'approved' ? 'טיפול אושר' : 'טיפול נדחה'} ע״י ${customerName}`,
        html: buildTreatmentEmailHtml({
          recipientName: garage.owner.fullName || 'בעל/ת מוסך',
          garageName: garage.name,
          vehicleLabel: `${vehicleLabel} (${treatment.vehicle.licensePlate})`,
          treatmentTitle: treatment.title,
          treatmentType: typeLabel,
          cost: treatment.cost,
          mileage: treatment.mileage,
          date: treatment.date,
          status: decision,
          rejectionReason,
          description: treatment.description,
        }),
      }).catch(() => {});
    }

    // 3. Push notification
    sendPushToUser(garage.ownerId, {
      title: decision === 'approved' ? '✅ טיפול אושר' : '❌ טיפול נדחה',
      body: `${customerName}: ${treatment.title} — ${vehicleLabel}`,
      tag: `treatment-${treatmentId}-${decision}`,
      data: { link: '/garage/treatments', type: `treatment_${decision}` },
    }).catch(() => {});
  } catch {
    // best-effort; never break the response
  }
}

// GET /api/treatments/[id] - Get single treatment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const treatment = await getTreatmentById(params.id);

    if (!treatment || treatment.userId !== payload.userId) {
      return errorResponse(NOT_FOUND.TREATMENT, 404);
    }

    return jsonResponse({ treatment });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/treatments/[id] - Update treatment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const updated = await updateTreatment(params.id, payload.userId, body);
    if (!updated) {
      return errorResponse(TREATMENT_ERRORS.UNAUTHORIZED, 404);
    }

    const treatment = await getTreatmentById(params.id);

    // Sync the linked Expense so dashboard totals stay consistent
    if (treatment) {
      try {
        const existing = await prisma.expense.findUnique({ where: { treatmentId: treatment.id } });
        if (treatment.cost && treatment.cost > 0) {
          const desc = treatment.title + (treatment.garageName ? ' (' + treatment.garageName + ')' : '');
          if (existing) {
            await prisma.expense.update({
              where: { id: existing.id },
              data: { amount: treatment.cost, description: desc, date: new Date(treatment.date) },
            });
          } else {
            await prisma.expense.create({
              data: {
                vehicleId: treatment.vehicleId,
                category: 'maintenance',
                amount: treatment.cost,
                description: desc,
                date: new Date(treatment.date),
                treatmentId: treatment.id,
              },
            });
          }
        } else if (existing) {
          // Cost was cleared — remove the orphan expense
          await prisma.expense.delete({ where: { id: existing.id } });
        }
      } catch (e) {
        console.warn('[treatments] expense sync failed', e);
      }
    }

    return jsonResponse({ treatment, message: SUCCESS_MESSAGES.TREATMENT_UPDATED });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/treatments/[id] - Delete treatment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const deleted = await deleteTreatment(params.id, payload.userId);

    if (!deleted) {
      return errorResponse(TREATMENT_ERRORS.UNAUTHORIZED, 404);
    }

    return jsonResponse({ message: SUCCESS_MESSAGES.TREATMENT_DELETED });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/treatments/[id] - Approve or reject
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const { action, reason } = body;

    if (action === 'approve') {
      const approved = await approveTreatment(params.id, payload.userId);
      if (!approved) {
        return errorResponse(TREATMENT_ERRORS.CANNOT_APPROVE, 400);
      }
      // Notify garage owner — best-effort, fire-and-forget
      notifyGarageOfDecision(params.id, 'approved').catch(() => {});
      // Mirror cost into expense tracking on approval (idempotent)
      try {
        const t = await getTreatmentById(params.id);
        if (t && t.mileage && t.mileage > 0) {
          try {
            await updateVehicleMileage(t.vehicleId, t.mileage);
          } catch (me) {
            if (!(me instanceof MileageError)) console.warn('[treatments] approve mileage update failed', me);
          }
        }
        if (t && t.cost && t.cost > 0) {
          const existing = await prisma.expense.findUnique({ where: { treatmentId: t.id } });
          const desc = t.title + (t.garageName ? ' (' + t.garageName + ')' : '');
          if (existing) {
            await prisma.expense.update({ where: { id: existing.id }, data: { amount: t.cost, description: desc, date: new Date(t.date) } });
          } else {
            await prisma.expense.create({ data: { vehicleId: t.vehicleId, category: 'maintenance', amount: t.cost, description: desc, date: new Date(t.date), treatmentId: t.id } });
          }
        }
      } catch (e) {
        console.warn('[treatments] approve expense sync failed', e);
      }
      return jsonResponse({ message: SUCCESS_MESSAGES.TREATMENT_APPROVED });
    }

    if (action === 'reject') {
      const rejected = await rejectTreatment(params.id, payload.userId, reason);
      if (!rejected) {
        return errorResponse(TREATMENT_ERRORS.CANNOT_REJECT, 400);
      }
      // Notify garage owner — best-effort, fire-and-forget
      notifyGarageOfDecision(params.id, 'rejected', reason).catch(() => {});
      return jsonResponse({ message: SUCCESS_MESSAGES.TREATMENT_REJECTED });
    }

    return errorResponse(TREATMENT_ERRORS.INVALID_ACTION, 400);
  } catch (error) {
    return handleApiError(error);
  }
}
