import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { NOT_FOUND, SUCCESS_MESSAGES, VALIDATION_ERRORS } from '@/lib/messages';

// GET /api/garages/[id]/reviews - Get reviews for a garage
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const garage = await prisma.garage.findUnique({ where: { id: params.id } });
    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    const reviews = await prisma.garageReview.findMany({
      where: { garageId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const total = await prisma.garageReview.count({ where: { garageId: params.id } });

    const avgRating = reviews.length > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    return jsonResponse({ reviews, total, averageRating: avgRating });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/garages/[id]/reviews - Submit a review for a garage
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse('דירוג חייב להיות בין 1 ל-5', 400);
    }

    const garage = await prisma.garage.findUnique({ where: { id: params.id } });
    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    // Review integrity: only customers with a completed appointment at this
    // garage may post a review.
    const completed = await prisma.appointment.findFirst({
      where: {
        garageId: params.id,
        userId: payload.userId,
        status: 'completed',
      },
      select: { id: true },
    });
    if (!completed) {
      return errorResponse('ניתן לכתוב ביקורת רק לאחר שהושלם טיפול במוסך זה', 403);
    }

    // Get user name
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { fullName: true },
    });

    // Check if user already reviewed this garage (allow only one per user)
    const existingReview = await prisma.garageReview.findFirst({
      where: { garageId: params.id, userName: user?.fullName || '' },
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await prisma.garageReview.update({
        where: { id: existingReview.id },
        data: {
          rating: Math.round(rating),
          comment: comment || null,
        },
      });
    } else {
      // Create new review
      review = await prisma.garageReview.create({
        data: {
          garageId: params.id,
          userName: user?.fullName || 'משתמש',
          rating: Math.round(rating),
          comment: comment || null,
        },
      });
    }

    // Recalculate garage rating
    const allReviews = await prisma.garageReview.findMany({
      where: { garageId: params.id },
      select: { rating: true },
    });

    const newAvg = allReviews.length > 0
      ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
      : 0;

    await prisma.garage.update({
      where: { id: params.id },
      data: {
        rating: newAvg,
        reviewCount: allReviews.length,
      },
    });

    return jsonResponse({ review, newRating: newAvg, message: SUCCESS_MESSAGES.SAVED }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
