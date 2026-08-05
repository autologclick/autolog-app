import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Client-side geolocation diagnostics: the find-garage page reports WHY
// navigator.geolocation failed so we can debug device-specific issues
// from the server logs (pm2 logs, grep geo-debug).
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json().catch(() => null);
    console.log('[geo-debug]', payload.userId, JSON.stringify(body).slice(0, 600));
    return jsonResponse({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
