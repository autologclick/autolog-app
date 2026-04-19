import { NextRequest } from 'next/server';
import {
  verifyToken,
  generateToken,
  generateRefreshToken,
  rotateTokens,
  JwtPayload,
} from '@/lib/auth';
import { jsonResponse, errorResponse, getClientIp } from '@/lib/api-helpers';
import { createRequestLogger } from '@/lib/logger';
import { logAuthEvent } from '@/lib/audit-log';
import { AUTH_ERRORS } from '@/lib/messages';

/**
 * POST /api/auth/refresh
 *
 * Refresh token rotation endpoint
 * Takes refresh token from httpOnly cookie, validates it, and issues new token pair
 * Implements token rotation for enhanced security (old refresh token is blacklisted)
 *
 * Returns:
 * - New access token (15 minutes)
 * - New refresh token (7 days)
 * - Sets tokens as httpOnly cookies
 */
export async function POST(req: NextRequest) {
  const logger = createRequestLogger('auth/refresh', req);
  const clientIp = getClientIp(req);

  try {
    // Extract refresh token from httpOnly cookie or Authorization header
    const refreshToken =
      req.cookies.get('refresh-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!refreshToken) {
      logger.warn('Refresh failed: no refresh token provided');
      return errorResponse(AUTH_ERRORS.REFRESH_TOKEN_MISSING, 401);
    }

    // Verify the refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      logger.warn('Refresh failed: invalid refresh token', { clientIp });
      return errorResponse(AUTH_ERRORS.REFRESH_TOKEN_INVALID, 401);
    }

    // Ensure this is actually a refresh token (optional: check for specific claim)
    logger.setUserId(decoded.userId);

    // Perform token rotation: blacklist old refresh token and issue new pair
    const { accessToken, refreshToken: newRefreshToken } = rotateTokens(refreshToken, {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    logger.info('Token refresh successful', {
      userId: decoded.userId,
      email: decoded.email,
    });
    logAuthEvent('REFRESH_TOKEN', decoded.userId, { status: 'success', req });

    const response = jsonResponse({
      message: 'הTokenים רוענו בהצלחה!',
    });

    // Set new access token (2 hours)
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 hours
      path: '/',
    });

    // Set new longer-lived refresh token (30 days)
    // Old refresh token is automatically blacklisted by rotateTokens()
    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    logger.error('Refresh error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse(AUTH_ERRORS.REFRESH_ERROR, 500);
  }
}
