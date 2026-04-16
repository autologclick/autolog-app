import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { handleApiError, getPaginationParams, paginationMeta } from '@/lib/api-helpers';
import { cacheJsonResponse } from '@/lib/api-cache';

// Cache TTL for garage list — 5 minutes.
// Garages are created/updated rarely (by admin approval flow); short TTL
// is enough to keep data fresh while still absorbing most traffic.
const GARAGES_CACHE_TTL_MS = 5 * 60 * 1000;

// GET /api/garages - List garages (public, filterable, sortable)
export async function GET(req: NextRequest) {
  try {
    return await cacheJsonResponse(req, 'api:garages', GARAGES_CACHE_TTL_MS, async () => {
      const { page, skip, limit } = getPaginationParams(req);
      const url = new URL(req.url);
      const city = url.searchParams.get('city');
      const search = url.searchParams.get('search');
      const partnersOnly = url.searchParams.get('partners') === 'true';
      const sortBy = url.searchParams.get('sort') || 'rating'; // rating | name | city | reviewCount

      const where: Prisma.GarageWhereInput = { isActive: true };
      if (city) where.city = city;
      if (partnersOnly) where.isPartner = true;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Determine sort order
      let orderBy: Prisma.GarageOrderByWithRelationInput = { rating: 'desc' };
      if (sortBy === 'name') orderBy = { name: 'asc' };
      else if (sortBy === 'city') orderBy = { city: 'asc' };
      else if (sortBy === 'reviewCount') orderBy = { reviewCount: 'desc' };
      else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

      const [garages, total] = await Promise.all([
        prisma.garage.findMany({
          where,
          include: {
            _count: { select: { inspections: true, reviews: true, appointments: true } },
            reviews: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              select: { id: true, userName: true, rating: true, comment: true, createdAt: true },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.garage.count({ where }),
      ]);

      // Get distinct cities for filter options
      const cities = await prisma.garage.findMany({
        where: { isActive: true },
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      });

      return {
        garages,
        cities: cities.map(c => c.city),
        ...paginationMeta(total, page, limit),
      };
    });
  } catch (error) {
    return handleApiError(error);
  }
}
