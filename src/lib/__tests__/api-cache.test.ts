import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { cacheJsonResponse } from '../api-cache';
import { getCacheStore } from '../cache-store';

function makeReq(url: string): NextRequest {
  return new NextRequest(new Request(url));
}

describe('cacheJsonResponse', () => {
  beforeEach(() => {
    // Clear cache between tests so one test's entries don't leak
    const cache = getCacheStore();
    cache.delete('api:test:/api/things');
    cache.delete('api:test:/api/things?q=x');
    cache.delete('api:test:/api/things?q=y');
  });

  it('returns MISS on first call and HIT on second call', async () => {
    let fetcherCalls = 0;
    const fetcher = async () => {
      fetcherCalls++;
      return { items: [fetcherCalls] };
    };

    const req = makeReq('http://localhost/api/things');
    const r1 = await cacheJsonResponse(req, 'api:test', 60_000, fetcher);
    const r2 = await cacheJsonResponse(req, 'api:test', 60_000, fetcher);

    expect(r1.headers.get('X-Cache')).toBe('MISS');
    expect(r2.headers.get('X-Cache')).toBe('HIT');
    expect(fetcherCalls).toBe(1);

    const body1 = await r1.json();
    const body2 = await r2.json();
    expect(body1).toEqual({ items: [1] });
    expect(body2).toEqual({ items: [1] }); // same cached body, not re-fetched
  });

  it('caches different query strings separately', async () => {
    let fetcherCalls = 0;
    const fetcher = async () => {
      fetcherCalls++;
      return { n: fetcherCalls };
    };

    const r1 = await cacheJsonResponse(makeReq('http://localhost/api/things?q=x'), 'api:test', 60_000, fetcher);
    const r2 = await cacheJsonResponse(makeReq('http://localhost/api/things?q=y'), 'api:test', 60_000, fetcher);

    expect(r1.headers.get('X-Cache')).toBe('MISS');
    expect(r2.headers.get('X-Cache')).toBe('MISS'); // different query, new key
    expect(fetcherCalls).toBe(2);
  });

  it('expires entries after TTL', async () => {
    let fetcherCalls = 0;
    const fetcher = async () => {
      fetcherCalls++;
      return { n: fetcherCalls };
    };

    const req = makeReq('http://localhost/api/things');
    await cacheJsonResponse(req, 'api:test', 1, fetcher); // 1ms TTL

    // Wait for expiration
    await new Promise(r => setTimeout(r, 10));

    const r2 = await cacheJsonResponse(req, 'api:test', 1, fetcher);
    expect(r2.headers.get('X-Cache')).toBe('MISS');
    expect(fetcherCalls).toBe(2);
  });
});
