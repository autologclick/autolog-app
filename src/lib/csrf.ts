import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// In-memory store for CSRF tokens
// In production, this should be stored in Redis or a database with expiration
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>();

const TOKEN_LENGTH = 32; // 256 bits
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a secure CSRF token
 * Returns a random hex string
 */
export function generateCsrfToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Store a CSRF token with expiration
 * sessionId should be unique per user session (e.g., from JWT payload)
 */
export function storeCsrfToken(sessionId: string, token: string): void {
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
  csrfTokenStore.set(sessionId, { token, expiresAt });
}

/**
 * Verify a CSRF token
 * Returns true if token is valid and not expired
 */
export function verifyCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  const now = Date.now();
  if (now > stored.expiresAt) {
    // Token expired, clean it up
    csrfTokenStore.delete(sessionId);
    return false;
  }

  // Verify token matches (timing-safe comparison)
  const isValid = timingSafeEqual(stored.token, token);

  if (!isValid) {
    return false;
  }

  // Refresh the token after successful verification
  csrfTokenStore.set(sessionId, { token, expiresAt: now + TOKEN_EXPIRY_MS });

  return true;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extract CSRF token from request
 * Checks: X-CSRF-Token header, X-CSRF-REQUEST-TOKEN header, or _csrf form field
 */
export function getCsrfTokenFromRequest(req: NextRequest): string | null {
  // Check headers first
  const headerToken = req.headers.get('x-csrf-token') || req.headers.get('x-csrf-request-token');
  if (headerToken) {
    return headerToken;
  }

  // For future form-based submissions, would need to parse body
  return null;
}

/**
 * Middleware to validate CSRF tokens on unsafe methods
 * Should be applied to POST, PUT, PATCH, DELETE endpoints
 */
export async function validateCsrfToken(req: NextRequest): Promise<boolean> {
  // Only validate on state-changing requests
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true; // Safe methods don't need CSRF protection
  }

  // Extract session ID from auth token (assuming JWT payload in middleware)
  // For API calls, the session ID would come from the decoded JWT
  const token = req.cookies.get('auth-token')?.value;
  if (!token) {
    return false; // No session, require CSRF token
  }

  // Get CSRF token from request
  const csrfToken = getCsrfTokenFromRequest(req);
  if (!csrfToken) {
    return false;
  }

  // In a real implementation, we'd decode the JWT to get the sessionId
  // For now, we'll use the token itself as the sessionId for verification
  // This assumes the CSRF token was generated when the user logged in
  const isValid = verifyCsrfToken(token, csrfToken);

  return isValid;
}

/**
 * Clean up expired CSRF tokens
 * Should be called periodically
 */
export function cleanupExpiredCsrfTokens(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  csrfTokenStore.forEach((entry, sessionId) => {
    if (now > entry.expiresAt) {
      keysToDelete.push(sessionId);
    }
  });

  keysToDelete.forEach(sessionId => csrfTokenStore.delete(sessionId));
}

// Cleanup expired tokens periodically (every hour)
if (typeof global !== 'undefined') {
  setInterval(cleanupExpiredCsrfTokens, CLEANUP_INTERVAL_MS);
}
