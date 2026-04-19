import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, handleApiError, errorResponse } from '@/lib/api-helpers';
import { createShareToken } from '@/lib/share-tokens';

/**
 * POST /api/inspections/[id]/share-link
 * Returns a signed public URL for downloading the inspection PDF.
 * Allowed for: vehicle owner, garage that performed the inspection, or admin.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      select: {
        vehicle: { select: { userId: true } },
        garage: { select: { ownerId: true } },
      },
    });
    if (!inspection) return errorResponse('בדיקה לא נמצאה', 404);

    // Allow: admin, vehicle owner, or garage owner who performed the inspection
    const isAdmin = payload.role === 'admin';
    const isVehicleOwner = inspection.vehicle.userId === payload.userId;
    const isGarageOwner = inspection.garage?.ownerId === payload.userId;

    if (!isAdmin && !isVehicleOwner && !isGarageOwner) {
      return errorResponse('אין הרשאה', 403);
    }

    const { token, expiresAt } = createShareToken('inspection-pdf', id);
    const origin = new URL(req.url).origin;
    const url = `${origin}/api/public/inspections/${id}/pdf?token=${token}&exp=${expiresAt}`;

    return jsonResponse({ url, expiresAt });
  } catch (error) {
    return handleApiError(error);
  }
}
