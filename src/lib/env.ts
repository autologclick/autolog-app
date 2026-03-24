/**
 * Environment variable validation
 * Validates that required secrets are strong and well-configured
 */

interface EnvValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Check if a string is strong (minimum 32 characters)
 * A strong secret should contain mixed case, numbers, and special chars
 */
function isStrongSecret(secret: string): boolean {
  if (!secret || secret.length < 32) return false;

  // Check for variety: must have at least 2 of these 3 categories
  const hasLowerCase = /[a-z]/.test(secret);
  const hasUpperCase = /[A-Z]/.test(secret);
  const hasNumbers = /\d/.test(secret);
  const hasSpecialChars = /[!@#$%^&*\-_=+]/.test(secret);

  const categoryCount = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  return categoryCount >= 2;
}

/**
 * Validate all required environment variables
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET environment variable is not set');
  } else if (!isStrongSecret(jwtSecret)) {
    errors.push(
      'JWT_SECRET is too weak. Must be at least 32 characters with mixed case, numbers, and special characters.'
    );
  } else if (jwtSecret === 'autolog-dev-secret-change-in-production') {
    errors.push('JWT_SECRET is still using the default development secret. Change it in production!');
  }

  // Check DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    errors.push('DATABASE_URL environment variable is not set');
  } else if (dbUrl.includes('file:./dev.db') && process.env.NODE_ENV === 'production') {
    errors.push('SQLite database should not be used in production. Use a proper database like PostgreSQL.');
  }

  // Check NODE_ENV
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV is not set. Defaulting to development.');
  }

  // Warn about public URLs in production
  if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') && process.env.NODE_ENV === 'production') {
    warnings.push('NEXT_PUBLIC_APP_URL contains localhost but NODE_ENV is production.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Log validation results
 */
export function logEnvValidation(): void {
  const result = validateEnv();

  if (result.errors.length > 0) {
    console.error('[ERROR] CRITICAL ENVIRONMENT CONFIGURATION ISSUES:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn('[WARNING] ENVIRONMENT CONFIGURATION WARNINGS:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
  }

  if (result.isValid) {
    console.log('[OK] Environment configuration is secure.');
  }
}

/**
 * Call this on application startup
 */
export function validateAndLogEnv(): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    logEnvValidation();
  }
}
