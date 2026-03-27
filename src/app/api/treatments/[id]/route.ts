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
