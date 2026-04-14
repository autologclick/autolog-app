import crypto from 'crypto';

/**
 * Minimal RFC 6238 TOTP implementation using Node crypto (no external deps).
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateSecret(bytes = 20): string {
  // 20 bytes = 160 bits = 32 base32 chars (standard TOTP secret size)
  const buf = crypto.randomBytes(bytes);
  return base32Encode(buf);
}

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(str: string): Buffer {
  const cleaned = str.replace(/=+$/g, '').toUpperCase().replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/**
 * Generate 6-digit TOTP code for given secret at given time.
 */
export function generateTotp(secretBase32: string, timestamp: number = Date.now(), step = 30, digits = 6): string {
  const counter = Math.floor(timestamp / 1000 / step);
  const key = base32Decode(secretBase32);

  const buf = Buffer.alloc(8);
  // Node doesn't have BigInt64BE in older versions, so manual
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
}

/**
 * Verify TOTP code allowing ±1 time step drift.
 */
export function verifyTotp(secretBase32: string, token: string, timestamp: number = Date.now(), step = 30, window = 1): boolean {
  const clean = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  for (let offset = -window; offset <= window; offset++) {
    const t = timestamp + offset * step * 1000;
    if (generateTotp(secretBase32, t, step) === clean) return true;
  }
  return false;
}

/**
 * Build an otpauth:// URI for QR code generation.
 */
export function buildOtpauthUri(opts: { secret: string; label: string; issuer: string }): string {
  const label = encodeURIComponent(`${opts.issuer}:${opts.label}`);
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Generate one-time backup codes (8 codes, 8 alphanumeric chars each).
 * Returns both the plaintext (to show the user once) and hashed versions (to store).
 */
export function generateBackupCodes(count = 8): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 10);
    plain.push(code);
    hashed.push(crypto.createHash('sha256').update(code).digest('hex'));
  }
  return { plain, hashed };
}

export function verifyBackupCode(code: string, hashedList: string[]): { ok: boolean; remaining: string[] } {
  const clean = code.replace(/\s+/g, '').toUpperCase();
  const hash = crypto.createHash('sha256').update(clean).digest('hex');
  const idx = hashedList.indexOf(hash);
  if (idx === -1) return { ok: false, remaining: hashedList };
  const remaining = [...hashedList.slice(0, idx), ...hashedList.slice(idx + 1)];
  return { ok: true, remaining };
}
