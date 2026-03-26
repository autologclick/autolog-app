import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { jsonResponse, handleApiError, getPaginationParams } from '@/lib/api-helpers';

// GET /api/benefits - List club benefits
export async function GET(req: NextRequest) {
  try {
    const { skip, limit } = getPaginationParams(req);
    const url = new URL(req.url);
    const category = url.searchParams.get('category');

    const where: Prisma.ClubBenefitWhereInput = { isActive: true };
    if (category && category !== 'הכל') where.category = category;

    const [benefits, total] = await Promise.all([
      prisma.clubBenefit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.clubBenefit.count({ where }),
    ]);

    return jsonResponse({ benefits, total });
  } catch (error) {
    return handleApiError(error);
  }
}
