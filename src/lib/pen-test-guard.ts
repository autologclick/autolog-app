/**
 * AutoLog Penetration Test Guard — Edge-Runtime Safe.
 *
 * Detects and logs common attack probes:
 *  - SQL injection (SQLi)
 *  - Cross-site scripting (XSS)
 *  - Path traversal / Local File Inclusion (LFI)
 *  - Server-Side Request Forgery (SSRF)
 *  - Command injection
 *  - Security scanner fingerprints (Nikto, Burp, sqlmap…)
 *  - Suspicious User-Agent strings
 *
 * Each detection records suspicious IP activity (used by rate-limit.ts to
 * escalate blocking) and writes a structured security event to the logs.
 *
 * Design goals:
 *  ✓ False-positive-aware — patterns are precise, not greedy
 *  ✓ Log by default, block only on high-confidence categories
 *  ✓ Works in both Edge Runtime (middleware) and Node.js (API routes)
 *
 * Imports only Edge-safe utilities. Do NOT import pii-encryption from here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from './logger';
import {
  logSecurityEvent,
  createSecurityEvent,
  extractClientIP,
} from './security-layer';
import {
  recordIpSuspiciousActivity,
  getIpSuspiciousLevel,
} from './rate-limit';

// ---------------------------------------------------------------------------
// Attack pattern library
// ---------------------------------------------------------------------------

/** SQL injection signatures */
const SQL_INJECTION_PATTERNS: RegExp[] = [
  // Classic UNION-based
  /\b(UNION\s+(ALL\s+)?SELECT)\b/i,
  // Boolean-based blind
  /\b(OR|AND)\s+['\d]\s*=\s*['\d]/i,
  /\b(OR|AND)\s+['"]?[\w]+['"]?\s*=\s*['"]?[\w]+['"]?/i,
  // Stacked queries
  /;\s*(DROP|CREATE|ALTER|INSERT|UPDATE|DELETE|TRUNCATE)\s+/i,
  // Comment-based bypass
  /('|"|`)(\s*)(--|#|\/\*)/,
  // Time-based blind (SLEEP / WAITFOR)
  /\bSLEEP\s*\(\s*\d+\s*\)/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\bBENCHMARK\s*\(\s*\d+/i,
  // Information schema probes
  /\binformation_schema\b/i,
  /\bsys\.tables\b/i,
  // LOAD_FILE / INTO OUTFILE
  /\b(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/i,
];

/** XSS probe signatures */
const XSS_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /<\/script>/i,
  /javascript\s*:/i,
  /on(?:load|error|click|mouse|focus|blur|change|submit|reset|select|keydown|keyup|keypress|input|drag|drop|scroll|wheel|copy|cut|paste|animat|transit|touch|pointer|progress|show|hide|toggle|resize|open|close|message|storage|hash|pop)\s*=/i,
  /data:\s*text\/html/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /expression\s*\(/i,     // CSS expression()
  /vbscript\s*:/i,
  /<img[^>]+\bonerror\b/i,
  /src\s*=\s*['"]?\s*javascript:/i,
];

/** Path traversal / LFI patterns */
const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.[/\\]/,
  /\.\.[%2F%5C]+/i,          // URL-encoded slashes
  /%2e%2e[%2F%5C]+/i,        // Double-encoded
  /\/etc\/(passwd|shadow|hosts|hostname|issue|crontab)/i,
  /\/proc\/self\//i,
  /C:\\Windows\\(System32|win\.ini)/i,
  /boot\.ini/i,
  /\0/,                       // Null byte
];

/** SSRF patterns (in URL parameters & headers) */
const SSRF_PATTERNS: RegExp[] = [
  /(?:^|[\s"'=])https?:\/\/(?:169\.254\.169\.254|metadata\.google\.internal|100\.100\.100\.200)/i, // Cloud metadata
  /(?:^|[\s"'=])https?:\/\/(?:127\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.)/,                 // RFC-1918
  /(?:^|[\s"'=])https?:\/\/(?:0\.0\.0\.0|::1|localhost)/i,
  /file:\/\//i,
  /dict:\/\//i,
  /gopher:\/\//i,
  /ftp:\/\/(?:127\.|10\.|172\.|192\.168\.)/i,
];

/** OS command injection */
const COMMAND_INJECTION_PATTERNS: RegExp[] = [
  /[`|;$&]\s*(?:cat|ls|id|whoami|uname|pwd|curl|wget|nc|bash|sh|python|perl|ruby|php)/i,
  /\$\(.*\)/,       // $(command)
  /`[^`]+`/,        // backtick execution
  /\|\s*(?:nc|ncat|netcat)\b/i,
];

/** Known security scanner fingerprints in User-Agent */
const SCANNER_UA_PATTERNS: RegExp[] = [
  /nikto/i, /sqlmap/i, /nessus/i, /openvas/i, /masscan/i,
  /dirbuster/i, /gobuster/i, /wfuzz/i, /nuclei/i, /hydra/i,
  /medusa/i, /burp\s*suite/i, /zgrab/i, /acunetix/i, /appscan/i,
  /w3af/i, /havij/i,
];

/** Suspicious URL patterns (common scanner paths) */
const SCANNER_PATH_PATTERNS: RegExp[] = [
  /\/\.env$/i,
  /\/\.git\//i,
  /\/wp-admin\//i,
  /\/wp-login\.php/i,
  /\/phpmyadmin/i,
  /\/admin\.php$/i,
  /\/manager\/html/i,       // Tomcat manager
  /\/actuator\//i,          // Spring Boot actuator
  /\/\.\.\//,               // Path traversal in URL
  /\/xmlrpc\.php/i,
  /\/cgi-bin\//i,
  /\/etc\/passwd/i,
  /\/shell(?:\b|\.)/i,
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttackCategory =
  | 'sql_injection'
  | 'xss'
  | 'path_traversal'
  | 'ssrf'
  | 'command_injection'
  | 'scanner_probe'
  | 'suspicious_path';

export interface AttackDetectionResult {
  detected: boolean;
  categories: AttackCategory[];
  /** First matched pattern source per category (for log evidence) */
  evidence: string[];
}

// ---------------------------------------------------------------------------
// Core detection helpers
// ---------------------------------------------------------------------------

function matchPatterns(value: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    if (re.test(value)) return re.source;
  }
  return null;
}

function scanValue(
  value: string,
  results: { categories: AttackCategory[]; evidence: string[] }
): void {
  const checks: [RegExp[], AttackCategory][] = [
    [SQL_INJECTION_PATTERNS,     'sql_injection'],
    [XSS_PATTERNS,               'xss'],
    [PATH_TRAVERSAL_PATTERNS,    'path_traversal'],
    [SSRF_PATTERNS,              'ssrf'],
    [COMMAND_INJECTION_PATTERNS, 'command_injection'],
  ];

  for (const [patterns, category] of checks) {
    if (results.categories.includes(category)) continue; // already flagged
    const evidence = matchPatterns(value, patterns);
    if (evidence) {
      results.categories.push(category);
      results.evidence.push(`[${category}] matched: ${evidence.slice(0, 60)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Note: 'security' is the closest LogModule in the existing logger.ts.
// Adding 'pen-test-guard' to LogModule would touch a shared type file —
// safer to reuse 'security'.
const logger = createLogger('security');

/**
 * Inspect a raw string value (query, body, header, …) for attack patterns.
 * Synchronous, no I/O.
 */
export function detectAttackInValue(value: string): AttackDetectionResult {
  const result: Pick<AttackDetectionResult, 'categories' | 'evidence'> = {
    categories: [],
    evidence: [],
  };

  // URL-decode once to catch %27 = ' etc.
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* ignore */ }

  scanValue(value, result);
  if (decoded !== value) scanValue(decoded, result);

  return { detected: result.categories.length > 0, ...result };
}

/**
 * Inspect all threat surfaces of a Next.js request:
 *  - URL pathname
 *  - Query parameters (keys + values)
 *  - User-Agent header
 *  - Referer header
 *
 * Does NOT read the body (async, not needed in middleware — use
 * inspectRequestBody() in route handlers when body access is available).
 *
 * Side effects:
 *  - Records suspicious IP activity for repeated probes
 *  - Logs a structured security event on detection
 *
 * Returns the detection result so the caller decides whether to block.
 */
export async function inspectRequest(req: NextRequest): Promise<AttackDetectionResult> {
  const result: Pick<AttackDetectionResult, 'categories' | 'evidence'> = {
    categories: [],
    evidence: [],
  };

  const ip = extractClientIP(req.headers);
  const { pathname, searchParams } = req.nextUrl;

  // 1. Pathname check
  const pathEvidence = matchPatterns(pathname, [...PATH_TRAVERSAL_PATTERNS, ...SCANNER_PATH_PATTERNS]);
  if (pathEvidence) {
    result.categories.push('suspicious_path');
    result.evidence.push(`[suspicious_path] ${pathname}`);
  }

  // 2. Query params
  searchParams.forEach((value, key) => {
    scanValue(key, result);
    scanValue(value, result);
    try { scanValue(decodeURIComponent(value), result); } catch { /* ignore */ }
  });

  // 3. User-Agent
  const ua = req.headers.get('user-agent') || '';
  const scannerUA = matchPatterns(ua, SCANNER_UA_PATTERNS);
  if (scannerUA && !result.categories.includes('scanner_probe')) {
    result.categories.push('scanner_probe');
    result.evidence.push(`[scanner_probe] UA: ${ua.slice(0, 80)}`);
  }

  // 4. Referer
  const referer = req.headers.get('referer') || '';
  if (referer) scanValue(referer, result);

  const detected = result.categories.length > 0;

  if (detected) {
    // Record against the IP for rate-limit escalation. Bump first, then
    // read the post-bump level so the log event reflects the new value.
    await recordIpSuspiciousActivity(ip);
    const suspicionLevel = await getIpSuspiciousLevel(ip);

    const event = createSecurityEvent('ATTACK_PROBE', ip, {
      path: pathname,
      userAgent: ua || undefined,
      details: {
        categories: result.categories,
        evidence: result.evidence,
        suspicionLevel,
      },
    });
    logSecurityEvent(event);
  }

  return { detected, ...result };
}

/**
 * Inspect a plain-object request body for attack patterns.
 * Call inside API route handlers AFTER parsing JSON/FormData.
 *
 * @param body Parsed request body (flat or nested object)
 * @param ip   Client IP (use extractClientIP from security-layer)
 * @param path Request path (for logging)
 */
export async function inspectRequestBody(
  body: Record<string, unknown>,
  ip: string,
  path: string
): Promise<AttackDetectionResult> {
  const result: Pick<AttackDetectionResult, 'categories' | 'evidence'> = {
    categories: [],
    evidence: [],
  };

  function walkValue(v: unknown, fieldPath: string): void {
    if (typeof v === 'string') {
      const before = result.categories.length;
      scanValue(v, result);
      if (result.categories.length > before) {
        // Tag which field triggered the detection
        result.evidence = result.evidence.map((e, i) =>
          i >= before ? `${e} (field: ${fieldPath})` : e
        );
      }
    } else if (Array.isArray(v)) {
      v.forEach((item, idx) => walkValue(item, `${fieldPath}[${idx}]`));
    } else if (v && typeof v === 'object') {
      Object.entries(v as Record<string, unknown>).forEach(([k, val]) =>
        walkValue(val, `${fieldPath}.${k}`)
      );
    }
  }

  Object.entries(body).forEach(([k, v]) => walkValue(v, k));

  const detected = result.categories.length > 0;

  if (detected) {
    await recordIpSuspiciousActivity(ip);
    const event = createSecurityEvent('SUSPICIOUS_INPUT', ip, {
      path,
      details: { categories: result.categories, evidence: result.evidence },
    });
    logSecurityEvent(event);
  }

  return { detected, ...result };
}

/**
 * Middleware helper: return 400 Bad Request if an attack is detected.
 *
 * Defaults to BLOCKING only on high-confidence categories: SQL injection,
 * XSS, path traversal, command injection, SSRF. Scanner probes and
 * suspicious paths are logged but not blocked, since they false-positive
 * on legitimate scanners (Search Console, monitoring tools).
 *
 * IMPORTANT: This function is opt-in. The middleware currently runs
 * inspectRequest() but does NOT call blockIfAttackDetected — we are
 * in observe-only mode for now. Re-enable blocking after a few days
 * of clean logs.
 */
export function blockIfAttackDetected(
  req: NextRequest,
  result: AttackDetectionResult
): NextResponse | null {
  if (!result.detected) return null;

  const shouldBlock = result.categories.some(c =>
    ['sql_injection', 'xss', 'path_traversal', 'command_injection', 'ssrf'].includes(c)
  );

  if (!shouldBlock) return null;

  logger.warn('Blocked attack probe', {
    ip: extractClientIP(req.headers),
    path: req.nextUrl.pathname,
    categories: result.categories.join(','),
  });

  return new NextResponse(
    JSON.stringify({ error: 'Bad Request', code: 'INVALID_INPUT' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

// Convenience re-export so callers only need one import
export { extractClientIP } from './security-layer';
