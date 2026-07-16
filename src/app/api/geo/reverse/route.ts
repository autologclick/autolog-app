export const dynamic = 'force-dynamic';

/**
 * GET /api/geo/reverse?lat=..&lon=..
 * Reverse geocoding via OpenStreetMap Nominatim (Hebrew), proxied server-side
 * so the browser CSP stays untouched and we send a proper User-Agent.
 * Returns { address } — best-effort short address ("רחוב מספר, עיר").
 */

import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lon = parseFloat(url.searchParams.get('lon') || '');
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return errorResponse('קואורדינטות לא תקינות', 400);
    }

    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=he&zoom=18`,
      {
        headers: { 'User-Agent': 'AutoLog/1.0 (https://autolog.click)' },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      },
    );
    if (!r.ok) return errorResponse('שירות המיקום לא זמין כרגע', 502);

    const data = await r.json();
    const a = data.address || {};
    const street = [a.road, a.house_number].filter(Boolean).join(' ');
    const city = a.city || a.town || a.village || a.municipality || a.suburb;
    const address = [street, city].filter(Boolean).join(', ') || data.display_name || '';

    return jsonResponse({ address });
  } catch (error) {
    return handleApiError(error);
  }
}
