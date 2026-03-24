# Security Implementation Guide - AutoLog

## Quick Reference

### Files Changed
- `src/app/api/auth/reset-password/route.ts` - SQL injection + password validation
- `src/app/api/auth/forgot-password/route.ts` - SQL injection fixed
- `src/app/api/garage/images/route.ts` - Path traversal fixed
- `src/lib/csrf.ts` - NEW: CSRF protection library
- `src/app/api/auth/csrf-token/route.ts` - NEW: CSRF token endpoint
- `src/middleware.ts` - Updated public routes
- `next.config.js` - Verified security headers (no changes)
- `src/lib/rate-limit.ts` - Verified rate limiting (no changes)

---

## How to Integrate CSRF Protection in Frontend

### Step 1: Get CSRF Token on Page Load

```typescript
// In your auth page or during login form initialization
const response = await fetch('/api/auth/csrf-token', {
  credentials: 'include' // Important: include cookies
});
const { csrfToken } = await response.json();

// Store in state or hidden input
setCSRFToken(csrfToken);
```

### Step 2: Include CSRF Token in State-Changing Requests

```typescript
// POST, PUT, PATCH, DELETE requests
const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Add CSRF token
  },
  body: JSON.stringify({
    token: resetToken,
    password: newPassword,
  }),
});
```

### Step 3: Handle CSRF Token Errors

```typescript
if (response.status === 403) {
  // CSRF token invalid or missing
  // Fetch a new token and retry
  const newTokenResponse = await fetch('/api/auth/csrf-token', {
    credentials: 'include'
  });
  const { csrfToken: newToken } = await newTokenResponse.json();
  // Retry with new token
}
```

---

## API Endpoints Overview

### Authentication Endpoints

| Endpoint | Method | Rate Limit | CSRF | Notes |
|----------|--------|-----------|------|-------|
| `/api/auth/login` | POST | 5/min per IP | N/A | Account lockout after 5 failures |
| `/api/auth/register` | POST | 3/min per IP | N/A | Public endpoint |
| `/api/auth/csrf-token` | GET | None | N/A | Public, for getting CSRF tokens |
| `/api/auth/forgot-password` | POST | 5/min per IP | Optional | Email enumeration safe |
| `/api/auth/reset-password` | POST | 5/min per IP | Recommended | 8 chars + upper + lower + digit |
| `/api/auth/change-password` | POST | 100/min user | Recommended | Requires current password |
| `/api/auth/logout` | POST | 100/min user | N/A | Session cleanup |
| `/api/auth/refresh` | POST | None | N/A | Token refresh |
| `/api/auth/me` | GET | 100/min user | N/A | Requires auth |

---

## Password Requirements

All password operations enforce:
- **Minimum 8 characters**
- **At least 1 uppercase letter** (A-Z)
- **At least 1 lowercase letter** (a-z)
- **At least 1 numeric digit** (0-9)

This applies to:
- User registration
- Password reset
- Password change

---

## Security Headers Overview

### Content-Security-Policy (CSP)
- Only load resources from same origin
- Script sources restricted
- Style sources from self and Google Fonts
- Images from self, data URLs, HTTPS
- Fonts from self and Google Fonts
- XHR/Fetch/WebSocket only to same origin
- Page cannot be framed by any origin

### Additional Headers
- X-Content-Type-Options: nosniff (prevent MIME sniffing)
- X-Frame-Options: DENY (prevent clickjacking)
- X-XSS-Protection: 1; mode=block (older browser protection)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: disable camera, microphone
- Cache-Control: no-store (prevent caching of sensitive data)

---

## Rate Limiting Details

### Login Endpoint
- **Limit:** 5 attempts per minute per IP
- **Account Lockout:** After 5 failed attempts
- **Lockout Duration:** 15 minutes
- **Progressive Delay:** Exponential backoff

### Registration Endpoint
- **Limit:** 3 attempts per minute per IP

### API Endpoints (General)
- **Limit:** 100 calls per minute per user

### IP Suspicious Activity
- **Tracking Window:** 1 hour
- **Level 3 (Critical):** At 20+ failed attempts

---

## Production Deployment Checklist

- [ ] All Prisma queries are parameterized
- [ ] All file operations use path.basename() sanitization
- [ ] CSRF tokens obtained before mutations
- [ ] X-CSRF-Token header sent on state-changing requests
- [ ] Password requirements enforced frontend + backend
- [ ] Account lockout tested
- [ ] HTTPS enabled (secure & sameSite cookies)
- [ ] Security headers verified in browser
- [ ] All error messages in Hebrew
- [ ] CSRF/rate limit stores migrated to Redis
- [ ] Security event logging configured
- [ ] Monitoring alerts for suspicious activity

---

## All Fixes Summary

✓ SQL Injection: Removed all $queryRawUnsafe and $executeRawUnsafe
✓ Path Traversal: Added path.basename() sanitization
✓ Password Strength: 8 chars + complexity requirements
✓ CSRF Protection: Token generation and validation
✓ Security Headers: Comprehensive CSP and security headers
✓ Rate Limiting: 5/min login, 3/min register, 100/min API
✓ Account Lockout: 15 minutes after 5 failed attempts
✓ All Text: Hebrew (עברית)
