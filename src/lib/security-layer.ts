/**
 * AutoLog Security Layer — Edge-Runtime Safe.
 *
 * Edge-compatible utilities (CSP, HSTS, security headers, CORS, IP extraction,
 * structured security events). This file MUST NOT import Node-only modules
 * (`crypto`, `fs`, `path`, …) because it is loaded from `middleware.ts`,
 * which runs in the Edge Runtime and will fail at boot otherwise.
 *
 * AES-256-GCM encryption (encryptPII/decryptPII) and file magic-byte
 * validation live in `pii-encryption.ts`, which is Node-only and used
 * only from API routes.
 *
 * Companion files:
 *   - src/lib/security.ts          → existing OWASP utils (sanitizeInput, etc.)
 *   - src/lib/pii-encryption.ts    → AES-256-GCM + file magic bytes (Node)
 *   - src/lib/pen-test-guard.ts    → attack-probe detection (uses this file)
 */

// ============================================================================
// Content Security Policy Builder
// Compatible with Next.js 14 + Tesseract.js OCR + Vercel Blob storage
// ============================================================================

/**
 * Build the CSP header value for AutoLog.
 *
 * Key decisions:
 * - blob: in worker-src & child-src → required by Tesseract.js
 * - cdn.jsdelivr.net in script-src  → Tesseract WASM/worker CDN
 * - unsafe-inline in style-src      → Tailwind CSS & Next.js inline styles
 * - unsafe-inline in script-src     → Next.js hydration scripts
 *   (unsafe-eval only in dev)
 *
 * nonce param is reserved for a future strict-dynamic migration.
 */
export function buildCSP(_nonce?: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",          // Next.js inline hydration scripts
    'blob:',                    // Tesseract.js workers
    'https://cdn.jsdelivr.net', // Tesseract WASM CDN
    'https://www.googletagmanager.com', // Google Analytics
    'https://api.qrserver.com',         // QR previews on flyer pages
  ];
  if (!isProd) scriptSrc.push("'unsafe-eval'"); // Next.js dev HMR

  const connectSrc = [
    "'self'",
    appUrl,
    'https://api.anthropic.com',                // AI vehicle assistant
    'https://api.openai.com',                   // AI document scanner
    'https://*.vercel-storage.com',             // Vercel Blob
    'https://*.public.blob.vercel-storage.com',
    'https://api.mapbox.com',                   // Maps
    'https://events.mapbox.com',
    'https://www.google-analytics.com',         // Google Analytics
    'https://data.gov.il',                      // Israeli MOT lookup
    'https://api.qrserver.com',                 // QR generation
    'wss:',                                     // WebSocket (push notifications)
  ].filter(Boolean);

  const directives: [string, string][] = [
    ['default-src', "'self'"],
    ['script-src', scriptSrc.join(' ')],
    ['style-src', "'self' 'unsafe-inline' https://fonts.googleapis.com"],
    ['img-src', "'self' data: blob: https://*.vercel-storage.com https://*.public.blob.vercel-storage.com https://api.qrserver.com https://*.tile.openstreetmap.org"],
    ['font-src', "'self' data: https://fonts.gstatic.com"],
    ['connect-src', connectSrc.join(' ')],
    ['worker-src', "'self' blob:"],
    ['child-src', "'self' blob:"],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
    ['frame-ancestors', "'none'"],
  ];

  if (isProd) {
    directives.push(['upgrade-insecure-requests', '']);
  }

  return directives
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join('; ');
}

/**
 * HTTP Strict-Transport-Security value for production.
 * - 1 year max-age (recommended by HSTS preload list)
 * - includeSubDomains protects all subdomains
 * - preload flag for browser preload-list submission
 */
export function getHSTSHeader(): string {
  return 'max-age=31536000; includeSubDomains; preload';
}

// ============================================================================
// Complete Security Headers Map
// Returns plain object — merge into a NextResponse in middleware.
// ============================================================================

/**
 * Returns recommended security headers as a plain object.
 *
 * IMPORTANT: this is wired into middleware.ts. Adding headers that conflict
 * with existing app behaviour (e.g. a too-tight CSP) will break the site for
 * all users. Test additions in dev first.
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self)',
    'Content-Security-Policy': buildCSP(),
    'Cross-Origin-Opener-Policy': 'same-origin',
    // 'require-corp' breaks CDN fonts and Tesseract WASM. Keep at 'unsafe-none'.
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Resource-Policy': 'same-site',
  };

  // HSTS only on HTTPS (production). Setting it in dev (HTTP) is harmless
  // but cleaner to omit so localhost stays accessible.
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = getHSTSHeader();
  }

  return headers;
}

// ============================================================================
// File Upload Constants (Edge-safe, no crypto)
// Magic-byte validation lives in pii-encryption.ts (Node-only).
// ============================================================================

export const FILE_LIMITS = {
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,     // 5 MB
  DOCUMENT_MAX_BYTES: 20 * 1024 * 1024, // 20 MB
  AVATAR_MAX_BYTES: 2 * 1024 * 1024,    // 2 MB
} as const;

export const ALLOWED_IMAGE_TYPES    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'] as const;

/**
 * Validate file metadata (MIME, size, filename) before reading the content.
 * Safe for both Edge and Node runtimes — no Buffer required.
 */
