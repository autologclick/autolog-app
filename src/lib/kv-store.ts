/**
 * KV Store Abstraction — Vercel KV with in-memory fallback.
 *
 * Why this file exists:
 *   The previous rate-limit / lockout / suspicious-IP tracking was kept in
 *   in-memory Maps that wipe on every cold start and don't sync across
 *   serverless instances. This wrapper lets us migrate to Vercel KV
 *   (Upstash Redis) without breaking anything if KV isn't provisioned.
 *
 * Behaviour:
 *   1. If `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set in env AND
 *      the `@vercel/kv` package is installed → KV is used.
 *   2. Otherwise → falls back to in-memory Map (same as today).
 *   3. If a KV call throws at runtime (network blip, quota, etc.) → the
 *      operation degrades to in-memory for that call only.
 *
 * The public surface is small and domain-specific (not raw Redis), so the
 * call sites in rate-limit.ts stay clean and testable.
 */

// ---------------------------------------------------------------------------
// Module-level KV client cache
// ---------------------------------------------------------------------------

// Loaded lazily — the dynamic import is guarded so a missing package doesn't
// crash the app. The first call to anything in this file triggers loadKv()
// exactly once per cold start.
type VercelKv = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
};

let kvClient: VercelKv | null = null;
let kvLoadAttempted = false;

async function loadKv(): Promise<VercelKv | null> {
  if (kvLoadAttempted) return kvClient;
  kvLoadAttempted = true;

  // No env vars → don't even try to import. Stay on in-memory.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }

  try {
    // Dynamic import — if the package isn't installed yet, the catch
    // below keeps us on in-memory. Once `npm i @vercel/kv` runs and
    // KV is provisioned, this path lights up automatically.
    const mod = await import('@vercel/kv');
    kvClient = mod.kv as VercelKv;
    return kvClient;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// In-memory fallback store (TTL-aware)
// ---------------------------------------------------------------------------

interface MemoryEntry {
  value: unknown;
  expiresAt: number; // epoch ms; 0 = never expires
}

const memoryStore = new Map<string, MemoryEntry>();

function memoryGet<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value as T;
}

function memorySet<T>(key: string, value: T, ttlSeconds: number): void {
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
  memoryStore.set(key, { value, expiresAt });
}

function memoryDel(key: string): void {
  memoryStore.delete(key);
}

// Periodic cleanup so the memory store doesn't grow without bound when
// running long enough between cold starts. 5-minute interval matches the
// existing cleanup cadence in rate-limit.ts.
if (typeof global !== 'undefined' && !(global as { __kvStoreCleanup?: boolean }).__kvStoreCleanup) {
  (global as { __kvStoreCleanup?: boolean }).__kvStoreCleanup = true;
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore.entries()) {
      if (v.expiresAt && v.expiresAt < now) memoryStore.delete(k);
    }
  }, 5 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Public API — small, opinionated, domain-friendly
// ---------------------------------------------------------------------------

/**
 * Get a JSON value by key. Returns null if missing or expired.
 * Falls back to in-memory on KV failure.
 */
export async function kvGetJson<T>(key: string): Promise<T | null> {
  const kv = await loadKv();
  if (kv) {
    try {
      const val = await kv.get<T>(key);
      return val ?? null;
    } catch {
      /* fall through to memory */
    }
  }
  return memoryGet<T>(key);
}

/**
 * Set a JSON value with a TTL (in seconds). Mirrors to memory as well
 * so subsequent reads on the same instance are fast even if KV is slow.
 */
export async function kvSetJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  // Always update the local memory copy — cheap, and provides a safety net
  // if KV calls start failing mid-request.
  memorySet(key, value, ttlSeconds);

  const kv = await loadKv();
  if (kv) {
    try {
      await kv.set(key, value, ttlSeconds > 0 ? { ex: ttlSeconds } : undefined);
    } catch {
      /* memory already has it */
    }
  }
}

/**
 * Delete a key. Best-effort on both KV and memory.
 */
export async function kvDel(key: string): Promise<void> {
  memoryDel(key);
  const kv = await loadKv();
  if (kv) {
    try { await kv.del(key); } catch { /* ignore */ }
  }
}

/**
 * Atomic counter increment with first-time TTL.
 *
 * Returns the NEW count after increment. On the very first increment for
 * a key, sets the TTL. Subsequent increments don't reset the TTL — so a
 * sliding window stays anchored to when the first request hit.
 *
 * Implementation detail: KV uses INCR + EXPIRE (atomic on Redis side).
 * In-memory uses a wrapped MemoryEntry. Both produce the same observable
 * behavior to callers.
 */
export async function kvIncrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
  const kv = await loadKv();
  if (kv) {
    try {
      const newCount = await kv.incr(key);
      if (newCount === 1) {
        // First increment in this window — set the expiry.
        await kv.expire(key, ttlSeconds);
      }
      return newCount;
    } catch {
      /* fall through to memory */
    }
  }

  // In-memory path
  const existing = memoryGet<{ count: number }>(key);
  if (existing && typeof existing.count === 'number') {
    existing.count += 1;
    // Keep same TTL — don't refresh
    const entry = memoryStore.get(key);
    if (entry) memoryStore.set(key, { value: existing, expiresAt: entry.expiresAt });
    return existing.count;
  }
  memorySet(key, { count: 1 }, ttlSeconds);
  return 1;
}

/**
 * True if Vercel KV is configured AND reachable. Useful for health checks
 * and the admin dashboard to surface "rate limits persistent: yes/no".
 */
export async function isKvAvailable(): Promise<boolean> {
  const kv = await loadKv();
  if (!kv) return false;
  try {
    // Lightweight ping — set+get a known key with 1-second TTL.
    await kv.set('__kv_health__', 1, { ex: 1 });
    const v = await kv.get<number>('__kv_health__');
    return v === 1;
  } catch {
    return false;
  }
}
