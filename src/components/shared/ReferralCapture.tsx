'use client';

import { useEffect } from 'react';

/**
 * Captures a partner referral code from the URL on landing.
 *
 * Flow:
 *   1. User scans poster QR → arrives at https://autolog.click/?ref=CODE
 *   2. This component reads `?ref=CODE` once on mount
 *   3. Validates the format (lowercase letters, digits, hyphens — max 40 chars)
 *   4. Stores it in two places:
 *      - cookie `autolog_ref` (30 days) — sent with form submissions
 *      - localStorage — fallback for read-from-anywhere
 *   5. Strips `ref` from the URL (without reloading) so the homepage URL
 *      stays clean for share / bookmark
 *
 * The signup form reads this value and includes it in the POST to /api/auth/register,
 * where `creditReferral()` credits the matching partner.
 *
 * Mounted once in the root layout — runs on every page load but only acts when
 * a `ref` param is present, so it's effectively free.
 */
export default function ReferralCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      const raw = url.searchParams.get('ref');
      if (!raw) return;

      // Tight validation — must match the format used by Partner.code
      const code = raw.trim().toLowerCase();
      if (!/^[a-z0-9-]{1,40}$/.test(code)) return;

      // 30-day cookie — survives across visits, enough for "I'll sign up later"
      const maxAge = 60 * 60 * 24 * 30;
      const isSecure = window.location.protocol === 'https:';
      document.cookie =
        `autolog_ref=${code}; Max-Age=${maxAge}; Path=/; SameSite=Lax` +
        (isSecure ? '; Secure' : '');

      // Mirror to localStorage so the signup form can read it without parsing cookies
      try { window.localStorage.setItem('autolog_ref', code); } catch { /* ignore quota / private mode */ }

      // Clean the URL — strip ?ref but keep any other params (utm_*, etc.)
      url.searchParams.delete('ref');
      const cleaned = url.pathname + (url.search || '') + url.hash;
      window.history.replaceState({}, '', cleaned);
    } catch {
      // Any error here is non-critical — referral capture is best-effort
    }
  }, []);

  return null;
}

/**
 * Read the stored referral code, preferring cookie over localStorage.
 * Returns the empty string if no valid code is stored.
 *
 * Safe to call from any client component or form submit handler.
 */
export function getStoredReferralCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    // Cookie first (more reliable across subdomains if we ever expand)
    const m = document.cookie.match(/(?:^|;\s*)autolog_ref=([^;]+)/);
    if (m) {
      const code = decodeURIComponent(m[1]).toLowerCase();
      if (/^[a-z0-9-]{1,40}$/.test(code)) return code;
    }
    // Fallback to localStorage
    const ls = window.localStorage.getItem('autolog_ref');
    if (ls && /^[a-z0-9-]{1,40}$/.test(ls)) return ls;
  } catch {
    /* ignore */
  }
  return '';
}
