import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from './auth';
import { createLogger } from './logger';
import { ZodError } from 'zod';
import { AUTH_ERRORS, VALIDATION_ERRORS, RATE_LIMIT_ERRORS } from './messages';
import { checkApiRateLimit } from './rate-limit';

const apiLogger = createLogger('api');

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Check API rate limit for the given user and return an error response if exceeded.
 * Returns null when the request is allowed to proceed.
 */
export function enforceRateLimit(userId: string): NextResponse | null {
  const rateLimit = checkApiRateLimit(userId);
  if (!rateLimit.allowed) {
    return errorResponse(RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS, 429);
  }
  return null;
}

export function validationErrorResponse(error: ZodError) {
  const details: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    details[path] = err.message;
  });
  return NextResponse.json(
    { error: VALIDATION_ERRORS.DATA_VALIDATION, details },
    { status: 400 }
  );
}

export function getAuthPayload(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth-token')?.value
    || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    apiLogger.debug('No authentication token provided', {
      path: new URL(req.url).pathname,
      method: req.method,
    });
    return null;
  }
  const payload = verifyToken(token);
  if (payload) {
    apiLogger.debug('Authentication token verified', {
      userId: payload.userId,
      path: new URL(req.url).pathname,
    });
  }
  return payload;
}

export function requireAuth(req: NextRequest): JwtPayload {
  const payload = getAuthPayload(req);
  if (!payload) {
    throw new AuthError(AUTH_ERRORS.UNAUTHORIZED, 401);
  }
  return payload;
}

export function requireAdmin(req: NextRequest): JwtPayload {
  const payload = requireAuth(req);
  if (payload.role !== 'admin') {
    throw new AuthError(AUTH_ERRORS.FORBIDDEN, 403);
  }
  return payload;
}

export function requireGarageOwner(req: NextRequest): JwtPayload {
  const payload = requireAuth(req);
  if (payload.role !== 'garage_owner' && payload.role !== 'admin') {
    throw new AuthError(AUTH_ERRORS.FORBIDDEN, 403);
  }
  return payload;
}

/**
 * Verify that a user owns a resource
 * Throws AuthError (403) if ownership check fails
 */
export function requireOwnership(
  userIdFromToken: string,
  resourceUserId: string,
  resourceType: string = 'resource'
): void {
  if (userIdFromToken !== resourceUserId) {
    throw new AuthError(
      AUTH_ERRORS.FORBIDDEN_RESOURCE,
      403
    );
  }
}

/**
 * Verify ownership, but allow admin to bypass
 * Throws AuthError (403) if user is not admin and doesn't own the resource
 */
export function requireOwnershipOrAdmin(
  payload: JwtPayload,
  resourceUserId: string,
): void {
  if (payload.role !== 'admin' && payload.userId !== resourceUserId) {
    throw new AuthError(AUTH_ERRORS.FORBIDDEN_RESOURCE, 403);
  }
}

/**
 * Sanitize user input by removing HTML/script tags
 * Prevents XSS attacks
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';

  // Remove HTML/script tags and dangerous content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .trim();
}

/**
 * Sanitize object properties (recursively for strings)
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeInput(sanitized[key]);
    } else if (sanitized[key] && typeof sanitized[key] === 'object') {
      (sanitized as any)[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    apiLogger.warn('Authorization error', {
      message: error.message,
      status: error.status,
    });
    return errorResponse(error.message, error.status);
  }
  apiLogger.error('API error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  return errorResponse('×©××××ª ×©×¨×ª ×¤× ××××ª', 500);
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header (for proxies) and connection IP
 * Used for rate limiting and security tracking
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export function getPaginationParams(req: NextRequest) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  // Validate pagination params to prevent abuse
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const validLimit = isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100); // Max 100 per page

  const skip = (validPage - 1) * validLimit;
  return { page: validPage, limit: validLimit, skip };
}

/**
 * Build a standardized pagination response envelope.
 * All list endpoints should use this to ensure consistent metadata.
 *
 * @param items - The items array (domain-specific name will be set by caller)
 * @param total - Total number of items matching the query
 * @param page  - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata object to spread into the response
 */
export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}
