import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import prisma from './db';
import { getCacheStore } from './cache-store';

// ============================================================================
// JWT Secret Management - Cryptographically Strong Fallback
// ============================================================================

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // In production, throw an error - don't allow fallback
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }

    console.warn(
      '⚠️  WARNING: JWT_SECRET environment variable not set. Using fallback random secret. ' +
      'This is INSECURE in production. Set JWT_SECRET immediately in environment variables.'
    );
    // Generate a cryptographically strong fallback (32 bytes = 256 bits)
    return crypto.randomBytes(32).toString('hex');
  }

  return secret;
}

const JWT_SECRET = getJwtSecret();

// Token expiry constants following OWASP guidelines
// Short-lived access tokens reduce exposure if compromised
export const TOKEN_EXPIRY = '2h'; // 2 hours - longer for forms like inspections
export const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ============================================================================
// Token Blacklist - Uses CacheStore (in-memory or Redis)
// To switch to Redis: update getCacheStore() in cache-store.ts
// ============================================================================
const BLACKLIST_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (matches refresh token expiry)

export function blacklistToken(tokenId: string): void {
  const cache = getCacheStore();
  cache.set(`blacklist:${tokenId}`, true, BLACKLIST_TTL_MS);
}

export function isTokenBlacklisted(tokenId: string): boolean {
  const cache = getCacheStore();
  return cache.has(`blacklist:${tokenId}`);
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenId?: string; // Unique token identifier for rotation/blacklisting
  type?: 'access' | 'refresh'; // Token type to differentiate access vs refresh tokens
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a short-lived access token (15 minutes)
 * Used for API access
 */
export function generateToken(payload: JwtPayload): string {
  const payloadWithTokenId = {
    ...payload,
    tokenId: crypto.randomBytes(16).toString('hex'),
    type: 'access' as const,
  };
  return jwt.sign(payloadWithTokenId, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Generate a longer-lived refresh token (7 days)
 * Used to obtain new access tokens without re-authentication
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const payloadWithTokenId = {
    ...payload,
    tokenId: crypto.randomBytes(16).toString('hex'),
    type: 'refresh' as const,
  };
  return jwt.sign(payloadWithTokenId, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Rotate tokens by blacklisting the old refresh token and issuing new pair
 * Implements token rotation for enhanced security
 */
export function rotateTokens(oldRefreshToken: string, payload: JwtPayload): {
  accessToken: string;
  refreshToken: string;
} {
  // Verify and extract old token info
  const decoded = verifyToken(oldRefreshToken);
  if (decoded?.tokenId) {
    // Blacklist the old refresh token
    blacklistToken(decoded.tokenId);
  }

  // Issue new token pair
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Check if token is blacklisted
    if (decoded.tokenId && isTokenBlacklisted(decoded.tokenId)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      licenseNumber: true,
      idNumber: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
}

export function requireRole(userRole: string, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
}
