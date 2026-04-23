import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';

/**
 * GET /api/bodywork/[id] — Get a single bodywork request with all quotes
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const request = await prisma.bodyworkRequest.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, phone: true, email: true, city: true } },
        vehicle: { select: { nickname: true, manufacturer: true, model: true, year: true, licensePlate: true, color: true } },
        quotes: {
          include: {
            garage: { select: { id: true, name: true, city: true, rating: true, reviewCount: true, phone: true, imageUrl: true, logoUrl: true } },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!request) return errorResponse('בקשה לא נמצאה', 404);

    // Access control: owner, admin, or garage owner who submitted a quote
    if (
      payload.role !== 'admin' &&
      request.userId !== payload.userId &&
      payload.role !== 'garage_owner'
    ) {
      return errorResponse('אין הרשאה', 403);
    }

    return jsonResponse(request);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * DELETE /api/bodywork/[id] — Cancel a bodywork request (owner or admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const request = await prisma.bodyworkRequest.findUnique({ where: { id } });
    if (!request) return errorResponse('בקשה לא נמצאה', 404);

    if (payload.role !== 'admin' && request.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    if (request.status === 'accepted' || request.status === 'completed') {
      return errorResponse('לא ניתן לבטל בקשה שכבר אושרה', 400);
    }

    await prisma.bodyworkRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
