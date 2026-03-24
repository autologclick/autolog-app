import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, handleApiError, getPaginationParams } from '@/lib/api-helpers';

// GET /api/garages - List garages (public, filterable, sortable)
export async function GET(req: NextRequest) {
  try {
    const { skip, limit } = getPaginationParams(req);
    const url = new URL(req.url);
    const city = url.searchParams.get('city');
    const search = url.searchParams.get('search');
    const partnersOnly = url.searchParams.get('partners') === 'true';
    const sortBy = url.searchParams.get('sort') || 'rating'; // rating | name | city | reviewCount

    let where: any = { isActive: true };
    if (city) where.city = city;
    if (partnersOnly) where.isPartner = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determine sort order
    let orderBy: any = { rating: 'desc' };
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

    return jsonResponse({
      garages,
      total,
      cities: cities.map(c => c.city),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
