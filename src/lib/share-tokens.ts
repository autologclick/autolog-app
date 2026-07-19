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
  resourceType: 'vehicle-history' | 'inspection-pdf' | 'sos-incident',
  resourceId: string,
  ttlSeconds: number = 60 * 60 * 24 * 7
): ShareToken {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${resourceType}:${resourceId}:${expiresAt}`;
  return { token: sign(payload), expiresAt };
}

/**
 * Vehicle-share invite token.
 *
 * Binds the invite to BOTH the vehicle and the invited email address, so signing
 * up with an invited address only links the share when the person actually
 * followed the emailed link. Without this, anyone who guessed (or happened to
 * own) an invited address would inherit the vehicle on signup.
 *
 * The email is lower-cased so it matches how invites are stored.
 */
export function createShareInviteToken(
  vehicleId: string,
  email: string,
  ttlSeconds: number = 60 * 60 * 24 * 14, // 14 days to accept
): ShareToken {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `vehicle-share-invite:${vehicleId}:${email.trim().toLowerCase()}:${expiresAt}`;
  return { token: sign(payload), expiresAt };
}

/** Verify an invite token for a given vehicle + email. */
export function verifyShareInviteToken(
  vehicleId: string,
  email: string,
  token: string,
  expiresAt: number,
): boolean {
  if (!token || !expiresAt) return false;
  if (Math.floor(Date.now() / 1000) > expiresAt) return false;
  const payload = `vehicle-share-invite:${vehicleId}:${email.trim().toLowerCase()}:${expiresAt}`;
  const a = Buffer.from(sign(payload));
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verify a share token. Returns true only if the signature matches and the token is not expired.
 */
export function verifyShareToken(
  resourceType: 'vehicle-history' | 'inspection-pdf' | 'sos-incident',
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
