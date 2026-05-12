/**
 * AutoLog PII Encryption — Node Runtime Only.
 *
 * AES-256-GCM authenticated encryption for sensitive at-rest data:
 * Israeli ID numbers, license numbers, and similar PII columns.
 *
 * This file imports `crypto` from Node and MUST NOT be imported from
 * Edge Runtime code (middleware.ts, edge route handlers). Import only
 * from API routes that run on the Node runtime — which is the default.
 *
 * Companion files:
 *   - src/lib/security-layer.ts   → Edge-safe headers, CSP, events
 *   - src/lib/security.ts         → existing OWASP utils
 */

import crypto from 'crypto';

// ============================================================================
// AES-256-GCM Encryption for PII at Rest
// ============================================================================

const IV_LENGTH = 12;        // 96-bit GCM nonce (NIST recommended)
const AUTH_TAG_LENGTH = 16;  // 128-bit authentication tag

/**
 * Derives or loads the AES-256 key from the ENCRYPTION_KEY env var.
 *
 * Accepted formats:
 *  - 64-char hex string  → used as the raw 32-byte key
 *  - any other string    → derived to 32 bytes via scrypt
 *
 * In production, missing env var THROWS — failing closed is the only
 * safe default for an encryption layer.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[pii-encryption] ENCRYPTION_KEY is required in production');
    }
    // Dev-only: deterministic derivation so encrypted data survives hot-reloads
    console.warn(
      '[pii-encryption] ⚠  ENCRYPTION_KEY not set — using dev fallback. NOT safe for production.'
    );
    return crypto.scryptSync('autolog-dev-key', 'autolog-salt-v1', 32);
  }

  // Accept 64-char hex string (openssl rand -hex 32)
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  // Derive 256-bit key from passphrase using scrypt
  return crypto.scryptSync(raw, 'autolog-encryption-salt-v1', 32);
}

/**
 * Encrypt a PII string with AES-256-GCM.
 * Output format (base64): [12-byte IV][16-byte authTag][ciphertext]
 *
 * @example
 *   const encrypted = encryptPII(rawIdNumber);
 *   await prisma.user.update({ data: { idNumber: encrypted } });
 */
export function encryptPII(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv  = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Pack: IV | authTag | ciphertext → base64
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/**
 * Decrypt a PII string that was encrypted with encryptPII.
 * Throws if the auth tag doesn't match (data tampered or wrong key).
 */
export function decryptPII(encoded: string): string {
  if (!encoded) return encoded;

  const key  = getEncryptionKey();
  const data = Buffer.from(encoded, 'base64');

  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('[pii-encryption] Ciphertext too short — likely not encrypted');
  }

  const iv         = data.subarray(0, IV_LENGTH);
  const authTag    = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    throw new Error('[pii-encryption] Decryption failed — possible tampering or wrong key');
  }
}

/**
 * Safely decrypt without throwing — returns null on failure.
 * Use during migration when the value may still be stored in plaintext
 * (so old rows don't break read paths).
 *
 * Pattern for a graceful read:
 *   const decrypted = decryptPIISafe(user.idNumber);
 *   const idNumber  = decrypted ?? user.idNumber;  // fall back to plaintext
 */
export function decryptPIISafe(encoded: string): string | null {
  try {
    return decryptPII(encoded);
  } catch {
    return null;
  }
}

// ============================================================================
// File Magic-Byte Validation (Node-only — uses Buffer)
// ============================================================================

// Magic byte signatures for common types (prevents MIME spoofing).
// Keys mirror the MIME types in security-layer.ts ALLOWED_*_TYPES.
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg':       [[0xff, 0xd8, 0xff]],
  'image/png':        [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif':        [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'image/webp':       [[0x52, 0x49, 0x46, 0x46]],  // RIFF header
  'application/pdf':  [[0x25, 0x50, 0x44, 0x46]],   // %PDF
};

/**
 * Validate the first bytes of a file buffer against known magic bytes.
 * Call AFTER reading the file but BEFORE storing it, to prevent MIME-type
 * spoofing attacks (uploading malicious content disguised as an image).
 *
 * @returns true if the buffer matches the declared MIME type or
 *          the type has no signature to check (returns true to allow
 *          unknown types — combine with a strict allow-list at the route).
 */
export function validateFileMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  const sigs = FILE_SIGNATURES[declaredMimeType];
  if (!sigs) return true; // Unknown type — no signature to check
  return sigs.some(sig => sig.every((byte, i) => buffer[i] === byte));
}
