import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse, errorResponse, handleApiError, requireAuth } from '@/lib/api-helpers';
import { createRedemption, getUserRedemptions } from '@/lib/redemptions-db';
import prisma from '@/lib/db';

const createRedemptionSchema = z.object({
  benefitId: z.string().min(1, 'Benefit ID is required'),
});

// GET /api/redemptions - Fetch user's redemptions
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const userId = payload.userId;

    const redemptions = await getUserRedemptions(userId);

    return jsonResponse({ redemptions });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/redemptions - Create a new redemption
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const userId = payload.userId;

    const body = await req.json();
    const parsed = createRedemptionSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return errorResponse(firstError.message, 422);
    }

    const { benefitId } = parsed.data;

    // Fetch benefit details from Prisma
    const benefit = await prisma.clubBenefit.findUnique({
      where: { id: benefitId },
    });

    if (!benefit) {
      return errorResponse('Benefit not found', 404);
    }

    if (!benefit.isActive) {
      return errorResponse('This benefit is no longer available', 400);
    }

    // Create redemption with generated code
    const redemption = await createRedemption({
      benefitId: benefit.id,
      userId,
      benefitName: benefit.name,
      partnerName: benefit.partnerName || undefined,
      discount: benefit.discount,
      expiresAt: benefit.expiryDate ? new Date(benefit.expiryDate).toISOString() : undefined,
    });

    return jsonResponse(
      {
        id: redemption.id,
        code: redemption.code,
        qrData: redemption.qrData,
        benefitName: redemption.benefitName,
        partnerName: redemption.partnerName,
        discount: redemption.discount,
        expiresAt: redemption.expiresAt,
        status: redemption.status,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
