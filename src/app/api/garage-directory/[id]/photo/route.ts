import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, handleApiError } from '@/lib/api-helpers';
import { isPlacesConfigured, buildPhotoMediaUrl } from '@/lib/integrations/google-places';

// GET /api/garage-directory/[id]/photo
// Server-side proxy for a garage's Google Places photo. Keeps the API key off the
// client. INERT until GOOGLE_PLACES_API_KEY is set: returns 404 when not configured
// or when the garage has no stored photoRef (the UI then falls back to the generic
// category gradient).

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
      select: { photoRef: true, photoAttribution: true },
    });
    if (!garage?.photoRef) {
      return NextResponse.json({ error: 'no photo' }, { status: 404 });
    }

    const mediaUrl = buildPhotoMediaUrl(garage.photoRef, 800);
    if (!mediaUrl) return NextResponse.json({ error: 'not configured' }, { status: 404 });

    const upstream = await fetch(mediaUrl);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'upstream error' }, { status: 502 });
    }

    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'image/jpeg');
    // cache at the edge/browser; Google photo bytes are re-fetched, not persisted
    headers.set('Cache-Control', 'private, max-age=86400');
    if (garage.photoAttribution) {
      headers.set('X-Photo-Attribution', encodeURIComponent(garage.photoAttribution));
    }
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}
