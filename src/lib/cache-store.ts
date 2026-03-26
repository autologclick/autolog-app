/**
 * Abstract cache store interface.
 * Currently uses in-memory Map. To migrate to Redis:
 * 1. Install ioredis: npm install ioredis
 * 2. Implement RedisCacheStore below
 * 3. Change createCacheStore() to return RedisCacheStore
 *
 * All rate limiting, token blacklist, and session data will automatically use Redis.
 */

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  has(key: string): boolean;
  /** Remove all expired entries */
  cleanup(): void;
}

interface MemoryEntry<T> {
  value: T;
  expiresAt?: number;
}

/**
 * In-memory cache store (default for development/single-instance).
 * Data is lost on server restart and not shared across instances.
 */
class MemoryCacheStore implements CacheStore {
  private store = new Map<string, MemoryEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  has(key: string): boolean {
    const val = this.get(key);
    return val !== undefined;
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.store.forEach((entry, key) => {
      if (entry.expiresAt && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.store.delete(key));
  }
}

/**
 * Redis cache store (for production/multi-instance).
 * Uncomment and configure when Redis is available.
 *
 * Requirements: npm install ioredis
 *
 * class RedisCacheStore implements CacheStore {
 *   private client: Redis;
 *   constructor(redisUrl: string) {
 *     this.client = new Redis(redisUrl);
 *   }
 *   async get<T>(key: string): Promise<T | undefined> {
 *     const val = await this.client.get(key);
 *     return val ? JSON.parse(val) : undefined;
 *   }
 *   async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
 *     if (ttlMs) {
 *       await this.client.set(key, JSON.stringify(value), 'PX', ttlMs);
 *     } else {
 *       await this.client.set(key, JSON.stringify(value));
 *     }
 *   }
 *   async delete(key: string): Promise<void> { await this.client.del(key); }
 *   async has(key: string): Promise<boolean> { return (await this.client.exists(key)) === 1; }
 *   async cleanup(): Promise<void> { /* Redis TTL handles this automatically */ }
 * }
 */

/** Singleton cache store instance */
let cacheInstance: CacheStore | null = null;

/**
 * Get the application cache store.
 * Returns MemoryCacheStore by default.
 * To use Redis, change this function to return RedisCacheStore.
 */
export function getCacheStore(): CacheStore {
  if (!cacheInstance) {
    // TODO: When Redis is available, switch to:
    // cacheInstance = new RedisCacheStore(process.env.REDIS_URL!);
    cacheInstance = new MemoryCacheStore();
  }
  return cacheInstance;
}
