import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface AccountLockoutEntry {
  lockedUntil: number; // Timestamp
  failedAttempts: number;
  lockCount: number; // Number of times account was locked
}

interface IpSuspiciousActivityEntry {
  failedAttempts: number;
  lastAttemptTime: number;
  suspiciousLevel: number; // 0-3 (low to high)
}

type RateLimitStore = Map<string, RateLimitEntry>;
type AccountLockoutStore = Map<string, AccountLockoutEntry>;
type IpSuspiciousActivityStore = Map<string, IpSuspiciousActivityEntry>;

// In-memory rate limit stores for different endpoints
const loginAttempts: RateLimitStore = new Map();
const registerAttempts: RateLimitStore = new Map();
const apiCallsPerUser: RateLimitStore = new Map();

// ============================================================================
// Account Lockout Management
// Protects against brute force attacks by locking accounts after failed attempts
// TODO: Migrate to Redis for production: SET lockout:{email} 1 EX 900 (15 minutes)
// ============================================================================
const accountLockouts: AccountLockoutStore = new Map();

const LOCKOUT_THRESHOLD = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds
const EXTENDED_LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour
const EXTENDED_LOCKOUT_AFTER = 4; // Extended lockout after 4 lockouts

/**
 * Check if an account (by email) is currently locked
 */
export function isAccountLocked(email: string): boolean {
  const lockout = accountLockouts.get(email.toLowerCase());
  if (!lockout) return false;

  const now = Date.now();
  if (now > lockout.lockedUntil) {
    // Lockout expired, remove it
    accountLockouts.delete(email.toLowerCase());
    return false;
  }

  return true;
}

/**
 * Get remaining lockout time in milliseconds
 */
export function getLockoutTimeRemaining(email: string): number {
  const lockout = accountLockouts.get(email.toLowerCase());
  if (!lockout) return 0;

  const remaining = lockout.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Record a failed login attempt for an account
 * Locks account if threshold is exceeded
 */
export function recordFailedAttempt(email: string): void {
  const key = email.toLowerCase();
  const now = Date.now();
  const lockout = accountLockouts.get(key);

  if (lockout) {
    // Check if lockout is still active
    if (now < lockout.lockedUntil) {
      // Already locked, increment counter (for logging purposes)
      lockout.failedAttempts++;
    } else {
      // Lockout expired, start new attempt cycle but keep lockCount
      const prevLockCount = lockout.lockCount || 0;
      lockout.failedAttempts = 1;
      lockout.lockCount = prevLockCount;
      lockout.lockedUntil = 0; // Reset lock until threshold is reached again
    }

    // Check if we need to lock
    if (lockout.failedAttempts >= LOCKOUT_THRESHOLD && now >= lockout.lockedUntil) {
      lockout.lockCount = (lockout.lockCount || 0) + 1;
      // Use extended lockout after N lockouts
      const duration = lockout.lockCount >= EXTENDED_LOCKOUT_AFTER
        ? EXTENDED_LOCKOUT_DURATION_MS
        : LOCKOUT_DURATION_MS;
      lockout.lockedUntil = now + duration;
    }
  } else {
    // First failed attempt
    accountLockouts.set(key, {
      lockedUntil: 0,
      failedAttempts: 1,
      lockCount: 0,
    });
  }
}

/**
 * Check failed attempts for an account (without locking)
 */
export function getFailedAttemptCount(email: string): number {
  const lockout = accountLockouts.get(email.toLowerCase());
  return lockout ? lockout.failedAttempts : 0;
}

/**
 * Reset failed attempts after successful login
 */
export function resetFailedAttempts(email: string): void {
  accountLockouts.delete(email.toLowerCase());
}

// ============================================================================
// IP-Based Suspicious Activity Tracking
// Monitors patterns of suspicious behavior from IP addresses
// TODO: Migrate to Redis for production: SET suspicious:{ip} {...} EX 3600
// ============================================================================
const ipSuspiciousActivity: IpSuspiciousActivityStore = new Map();

const SUSPICIOUS_ACTIVITY_THRESHOLD = 10; // Mark as suspicious after 10 attempts in window
const SUSPICIOUS_ACTIVITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Record suspicious activity from an IP
 * Tracks multiple failed attempts to detect attack patterns
 */
export function recordIpSuspiciousActivity(ip: string): void {
  const now = Date.now();
  const activity = ipSuspiciousActivity.get(ip);

  if (activity && now - activity.lastAttemptTime < SUSPICIOUS_ACTIVITY_WINDOW_MS) {
    // Within tracking window
    activity.failedAttempts++;
    activity.lastAttemptTime = now;

    // Calculate suspicion level (0-3)
    if (activity.failedAttempts >= 20) {
      activity.suspiciousLevel = 3; // Critical
    } else if (activity.failedAttempts >= 15) {
      activity.suspiciousLevel = 2; // High
    } else if (activity.failedAttempts >= SUSPICIOUS_ACTIVITY_THRESHOLD) {
      activity.suspiciousLevel = 1; // Medium
    }
  } else {
    // Outside window or new entry
    ipSuspiciousActivity.set(ip, {
      failedAttempts: 1,
      lastAttemptTime: now,
      suspiciousLevel: 0,
    });
  }
}

/**
 * Get suspicious activity level for an IP (0-3)
 */
export function getIpSuspiciousLevel(ip: string): number {
  const activity = ipSuspiciousActivity.get(ip);
  if (!activity) return 0;

  const now = Date.now();
  if (now - activity.lastAttemptTime > SUSPICIOUS_ACTIVITY_WINDOW_MS) {
    // Activity window expired
    ipSuspiciousActivity.delete(ip);
    return 0;
  }

  return activity.suspiciousLevel;
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header and connection IP
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Calculate progressive delay based on attempt count
 * Each failed attempt adds increasing delay to slow down brute force attacks
 * Follows formula: delay = min(baseDelay * (2 ^ attemptCount), maxDelay)
 */
function calculateProgressiveDelay(attemptCount: number): number {
  const baseDelay = 100; // milliseconds
  const maxDelay = 5000; // 5 seconds max
  const exponentialDelay = baseDelay * Math.pow(2, Math.min(attemptCount - 1, 4));
  return Math.min(exponentialDelay, maxDelay);
}

/**
 * Check if a key has exceeded rate limit
 * Returns remaining attempts, reset time, and recommended delay
 */
function checkRateLimit(
  store: RateLimitStore,
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number; delayMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // Window expired or first attempt - create new entry
    const resetTime = now + windowMs;
    store.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime,
      delayMs: 0,
    };
  }

  // Within existing window
  if (entry.count < maxAttempts) {
    entry.count++;
    const delayMs = calculateProgressiveDelay(entry.count);
    return {
      allowed: true,
      remaining: maxAttempts - entry.count,
      resetTime: entry.resetTime,
      delayMs,
    };
  }

  // Exceeded limit
  const delayMs = calculateProgressiveDelay(entry.count);
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
    delayMs,
  };
}

