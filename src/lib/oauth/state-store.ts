import { randomUUID } from 'crypto';

/**
 * In-memory OAuth state store.
 *
 * Trade-off: only works inside a single Node.js process. The state is held in
 * process memory and survives the OAuth dance (which takes seconds). If you
 * scale to multiple PM2 workers (cluster mode) or multiple servers behind a
 * load balancer, swap this for Redis — the initiate request and the callback
 * may land on different workers, and the Map wouldn't be shared.
 *
 * Risk: if the Node process restarts mid-OAuth-dance, pending states are
 * lost and the affected user sees a 'state_expired' error and retries.
 * Acceptable for current single-instance PM2.
 */

const STATE_TTL_MS = 600_000; // 10 minutes

interface StoreEntry {
  data: OAuthStateData;
  expiresAt: number;
}

const store = new Map<string, StoreEntry>();

// Background sweep so the Map doesn't grow unbounded.
const sweepHandle = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt < now) store.delete(key);
  }
}, 60_000);
// Don't keep the event loop alive just for the sweep.
if (typeof sweepHandle.unref === 'function') sweepHandle.unref();

export interface OAuthStateData {
  codeVerifier: string;
  next?: string;
  referralCode?: string;
  createdAt: number;
}

export async function storeOAuthState(data: OAuthStateData): Promise<string> {
  const state = randomUUID().replace(/-/g, '');
  store.set(state, { data, expiresAt: Date.now() + STATE_TTL_MS });
  return state;
}

export async function consumeOAuthState(state: string): Promise<OAuthStateData | null> {
  if (!state || typeof state !== 'string') return null;
  const entry = store.get(state);
  if (!entry) return null;
  store.delete(state); // single-use
  if (entry.expiresAt < Date.now()) return null;
  return entry.data;
}