export function validateFileUpload(
  file: { type: string; size: number; name: string },
  allowedTypes: readonly string[],
  maxBytes: number
): { valid: true } | { valid: false; error: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `סוג קובץ '${file.type}' לא נתמך. מותר: ${allowedTypes.join(', ')}` };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `גודל הקובץ ${(file.size / 1024 / 1024).toFixed(1)}MB חורג מהמקסימום ${(maxBytes / 1024 / 1024).toFixed(0)}MB`,
    };
  }
  if (/[/\\]/.test(file.name) || file.name.includes('..')) {
    return { valid: false, error: 'שם קובץ לא תקין' };
  }
  return { valid: true };
}

// ============================================================================
// IP Address Extraction (Anti-Spoofing)
// ============================================================================

/**
 * Extract the real client IP from request headers.
 * Validates each candidate against basic IP format rules.
 *
 * WARNING: X-Forwarded-For can be spoofed unless the edge infrastructure
 * strips/overwrites it. Vercel and Cloudflare do this automatically.
 */
export function extractClientIP(headers: Headers | Record<string, string | null>): string {
  const get = (name: string): string | null =>
    headers instanceof Headers
      ? headers.get(name)
      : (headers as Record<string, string | null>)[name] ?? null;

  // Vercel / Cloudflare set this after stripping user-supplied XFF
  const realIP = get('x-real-ip');
  if (realIP && isValidIP(realIP)) return realIP;

  // Standard proxy chain — take leftmost (original client)
  const xff = get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (isValidIP(first)) return first;
  }

  return 'unknown';
}

function isValidIP(ip: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').map(Number).every(n => n >= 0 && n <= 255);
  }
  // IPv6 (simplified)
  return /^[0-9a-f:]+$/i.test(ip) && ip.length <= 45;
}

// ============================================================================
// CORS Policy
// ============================================================================

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) origins.add(appUrl.replace(/\/$/, ''));
  process.env.CORS_ALLOWED_ORIGINS
    ?.split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .forEach(o => origins.add(o));
  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

/**
 * Build CORS response headers for an incoming origin.
 * Returns empty Allow-Origin for disallowed origins in production.
 */
export function getCORSHeaders(origin: string | null): Record<string, string> {
  const isAllowed =
    process.env.NODE_ENV !== 'production' || // dev: allow all
    (origin !== null && ALLOWED_ORIGINS.has(origin));

  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // cache preflight for 24 h
    'Vary': 'Origin',
  };
}

// ============================================================================
// Structured Security Events
// ============================================================================

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'AUTH_LOCKOUT'
  | 'CSRF_VIOLATION'
  | 'RATE_LIMIT_HIT'
  | 'ATTACK_PROBE'         // detected by pen-test-guard
  | 'PERMISSION_DENIED'
  | 'INVALID_TOKEN'
  | 'FILE_UPLOAD_REJECTED'
  | 'SUSPICIOUS_INPUT'
  | 'TOKEN_REPLAY'         // blacklisted token reuse attempt
  | 'ENV_MISCONFIGURATION';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  path?: string;
  details?: Record<string, unknown>;
}

const SEVERITY_MAP: Record<SecurityEventType, SecuritySeverity> = {
  AUTH_SUCCESS:         'low',
  AUTH_FAILURE:         'medium',
  AUTH_LOCKOUT:         'high',
  CSRF_VIOLATION:       'high',
  RATE_LIMIT_HIT:       'medium',
  ATTACK_PROBE:         'critical',
  PERMISSION_DENIED:    'medium',
  INVALID_TOKEN:        'medium',
  FILE_UPLOAD_REJECTED: 'medium',
  SUSPICIOUS_INPUT:     'high',
  TOKEN_REPLAY:         'high',
  ENV_MISCONFIGURATION: 'critical',
};

export function createSecurityEvent(
  type: SecurityEventType,
  ip: string,
  extras?: Partial<Omit<SecurityEvent, 'type' | 'severity' | 'timestamp' | 'ip'>>
): SecurityEvent {
  return {
    type,
    severity: SEVERITY_MAP[type],
    timestamp: new Date().toISOString(),
    ip,
    ...extras,
  };
}

/** Log a security event to console (structured JSON for log aggregators). */
export function logSecurityEvent(event: SecurityEvent): void {
  const method = event.severity === 'critical' || event.severity === 'high'
    ? console.error
    : console.warn;
  method('[SECURITY]', JSON.stringify(event));
}
