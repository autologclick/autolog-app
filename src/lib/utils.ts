/**
 * Safely parse a JSON string, returning the original value if parsing fails.
 * Useful for fields stored as JSON strings in the database.
 */
export function safeJsonParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Parse dates flexibly - supports DD/MM/YYYY, YYYY-MM-DD, and ISO formats.
 * Returns null for invalid or empty inputs.
 */
export function parseFlexDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  // DD/MM/YYYY format (common in Israel)
  const ddmm = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return new Date(Number(ddmm[3]), Number(ddmm[2]) - 1, Number(ddmm[1]));
  // Try standard Date parsing (YYYY-MM-DD, ISO, etc.)
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculate document/expiry status based on date.
 * Returns 'expired', 'expiring' (within 30 days), or 'valid'.
 */
export function getExpiryStatus(expiryDate: Date): 'expired' | 'expiring' | 'valid' {
  const now = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays < 30) return 'expiring';
  return 'valid';
}
