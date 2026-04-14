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
      return jsonResponse({ message: SUCCESS_MESSAGES.TREATMENT_APPROVED });
    }

    if (action === 'reject') {
      const rejected = await rejectTreatment(params.id, payload.userId, reason);
      if (!rejected) {
        return errorResponse(TREATMENT_ERRORS.CANNOT_REJECT, 400);
      }
      return jsonResponse({ message: SUCCESS_MESSAGES.TREATMENT_REJECTED });
    }

    return errorResponse(TREATMENT_ERRORS.INVALID_ACTION, 400);
  } catch (error) {
    return handleApiError(error);
  }
}
