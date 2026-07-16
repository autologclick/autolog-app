import { NextRequest, NextResponse } from 'next/server';
import {
  buildAuthorizationUrl,
  generatePkceVerifier,
  pkceChallengeFromVerifier,
  isGoogleConfigured,
} from '@/lib/oauth/google';
import { storeOAuthState } from '@/lib/oauth/state-store';
import { createRequestLogger } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';

/**
 * GET /api/auth/google
 * Kicks off the Google OAuth flow:
 *   - generate PKCE verifier + S256 challenge
 *   - generate state, store {verifier, next, referralCode} in Redis (10 min TTL)
 *   - drop a SameSite=Lax state cookie scoped to /api/auth/google (so the callback can verify)
 *   - 302 to Google
 */
export async function GET(req: NextRequest) {
  const logger = createRequestLogger('auth/google', req);

  if (!isGoogleConfigured()) {
    logger.error('Google OAuth not configured');
    return NextResponse.redirect(`${APP_URL}/auth/login?error=google_unavailable`);
  }

  const url = new URL(req.url);
  const nextParam = url.searchParams.get('next') || '/user';
  const referralCode = url.searchParams.get('ref') || undefined;

  // Open-redirect guard
  const safeNext =
    nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/user';

  const codeVerifier = generatePkceVerifier();
  const codeChallenge = pkceChallengeFromVerifier(codeVerifier);

  const state = await storeOAuthState({
    codeVerifier,
    next: safeNext,
    referralCode,
    createdAt: Date.now(),
  });

  const authorizeUrl = buildAuthorizationUrl({ state, codeChallenge });

  logger.info('Initiating Google OAuth', { next: safeNext, hasReferral: !!referralCode });

  const response = NextResponse.redirect(authorizeUrl);

  // SameSite=Lax is REQUIRED here. Strict would silently drop the cookie on the
  // callback because the navigation originates from accounts.google.com.
  response.cookies.set('g_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/auth/google',
  });

  return response;
}
