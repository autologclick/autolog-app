import crypto from 'crypto';

/**
 * Centralized security utilities following OWASP guidelines
 * Oren (Security Specialist) approved patterns for input validation, logging, and token generation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML/script tags and dangerous JavaScript
 * @param input - The string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';

  return (
    input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc)
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .trim()
  );
}

/**
 * Mask email address for secure logging
 * Prevents accidental exposure of full email in logs
 * Example: "user@example.com" -> "u***@example.com"
 * @param email - Email address to mask
 * @returns Masked email safe for logging
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '[redacted]';

  const [localPart, domain] = email.split('@');
  if (!domain) return '[invalid-email]';

  // Keep first char + last char of local part, mask middle
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  const masked = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
  return `${masked}@${domain}`;
}

/**
 * Mask phone number for secure logging
 * Prevents accidental exposure of full phone in logs
 * Example: "+972501234567" -> "+972***4567"
 * @param phone - Phone number to mask
 * @returns Masked phone safe for logging
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '[redacted]';

  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '[invalid-phone]';

  const lastFour = cleaned.slice(-4);
  const prefix = cleaned.slice(0, Math.max(3, cleaned.length - 7));
  return `${prefix}***${lastFour}`;
}

/**
 * Generate cryptographically secure random token
 * Used for password reset tokens, email verification, etc.
 * @param length - Number of bytes to generate (default 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash an IP address anonymously for tracking purposes
 * Allows correlation of activities from same IP without storing raw IP
 * Uses SHA-256 for consistency
 * @param ip - IP address to hash
 * @param salt - Optional salt for additional security (uses env var if not provided)
 * @returns SHA-256 hash of IP
 */
export function hashIP(ip: string, salt?: string): string {
  const ipSalt = salt || process.env.IP_HASH_SALT || 'autolog-security-salt';
  return crypto
    .createHash('sha256')
    .update(`${ip}:${ipSalt}`)
    .digest('hex');
}

/**
 * Validate email format using RFC 5322 simplified pattern
 * @param email - Email to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
}

/**
 * Validate password strength
 * Enforces OWASP guidelines: 8+ chars, upper, lower, number, special char
 * @param password - Password to validate
 * @returns object with isValid and reasons for failure if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!password.match(/[A-Z]/)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!password.match(/[a-z]/)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!password.match(/[0-9]/)) {
    errors.push('Password must contain number');
  }
  if (!password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)) {
    errors.push('Password must contain special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate security event log entry with masked PII
 * Used for audit trail and security monitoring
 * @param eventType - Type of event (login, logout, failed_auth, etc)
 * @param userId - User ID (not masked, database identifier)
 * @param email - User email (will be masked)
 * @param ip - Client IP (will be hashed)
 * @param details - Additional event details
 * @returns Log entry object safe for storage/audit
 */
export function createSecurityEventLog(
  eventType: string,
  userId: string | null,
  email: string | null,
  ip: string | null,
  details?: Record<string, unknown>
): {
  timestamp: string;
  eventType: string;
  userId: string | null;
  maskedEmail: string;
  hashedIP: string;
  details?: Record<string, unknown>;
} {
  return {
    timestamp: new Date().toISOString(),
    eventType,
    userId: userId || null,
    maskedEmail: maskEmail(email),
    hashedIP: hashIP(ip || 'unknown'),
    ...(details && { details }),
  };
}

/**
 * Constant-time string comparison
 * Prevents timing attacks when comparing sensitive values
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate CSRF token for form submissions
 * Should be unique per session
 * @param sessionId - Session identifier
 * @returns CSRF token
 */
export function generateCsrfToken(sessionId: string): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return crypto
    .createHash('sha256')
    .update(`${sessionId}:${randomPart}`)
    .digest('hex');
}

/**
 * Validate CSRF token
 * Regenerate expected token with same session ID and compare
 * @param token - Token to validate
 * @param sessionId - Session ID to regenerate with
 * @param originalToken - Original token (from header/cookie)
 * @returns true if token is valid
 */
export function validateCsrfToken(token: string, sessionId: string, originalToken: string): boolean {
  const expectedToken = crypto
    .createHash('sha256')
    .update(`${sessionId}:${token}`)
    .digest('hex');

  return constantTimeCompare(expectedToken, originalToken);
}
