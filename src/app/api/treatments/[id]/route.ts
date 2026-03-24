import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
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
      return errorResponse('טיפול לא נמצא', 404);
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
      return errorResponse('טיפול לא נמצא או שאין הרשאה', 404);
    }

    const treatment = await getTreatmentById(params.id);
    return jsonResponse({ treatment, message: 'הטיפול עודכן בהצלחה' });
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
      return errorResponse('טיפול לא נמצא או שאין הרשאה', 404);
    }

    return jsonResponse({ message: 'הטיפול נמחק בהצלחה' });
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
        return errorResponse('לא ניתן לאשר טיפול זה', 400);
      }
      return jsonResponse({ message: 'הטיפול אושר בהצלחה!' });
    }

    if (action === 'reject') {
      const rejected = await rejectTreatment(params.id, payload.userId, reason);
      if (!rejected) {
        return errorResponse('לא ניתן לדחות טיפול זה', 400);
      }
      return jsonResponse({ message: 'הטיפול נדחה' });
    }

    return errorResponse('פעולה לא תקינה', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
