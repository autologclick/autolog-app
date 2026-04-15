import crypto from 'crypto';

/**
 * HMAC-signed share tokens for public resource sharing (vehicle history, inspection PDFs).
 *
 * A token is a base64url(HMAC-SHA256(secret, `${resourceType}:${resourceId}:${expiresAt}`)).
 * The expiresAt epoch-seconds is included in the URL alongside the token so the server can verify.
 *
 * Without the correct token, public endpoints refuse to return data — a guessed UUID is useless.
 */

function getSecret(): string {
  const secret = process.env.SHARE_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('SHARE_TOKEN_SECRET (or JWT_SECRET) must be set');
  }
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');
}

export interface ShareToken {
  token: string;
  expiresAt: number; // epoch seconds
}

/**
 * Create a share token for a resource. Default TTL: 30 days.
 */
export function createShareToken(
  resourceType: 'vehicle-history' | 'inspection-pdf',
  resourceId: string,
  ttlSeconds: number = 60 * 60 * 24 * 30
): ShareToken {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${resourceType}:${resourceId}:${expiresAt}`;
  return { token: sign(payload), expiresAt };
}

/**
 * Verify a share token. Returns true only if the signature matches and the token is not expired.
 */
export function verifyShareToken(
  resourceType: 'vehicle-history' | 'inspection-pdf',
  resourceId: string,
  token: string,
  expiresAt: number
): boolean {
  if (!token || !expiresAt) return false;
  if (Math.floor(Date.now() / 1000) > expiresAt) return false;
  const payload = `${resourceType}:${resourceId}:${expiresAt}`;
  const expected = sign(payload);
  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
