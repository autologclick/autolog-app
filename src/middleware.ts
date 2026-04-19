import { NextRequest, NextResponse } from 'next/server';


// Security headers applied to all responses
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

// Decode JWT payload without Node.js crypto (Edge Runtime compatible)
function decodeJwtPayload(token: string): { userId: string; email: string; role: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.userId || !payload.role) return null;
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Decode without expiration check (for refresh flow)
function decodeJwtPayloadIgnoreExp(token: string): { userId: string; email: string; role: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.userId || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
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
  const token = req.cookies.get('auth-token')?.value;
  const refreshToken = req.cookies.get('refresh-token')?.value;
  const { pathname } = req.nextUrl;

  // Public routes - no auth required
  if (isPublicRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Try to decode the access token
  let payload = token ? decodeJwtPayload(token) : null;

  // If access token is expired but refresh token exists, try to refresh
  if (!payload && refreshToken) {
    // Check if refresh token has valid structure (not expired)
    const refreshPayload = decodeJwtPayloadIgnoreExp(refreshToken);
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