/**
 * Rate limit for login attempts: 5 per minute per IP
 * Includes account lockout and progressive delays
 */
export function checkLoginRateLimit(req: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  delayMs: number;
} {
  const ip = getClientIp(req);
  return checkRateLimit(loginAttempts, ip, 5, 60 * 1000); // 5 attempts per 1 minute
}

/**
 * Rate limit for registration: 3 per minute per IP
 * Includes progressive delays
 */
export function checkRegisterRateLimit(req: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  delayMs: number;
} {
  const ip = getClientIp(req);
  return checkRateLimit(registerAttempts, ip, 3, 60 * 1000); // 3 attempts per 1 minute
}

// Additional rate-limit stores for sensitive endpoints
const adminAttempts: RateLimitStore = new Map();
const customerLookupAttempts: RateLimitStore = new Map();
const scanVehicleAttempts: RateLimitStore = new Map();

/**
 * Rate limit for admin endpoints: 30 per minute per IP
 */
export function checkAdminRateLimit(req: NextRequest) {
  const ip = getClientIp(req);
  return checkRateLimit(adminAttempts, ip, 30, 60 * 1000);
}

/**
 * Rate limit for customer lookup (by phone/email): 20 per minute per IP
 * Prevents enumeration/scraping of customer info.
 */
export function checkCustomerLookupRateLimit(req: NextRequest) {
  const ip = getClientIp(req);
  return checkRateLimit(customerLookupAttempts, ip, 20, 60 * 1000);
}

/**
 * Rate limit for vehicle scan lookups: 30 per minute per IP
 */
export function checkScanVehicleRateLimit(req: NextRequest) {
  const ip = getClientIp(req);
  return checkRateLimit(scanVehicleAttempts, ip, 30, 60 * 1000);
}

/**
 * Rate limit for general API calls: 100 per minute per user
 */
export function checkApiRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  delayMs: number;
} {
  return checkRateLimit(apiCallsPerUser, userId, 100, 60 * 1000); // 100 calls per 1 minute
}

/**
 * Clean up expired entries periodically
 * Clears rate limit entries, account lockouts, and suspicious activity records
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();

  const cleanRateLimitStore = (store: RateLimitStore) => {
    const keysToDelete: string[] = [];
    store.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => store.delete(key));
  };

  const cleanLockoutStore = (store: AccountLockoutStore) => {
    const keysToDelete: string[] = [];
    store.forEach((entry, key) => {
      if (now > entry.lockedUntil) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => store.delete(key));
  };

  cleanRateLimitStore(loginAttempts);
  cleanRateLimitStore(registerAttempts);
  cleanRateLimitStore(apiCallsPerUser);
  cleanLockoutStore(accountLockouts);
}

// Cleanup expired entries every 5 minutes
if (typeof global !== 'undefined') {
  const intervalMs = 5 * 60 * 1000;
  setInterval(cleanupExpiredEntries, intervalMs);
}
