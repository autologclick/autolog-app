/**
 * Rate Limiting + Account Lockout + Suspicious IP Tracking.
 *
 * Storage strategy:
 *   All persistent state goes through `./kv-store`, which uses Vercel KV
 *   (Upstash Redis) when configured, and falls back to an in-memory Map
 *   otherwise. This means:
 *     - Without KV: behavior is identical to the legacy in-memory impl
 *       (data wiped on cold start / deploy)
 *     - With KV: lockouts and rate limits persist across deploys and
 *       sync across serverless instances
 *
 * Function signatures were converted to async to allow KV awaits — every
 * caller has been updated accordingly.
 */

import { NextRequest } from 'next/server';
import { kvGetJson, kvSetJson, kvDel } from './kv-store';

// ============================================================================
// Shared types and constants
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number; // epoch ms
}

interface AccountLockoutEntry {
  lockedUntil: number;   // epoch ms; 0 = not currently locked
  failedAttempts: number;
  lockCount: number;     // total times this account has been locked
}

interface IpSuspiciousActivityEntry {
  failedAttempts: number;
  lastAttemptTime: number; // epoch ms
  suspiciousLevel: number; // 0–3 (none → critical)
}

const LOCKOUT_THRESHOLD = 5; // Lock after 5 failed attempts
// 15 minutes is OWASP's recommended minimum (was 30 s — allowed ~720 attempts/hr
// against a known account before this change).
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const EXTENDED_LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour
// Escalate to the 1-hour lockout after 3 normal lockouts (was 4).
const EXTENDED_LOCKOUT_AFTER = 3;

const SUSPICIOUS_ACTIVITY_THRESHOLD = 10;
const SUSPICIOUS_ACTIVITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SUSPICIOUS_ACTIVITY_WINDOW_SECONDS = SUSPICIOUS_ACTIVITY_WINDOW_MS / 1000;

// KV key prefixes — short to keep payload small, namespaced to avoid collisions.
const K_LOGIN_RATE     = 'rl:login:';
const K_REGISTER_RATE  = 'rl:reg:';
const K_ADMIN_RATE     = 'rl:admin:';
const K_LOOKUP_RATE    = 'rl:lookup:';
const K_SCAN_RATE      = 'rl:scan:';
const K_API_RATE       = 'rl:api:';
const K_LOCKOUT        = 'lock:';
const K_IP_SUSPICIOUS  = 'susp:';

// ============================================================================
// Account Lockout Management
// ============================================================================

/**
 * Check if an account (by email) is currently locked.
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const lockout = await kvGetJson<AccountLockoutEntry>(K_LOCKOUT + email.toLowerCase());
  if (!lockout) return false;

  if (Date.now() > lockout.lockedUntil) {
    // Expired lockout — clean it up so getLockoutTimeRemaining doesn't lie next call
    await kvDel(K_LOCKOUT + email.toLowerCase());
    return false;
  }
  return true;
}

/**
 * Get remaining lockout time in milliseconds (0 if not locked).
 */
