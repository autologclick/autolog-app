import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/api-helpers';
import { isPlacesConfigured, isPhotoStale, enrichGaragePhoto } from '@/lib/integrations/google-places';

// POST /api/garage-directory/[id]/enrich
// Lazily match a directory garage to Google Places and cache its photo reference.
// INERT until GOOGLE_PLACES_API_KEY is set (returns 404). When configured, it is
// idempotent + cheap: skips the Google call while the cached photoRef is fresh
// (< 30 days). Intended to be driven by a cron batch (or a lazy client trigger)
// once Places is enabled.

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(req);

    if (!isPlacesConfigured()) {
      return NextResponse.json({ error: 'not configured' }, { status: 404 });
    }

    const id = Number(params.id);
    if (!id || !Number.isInteger(id)) {
      return NextResponse.json({ error: 'bad id' }, { status: 400 });
    }

    const garage = await prisma.garageDirectory.findUnique({
      where: { id },
      select: { id: true, name: true, address: true, city: true, photoRef: true, photoFetchedAt: true },
    });
    if (!garage) return NextResponse.json({ error: 'not found' }, { status: 404 });

    // fresh cache → nothing to do
    if (garage.photoRef && !isPhotoStale(garage.photoFetchedAt)) {
      return NextResponse.json({ photoUrl: `/api/garage-directory/${id}/photo`, cached: true });
    }

    const result = await enrichGaragePhoto(garage.name, garage.address, garage.city);
    await prisma.garageDirectory.update({
      where: { id },
      data: {
        placeId: result?.placeId ?? null,
        photoRef: result?.photoRef ?? null,
        photoAttribution: result?.photoAttribution ?? null,
        photoFetchedAt: new Date(),
      },
    });

    return NextResponse.json({
      photoUrl: result?.photoRef ? `/api/garage-directory/${id}/photo` : null,
      matched: !!result?.placeId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
