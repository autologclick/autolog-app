import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, handleApiError, errorResponse } from '@/lib/api-helpers';

// GET /api/garage-directory
// Reference directory of MOT-authorized garages (data.gov.il). Requires a session.
// Query params:
//   city      (required)  — exact display-city name (see import script CITY_MAP)
//   category  (optional)  — one of MECHANICS | ELECTRICITY | BODYWORK | TIRES
//   limit     (optional)  — default 30, max 500
//   offset    (optional)  — default 0
//   sort      (optional)  — 'name' (default) | 'rating' (best first, unrated last)
// Response: { items: [...], total }
// Each item includes `professions` (Hebrew profession names) so the client can
// free-text search by profession without another round-trip.
//
// Route name is intentionally `garage-directory` to avoid colliding with the
// existing `/api/garages` module.

const VALID_CATEGORIES = ['MECHANICS', 'ELECTRICITY', 'BODYWORK', 'TIRES', 'WASH'];

export async function GET(req: NextRequest) {
  try {
    requireAuth(req); // defense-in-depth (middleware also gates /api)

    const url = new URL(req.url);
    const city = url.searchParams.get('city')?.trim();
    const category = url.searchParams.get('category')?.trim();

    if (!city) {
      return errorResponse('חובה לציין עיר (city)', 400);
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return errorResponse('קטגוריה לא חוקית', 400);
    }

    const sort = url.searchParams.get('sort') === 'rating' ? 'rating' : 'name';
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '30', 10) || 30, 1), 500);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

    const where: Prisma.GarageDirectoryWhereInput = { active: true, city };
    if (category) where.categories = { has: category };

    const [rowsRaw, total] = await Promise.all([
      prisma.garageDirectory.findMany({
        where,
        select: {
          id: true,
          licenseNum: true,
          name: true,
          type: true,
          address: true,
          city: true,
          phone: true,
          categories: true,
          professions: true,
          lat: true,
          lng: true,
          source: true,
          rating: true,
          userRatingCount: true,
          googleMapsUri: true,
          photoRef: true,
          photoAttribution: true,
        },
        // rating desc puts the best first; unrated places sort last, never hidden
        orderBy: sort === 'rating'
          ? [{ rating: { sort: 'desc', nulls: 'last' } }, { userRatingCount: 'desc' }]
          : [{ name: 'asc' }],
        ...(sort === 'rating' ? {} : { skip: offset }),
        ...(sort === 'rating' ? {} : { take: limit }),
      }),
      prisma.garageDirectory.count({ where }),
    ]);

    // IMDb-style Bayesian weighted rating: a 4.6 with 400 reviews should
    // outrank a 5.0 with only 10 reviews. Sorted here (not in SQL) on the
    // full city-scoped list, then paginated, so the order is globally correct.
    let rows = rowsRaw;
    if (sort === 'rating') {
      const rated = rowsRaw.filter((r) => r.rating != null && (r.userRatingCount ?? 0) > 0);
      const mean = rated.length > 0 ? rated.reduce((acc, r) => acc + (r.rating ?? 0), 0) / rated.length : 0;
      const M = 60; // reviews needed for a score to stand on its own
      const score = (r: (typeof rowsRaw)[number]) => {
        const v = r.userRatingCount ?? 0;
        if (r.rating == null || v <= 0) return -1;
        return (v / (v + M)) * (r.rating ?? 0) + (M / (v + M)) * mean;
      };
      rows = [...rowsRaw]
        .sort((a, b) => score(b) - score(a) || (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
        .slice(offset, offset + limit);
    }

    // photoUrl points at our proxy only when a photo has been enriched (phase B).
    // professions → flat Hebrew name list, so the client can free-text search by profession.
    const items = rows.map(({ photoRef, photoAttribution, professions, ...g }) => {
      const professionNames = Array.isArray(professions)
        ? (professions as { cod: string; name: string }[]).map((p) => p?.name).filter(Boolean)
        : [];
      return {
        ...g,
        professions: professionNames,
        photoUrl: photoRef ? `/api/garage-directory/${g.id}/photo` : null,
        photoAttribution: photoRef ? photoAttribution : null,
      };
    });

    return NextResponse.json({ items, total });
  } catch (error) {
    return handleApiError(error);
  }
}
