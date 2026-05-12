import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '@/lib/security-layer';
import { inspectRequest } from '@/lib/pen-test-guard';

// Pre-compute the headers once per cold start. Adds CSP, HSTS (prod only),
// COOP/COEP, plus the original five basic headers — managed in one place
// in src/lib/security-layer.ts.
const SECURITY_HEADERS = getSecurityHeaders();

// Apply the full security-header set to a NextResponse.
// Replaces the previous five hardcoded headers without removing any of them.
function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) response.headers.set(key, value);
  }
  return response;
}

// ---------------------------------------------------------------------------
// JWT Verification — Edge Runtime, signature-checked.
//
// Verifies the HS256 signature using Web Crypto API (globalThis.crypto),
// which is available natively in the Edge Runtime without any npm package.
// This closes the previous gap where decode-only let attackers forge a
// token with role="admin" and bypass middleware role checks.
//
// `jwt.verify()` in lib/auth.ts (Node-only) still runs in the API routes,
// providing the second layer of defence. This middleware layer is the FIRST
// gate — both must agree before sensitive routes are reached.
// ---------------------------------------------------------------------------

interface JwtPayloadLite {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

/**
 * Convert a base64url-encoded string to a Uint8Array of its bytes.
 * Web atob accepts standard base64 only, so we normalize and pad first.
 */
function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice(0, (4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Cryptographically verify a JWT's HS256 signature and return the payload.
 * Returns null on any failure — never throws. Fail-closed by design.
 *
 * @param token        The raw JWT (3 base64url-encoded parts, dot-separated)
 * @param checkExpiry  When true, also rejects tokens where exp < now()
 */
async function verifyJwt(
  token: string,
  checkExpiry: boolean
): Promise<JwtPayloadLite | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[middleware] JWT_SECRET not configured — refusing all tokens');
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // 1. Verify header algorithm matches what lib/auth.ts signs with (HS256).
    let header: { alg?: string };
    try {
      header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0])));
    } catch {
      return null;
    }
    if (header.alg !== 'HS256') return null;

    // 2. Verify the HMAC signature with Web Crypto API.
    const enc  = new TextEncoder();
    const key  = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data       = enc.encode(`${parts[0]}.${parts[1]}`);
    const signature  = base64UrlToBytes(parts[2]);
    const isValidSig = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!isValidSig) return null;

    // 3. Signature is good — now safe to trust the payload contents.
    let payload: JwtPayloadLite;
    try {
      payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1])));
    } catch {
      return null;
    }
    if (!payload.userId || !payload.role) return null;

    // 4. Optional expiry check (skipped for the refresh-flow probe).
    if (checkExpiry && payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/** Access-token verification — signature checked, expiry enforced. */
function verifyAccessToken(token: string): Promise<JwtPayloadLite | null> {
  return verifyJwt(token, true);
}

/**
 * Refresh-token signature check.
 * Expiry is intentionally NOT enforced here — the /api/auth/refresh endpoint
 * does the authoritative expiry check after running the full Node verify.
 * We just need to confirm the token wasn't forged before paying the cost
 * of the internal refresh fetch.
 */
function verifyRefreshTokenSignature(token: string): Promise<JwtPayloadLite | null> {
  return verifyJwt(token, false);
}

// Public routes that don't require auth
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/api/auth', // Includes /api/auth/csrf-token, /api/auth/login, etc.
  '/api/health',
  '/api/benefits',
  '/api/garages',
  '/api/garage-applications',
  '/api/public', // HMAC-signed share links (PDF, vehicle history) — tokens verified in route handlers
  '/api/inspections', // Inspection APIs — route handlers enforce auth; public access for awaiting_signature
  '/inspection', // Inspection view page — accessible for customer signature via shared links
  '/garage-apply',
  '/terms',
  '/privacy',
  '/warranty',
  '/accessibility',
  '/_next',
  '/favicon',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route));
}

// Middleware to protect routes with role-based access control
export async function middleware(req: NextRequest) {
  // Penetration-test probe detection.
  // Runs first so we capture probes against public routes too. Log-only:
  // we do NOT call blockIfAttackDetected — false-positives would break
  // real users. Switch to blocking only after observing logs for a week.
  inspectRequest(req);

  const token = req.cookies.get('auth-token')?.value;
  const refreshToken = req.cookies.get('refresh-token')?.value;
  const { pathname } = req.nextUrl;

  // Public routes - no auth required
  if (isPublicRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Try to verify the access token (signature + expiry).
  let payload = token ? await verifyAccessToken(token) : null;

  // If access token is missing or invalid, fall back to the refresh token.
  // We only check the refresh token's SIGNATURE here — the actual refresh
  // endpoint runs the full expiry/blacklist check via lib/auth.ts.
  if (!payload && refreshToken) {
    const refreshPayload = await verifyRefreshTokenSignature(refreshToken);
    if (refreshPayload) {
      try {
        // Call the refresh endpoint internally
        const refreshUrl = new URL('/api/auth/refresh', req.url);
        const refreshRes = await fetch(refreshUrl.toString(), {
          method: 'POST',
          headers: {
            'Cookie': `refresh-token=${refreshToken}`,
          },
        });

        if (refreshRes.ok) {
          // Extract new cookies from refresh response
          const setCookieHeaders = refreshRes.headers.getSetCookie?.() || [];

          // Create response that continues to the original destination
          const response = addSecurityHeaders(NextResponse.next());

          // Forward the new cookies
          for (const cookie of setCookieHeaders) {
            response.headers.append('Set-Cookie', cookie);
          }

          // Use the refresh payload for role checks below
          payload = refreshPayload;

          // Apply role-based checks and return
          return applyRoleChecks(pathname, payload, req, response);
        }
      } catch {
        // Refresh failed, fall through to unauthorized
      }
    }
  }

  // No valid token at all
  if (!payload) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'ÃÂ¤ÃÂ ÃÂªÃÂÃÂ§ÃÂ£ ÃÂÃÂÃÂªÃÂÃÂÃÂ¨ÃÂÃÂª. ÃÂÃÂ© ÃÂÃÂÃÂªÃÂÃÂÃÂ¨ ÃÂÃÂÃÂÃÂ©.', code: 'UNAUTHORIZED' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return applyRoleChecks(pathname, payload, req);
}

function logDenied(payload: { userId?: string; email?: string; role: string }, pathname: string, req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  console.warn('[SECURITY] Unauthorized access attempt', JSON.stringify({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    pathname,
    ip,
    ua,
    ts: new Date().toISOString(),
  }));
}

function applyRoleChecks(
  pathname: string,
  payload: { userId?: string; email?: string; role: string },
  req: NextRequest,
  response?: NextResponse
): NextResponse {
  const userRole = payload.role;
  const res = response || NextResponse.next();

  // Admin routes - require admin role
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (userRole !== 'admin') {
      logDenied(payload, pathname, req);
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/user', req.url));
    }
  }

  // Garage owner routes - require garage_owner or admin role
  if (pathname.startsWith('/garage') || pathname.startsWith('/api/garage')) {
    if (userRole !== 'garage_owner' && userRole !== 'admin') {
      logDenied(payload, pathname, req);
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/user', req.url));
    }
  }

  // User routes - require user role (or higher)
  if (pathname.startsWith('/user')) {
    if (userRole !== 'user' && userRole !== 'admin') {
      logDenied(payload, pathname, req);
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-icon\\.png|images/|fonts/|.*\\.png$|.*\\.svg$|.*\\.ico$|manifest.json|robots.txt|sitemap.xml|sw.js).*)',
  ],
};
