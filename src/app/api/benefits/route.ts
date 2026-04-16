import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { handleApiError, getPaginationParams, paginationMeta } from '@/lib/api-helpers';
import { cacheJsonResponse } from '@/lib/api-cache';

// Club benefits change infrequently (admin-managed), so 10 minute cache is safe.
const BENEFITS_CACHE_TTL_MS = 10 * 60 * 1000;

// GET /api/benefits - List club benefits
export async function GET(req: NextRequest) {
  try {
    return await cacheJsonResponse(req, 'api:benefits', BENEFITS_CACHE_TTL_MS, async () => {
      const { page, skip, limit } = getPaginationParams(req);
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

      return { benefits, ...paginationMeta(total, page, limit) };
    });
  } catch (error) {
    return handleApiError(error);
  }
}
