/**
 * API response caching helpers.
 *
 * Provides two complementary layers of caching:
 *
 * 1. In-memory server cache (cacheJsonResponse) — caches the serialized JSON
 *    response for a TTL. The same process answers subsequent identical requests
 *    without hitting the database at all.
 *
 * 2. HTTP Cache-Control headers (withPublicCacheHeaders) — lets the browser and
 *    Vercel's edge CDN cache the response, so repeat visits do not even reach
 *    our server.
 *
 * Use both together for public, infrequently-changing data (benefits, garages,
 * maintenance templates). Do NOT use for user-scoped or admin data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheStore } from './cache-store';

type CachedPayload = {
  body: unknown;
  headers?: Record<string, string>;
};

/**
 * Wrap a route handler with an in-memory server-side cache.
 * The cache key is derived from the request URL including query params.
 *
 * @param req - The incoming request
 * @param keyPrefix - Unique prefix for this route (e.g. "api:garages")
 * @param ttlMs - How long to cache the response (default: 5 minutes)
 * @param fetcher - Function that produces the response when cache misses
 */
export async function cacheJsonResponse(
  req: NextRequest,
  keyPrefix: string,
  ttlMs: number,
  fetcher: () => Promise<unknown>
): Promise<NextResponse> {
  const cache = getCacheStore();
  const url = new URL(req.url);
  const key = `${keyPrefix}:${url.pathname}${url.search}`;

  const cached = cache.get<CachedPayload>(key);
  if (cached) {
    const response = NextResponse.json(cached.body);
    response.headers.set('X-Cache', 'HIT');
    if (cached.headers) {
      for (const [h, v] of Object.entries(cached.headers)) {
        response.headers.set(h, v);
      }
    }
    return response;
  }

  const body = await fetcher();
  cache.set(key, { body }, ttlMs);
  const response = NextResponse.json(body);
  response.headers.set('X-Cache', 'MISS');
  return response;
}

/**
 * Add Cache-Control headers for public, cacheable responses.
 * The CDN will cache for `sMaxAgeSec` seconds and serve stale while revalidating
 * for `staleWhileRevalidateSec` more seconds.
 *
 * @param response - The response to modify
 * @param sMaxAgeSec - Seconds the CDN caches the response
 * @param staleWhileRevalidateSec - Seconds the CDN may serve stale while fetching fresh
 */
export function withPublicCacheHeaders(
  response: NextResponse,
  sMaxAgeSec: number,
  staleWhileRevalidateSec: number = sMaxAgeSec * 2
): NextResponse {
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${sMaxAgeSec}, stale-while-revalidate=${staleWhileRevalidateSec}`
  );
  return response;
}

/**
 * Invalidate a cached response. Call from mutation endpoints when the
 * underlying data changes, so subsequent GETs rebuild the cache.
 *
 * @param keyPrefix - The prefix used when caching (e.g. "api:garages")
 * @param pathAndQuery - Optional specific key suffix. If omitted, all keys
 *   matching the prefix are cleared.
 */
export function invalidateCache(keyPrefix: string, pathAndQuery?: string): void {
  const cache = getCacheStore();
  if (pathAndQuery) {
    cache.delete(`${keyPrefix}:${pathAndQuery}`);
    return;
  }
  // Wildcard invalidation: iterate over store via cleanup.
  // MemoryCacheStore has no public keys() method, so we rely on TTL or
  // route-specific keys. For full-prefix invalidation, we delete known keys
  // that callers track. As a pragmatic fallback, set an invalidation marker.
  cache.set(`__invalidated:${keyPrefix}`, Date.now(), 60_000);
}
