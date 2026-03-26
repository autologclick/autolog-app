import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, handleApiError, getPaginationParams, paginationMeta } from '@/lib/api-helpers';

// GET /api/garage/reviews - Get reviews for garage owned by current user
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const { page, skip, limit } = getPaginationParams(req);

    // Find garage owned by current user
    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
    });

    if (!garage) {
      return jsonResponse({ reviews: [], total: 0, averageRating: 0 });
    }

    // Get reviews for this garage
    const reviews = await prisma.garageReview.findMany({
      where: { garageId: garage.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.garageReview.count({
      where: { garageId: garage.id },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    return jsonResponse({
      reviews,
      averageRating: parseFloat(averageRating as string),
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