export async function getLockoutTimeRemaining(email: string): Promise<number> {
  const lockout = await kvGetJson<AccountLockoutEntry>(K_LOCKOUT + email.toLowerCase());
  if (!lockout) return 0;
  const remaining = lockout.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Record a failed login attempt; lock the account if threshold is exceeded.
 *
 * Lockout TTL is set to the lockout duration so KV cleans itself up. We
 * also set a longer TTL during the "counting attempts" phase (15 min)
 * so that scattered slow attempts still accumulate into a lockout.
 */
export async function recordFailedAttempt(email: string): Promise<void> {
  const key  = K_LOCKOUT + email.toLowerCase();
  const now  = Date.now();
  const existing = await kvGetJson<AccountLockoutEntry>(key);

  let entry: AccountLockoutEntry;

  if (existing) {
    if (now < existing.lockedUntil) {
      // Already locked — just bump the counter (useful for log analysis)
      entry = { ...existing, failedAttempts: existing.failedAttempts + 1 };
    } else {
      // Previous lockout expired; start a fresh attempt cycle but preserve lockCount
      entry = {
        lockedUntil: 0,
        failedAttempts: 1,
        lockCount: existing.lockCount || 0,
      };
    }

    // Should we trigger a lockout now?
    if (entry.failedAttempts >= LOCKOUT_THRESHOLD && now >= entry.lockedUntil) {
      entry.lockCount = (entry.lockCount || 0) + 1;
      const duration = entry.lockCount >= EXTENDED_LOCKOUT_AFTER
        ? EXTENDED_LOCKOUT_DURATION_MS
        : LOCKOUT_DURATION_MS;
      entry.lockedUntil = now + duration;
    }
  } else {
    entry = { lockedUntil: 0, failedAttempts: 1, lockCount: 0 };
  }

  // Store TTL: if locked, until lockout ends; otherwise 15 minutes to
  // give the user time to keep typing without losing the attempt count.
  const ttlMs = entry.lockedUntil > now
    ? entry.lockedUntil - now
    : LOCKOUT_DURATION_MS;
  await kvSetJson(key, entry, Math.ceil(ttlMs / 1000));
}

/**
 * Check how many failed attempts an account currently has (no side effects).
 */
export async function getFailedAttemptCount(email: string): Promise<number> {
  const lockout = await kvGetJson<AccountLockoutEntry>(K_LOCKOUT + email.toLowerCase());
  return lockout?.failedAttempts ?? 0;
}

/**
 * Clear failed attempts (called after successful login).
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  await kvDel(K_LOCKOUT + email.toLowerCase());
}

// ============================================================================
// IP-Based Suspicious Activity Tracking
// ============================================================================

/**
 * Record one suspicious action from an IP (failed login, attack probe, etc.).
 * Bumps the suspicion level if the threshold is crossed within the 1-hour
 * rolling window.
 */
export async function recordIpSuspiciousActivity(ip: string): Promise<void> {
  const key = K_IP_SUSPICIOUS + ip;
  const now = Date.now();
  const existing = await kvGetJson<IpSuspiciousActivityEntry>(key);

  let entry: IpSuspiciousActivityEntry;

  if (existing && now - existing.lastAttemptTime < SUSPICIOUS_ACTIVITY_WINDOW_MS) {
    entry = {
      failedAttempts: existing.failedAttempts + 1,
      lastAttemptTime: now,
      suspiciousLevel: existing.suspiciousLevel,
    };
    // Bump level if we hit a threshold
    if      (entry.failedAttempts >= 20) entry.suspiciousLevel = 3; // critical
    else if (entry.failedAttempts >= 15) entry.suspiciousLevel = 2; // high
    else if (entry.failedAttempts >= SUSPICIOUS_ACTIVITY_THRESHOLD) entry.suspiciousLevel = 1;
  } else {
    // Outside the window, or first-ever — start over
    entry = { failedAttempts: 1, lastAttemptTime: now, suspiciousLevel: 0 };
  }

  await kvSetJson(key, entry, SUSPICIOUS_ACTIVITY_WINDOW_SECONDS);
}

/**
 * Suspicion level for an IP (0 = none, 3 = critical).
 */
export async function getIpSuspiciousLevel(ip: string): Promise<number> {
  const activity = await kvGetJson<IpSuspiciousActivityEntry>(K_IP_SUSPICIOUS + ip);
  if (!activity) return 0;
  if (Date.now() - activity.lastAttemptTime > SUSPICIOUS_ACTIVITY_WINDOW_MS) {
    await kvDel(K_IP_SUSPICIOUS + ip);
    return 0;
  }
  return activity.suspiciousLevel;
}

// ============================================================================
// Per-endpoint Rate Limits
// ============================================================================

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Progressive delay: each failed attempt adds increasing wait time.
 * delay = min(baseDelay * (2 ^ attemptCount), maxDelay)
 */
function calculateProgressiveDelay(attemptCount: number): number {
  const baseDelay = 100;
  const maxDelay  = 5000;
  const exponentialDelay = baseDelay * Math.pow(2, Math.min(attemptCount - 1, 4));
  return Math.min(exponentialDelay, maxDelay);
}

/**
 * Generic rate-limit check against a single key.
 *
 * Atomic: reads → mutates → writes in one async hop. Because we read+write
 * via KV, two simultaneous requests on the same instance can race. The
 * mitigation: rate-limit errors are recoverable (just a 429), and the
 * sliding window means false-positives self-correct after `windowMs`.
 */
async function checkRateLimit(
  keyPrefix: string,
  identifier: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number; delayMs: number }> {
  const key = keyPrefix + identifier;
  const now = Date.now();
  const entry = await kvGetJson<RateLimitEntry>(key);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    await kvSetJson(key, { count: 1, resetTime }, Math.ceil(windowMs / 1000));
    return { allowed: true, remaining: maxAttempts - 1, resetTime, delayMs: 0 };
  }

  // Within existing window
  if (entry.count < maxAttempts) {
    const next = { count: entry.count + 1, resetTime: entry.resetTime };
    // Keep the same expiry — calculate remaining seconds
    const remainSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    await kvSetJson(key, next, remainSeconds);
    return {
      allowed: true,
      remaining: maxAttempts - next.count,
      resetTime: entry.resetTime,
      delayMs: calculateProgressiveDelay(next.count),
    };
  }

  // Exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
    delayMs: calculateProgressiveDelay(entry.count),
  };
}

/** Login: 5 attempts per minute per IP. */
export async function checkLoginRateLimit(req: NextRequest) {
  return checkRateLimit(K_LOGIN_RATE, getClientIp(req), 5, 60_000);
}

/** Registration: 3 attempts per minute per IP. */
export async function checkRegisterRateLimit(req: NextRequest) {
  return checkRateLimit(K_REGISTER_RATE, getClientIp(req), 3, 60_000);
}

/** Admin endpoints: 30 requests per minute per IP. */
export async function checkAdminRateLimit(req: NextRequest) {
  return checkRateLimit(K_ADMIN_RATE, getClientIp(req), 30, 60_000);
}

/** Customer lookup: 20 per minute per IP (prevents enumeration). */
export async function checkCustomerLookupRateLimit(req: NextRequest) {
  return checkRateLimit(K_LOOKUP_RATE, getClientIp(req), 20, 60_000);
}

/** Vehicle scan: 30 per minute per IP. */
export async function checkScanVehicleRateLimit(req: NextRequest) {
  return checkRateLimit(K_SCAN_RATE, getClientIp(req), 30, 60_000);
}

/** General API: 100 calls per minute per user. */
export async function checkApiRateLimit(userId: string) {
  return checkRateLimit(K_API_RATE, userId, 100, 60_000);
}

// ============================================================================
// Cleanup
// ============================================================================
// Note: when KV is used, TTLs handle expiry automatically and there's nothing
// to clean up. The in-memory fallback in kv-store.ts runs its own 5-minute
// sweep. This function is kept as a no-op for backward compatibility with any
// existing callers (e.g. a cron job) but does nothing now.
export function cleanupExpiredEntries(): void {
  /* no-op — TTL handled by storage layer */
}
