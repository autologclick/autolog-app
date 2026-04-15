import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, handleApiError, errorResponse } from '@/lib/api-helpers';
import { createShareToken } from '@/lib/share-tokens';

/**
 * POST /api/vehicles/[id]/share-link
 * Returns a signed public URL for sharing vehicle history with a buyer.
 * Only the owner (or admin) can create one.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!vehicle) return errorResponse('רכב לא נמצא', 404);
    if (payload.role !== 'admin' && vehicle.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    const { token, expiresAt } = createShareToken('vehicle-history', id);
    const origin = new URL(req.url).origin;
    const url = `${origin}/api/public/vehicle-history/${id}?token=${token}&exp=${expiresAt}`;

    return jsonResponse({ url, expiresAt });
  } catch (error) {
    return handleApiError(error);
  }
}
