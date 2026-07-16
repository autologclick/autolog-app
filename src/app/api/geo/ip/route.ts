export const runtime = 'nodejs';        // geoip-lite reads local data files
export const dynamic = 'force-dynamic';

/**
 * GET /api/geo/ip
 * Approximate location by the client's IP address (no permissions needed).
 * Used as a fallback when browser geolocation is blocked/unavailable.
 *
 * PRIMARY: self-hosted geoip-lite (offline, no API key, and crucially the IP
 * never leaves our server). FALLBACK: ipwho.is (external) only if the local DB
 * can't resolve the IP — this preserves coverage for existing callers (e.g. the
 * SOS map). Accuracy is city-level — never used as a final/precise location.
 *
 * PRIVACY: the IP and derived location are never logged or stored.
 *
 * Returns { latitude, longitude, city, nearestCity } or 404 when unresolved.
 * `nearestCity` is the closest of our directory cities (Hebrew), letting the
 * garage finder switch to local results while keeping manual city override.
 */

import { NextRequest } from 'next/server';
import geoip from 'geoip-lite';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || '';
}

function isPublicIp(ip: string): boolean {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1') return false;
  if (/^10\./.test(ip) || /^192\.168\./.test(ip)) return false;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) return false;
  return true;
}

async function nearestDirectoryCity(lat: number, lng: number): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ city: string }[]>`
      SELECT city FROM "GarageDirectory"
      WHERE lat IS NOT NULL AND active = true
      ORDER BY (power(lat - ${lat}, 2) + power(lng - ${lng}, 2)) ASC
      LIMIT 1`;
    return rows[0]?.city ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const ip = clientIp(req);
    if (!isPublicIp(ip)) return errorResponse('לא ניתן לזהות מיקום לפי החיבור', 404);

    // 1) self-hosted lookup — the IP stays on our server
    const geo = geoip.lookup(ip);
    if (geo && geo.ll && Number.isFinite(geo.ll[0]) && Number.isFinite(geo.ll[1])) {
      const [latitude, longitude] = geo.ll;
      return jsonResponse({
        latitude,
        longitude,
        city: geo.city || '',
        nearestCity: await nearestDirectoryCity(latitude, longitude),
      });
    }

    // 2) fallback to external service only when the local DB can't resolve it
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!r.ok) return errorResponse('שירות המיקום לא זמין כרגע', 502);

    const data = await r.json();
    if (!data || data.success === false || !Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
      return errorResponse('לא ניתן לזהות מיקום לפי החיבור', 404);
    }

    return jsonResponse({
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || '',
      nearestCity: await nearestDirectoryCity(data.latitude, data.longitude),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
