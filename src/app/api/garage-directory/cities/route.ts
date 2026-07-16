import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

// GET /api/garage-directory/cities
// Returns the list of cities that have at least one active directory garage,
// each with its garage count. Used to populate the city picker.
// Response: { cities: [{ city, count }], total }

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const grouped = await prisma.garageDirectory.groupBy({
      by: ['city'],
      where: { active: true },
      _count: { _all: true },
    });

    const cities = grouped
      .map((g) => ({ city: g.city, count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ cities, total: cities.length });
  } catch (error) {
    return handleApiError(error);
  }
}
