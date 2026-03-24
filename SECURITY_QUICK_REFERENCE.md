# AutoLog Security - Quick Reference Guide

## Token Lifecycle

### 1. Registration/Login
```bash
POST /api/auth/register  # or /api/auth/login
```

**Response:** 2 httpOnly cookies
- `auth-token` - Access token (expires in 15 minutes)
- `refresh-token` - Refresh token (expires in 7 days)

### 2. Using Access Token
```typescript
// Client automatically sends auth-token cookie with requests
const response = await fetch('/api/protected-endpoint', {
  credentials: 'include'  // Required to send cookies
});
```

### 3. Access Token Expires (After 15 minutes)
```bash
GET /api/protected-endpoint
# → 401 Unauthorized
```

### 4. Refresh Token
```bash
POST /api/auth/refresh
# Client sends refresh-token cookie automatically
```

**Response:** New tokens
- `auth-token` - New access token (15 min)
- `refresh-token` - New refresh token (7 days)
- **Old refresh token is blacklisted and cannot be reused**

### 5. Refresh Token Expires (After 7 days)
```bash
POST /api/auth/refresh
# → 401 Invalid refresh token
# → User must login again
```

---

## Account Lockout

### Mechanism
- **Threshold:** 5 failed attempts
- **Window:** Any 15-minute period
- **Lockout Duration:** 15 minutes
- **Tracked by:** Email address

### What Triggers Lockout
- Invalid password attempt
- User not found (same error message to prevent enumeration)
- Any authentication failure

### User Feedback
```json
{
  "error": "החשבון נעול עקב מספר ניסיונות כושלים. אנא נסה שוב ב-45 שניות."
}
```

### Reset
- Automatic: After 15 minutes elapsed
- Manual: Successful login resets the counter

---

## Rate Limiting

### Login Endpoint
- **Limit:** 5 attempts per minute
- **Per:** Client IP address
- **Tracked by:** X-Forwarded-For / X-Real-IP headers

### Registration Endpoint
- **Limit:** 3 attempts per minute
- **Per:** Client IP address

### General API
- **Limit:** 100 calls per minute
- **Per:** Authenticated user ID

### Response When Limited
```json
{
  "error": "יותר מדי ניסיונות התחברות. אנא נסה שוב ב-45 שניות."
}
// HTTP 429 Too Many Requests
```

---

## Security Utilities in `src/lib/security.ts`

### Input Validation
```typescript
import { sanitizeInput, validatePasswordStrength } from '@/lib/security';

// Prevent XSS attacks
const cleanName = sanitizeInput(userInput);

// Validate password strength
const { isValid, errors } = validatePasswordStrength(password);
if (!isValid) {
  console.log(errors);  // ["Password must be 8+ chars", ...]
}
```

### PII Masking (For Logs)
```typescript
import { maskEmail, maskPhone } from '@/lib/security';

console.log(maskEmail('john.doe@example.com'));
// Output: "j***@example.com"

console.log(maskPhone('+972501234567'));
// Output: "+972***4567"
```

### Secure Token Generation
```typescript
import { generateSecureToken } from '@/lib/security';

// Generate password reset token
const resetToken = generateSecureToken(32);
// Output: "a1b2c3d4e5f6..." (hex string)
```

### IP Address Hashing (Anonymous Tracking)
```typescript
import { hashIP } from '@/lib/security';

const hashedIP = hashIP(clientIp);
// Output: "abc123def456..." (SHA-256)
// Allows correlation without exposing real IP
```

### Security Event Logging
```typescript
import { createSecurityEventLog } from '@/lib/security';

const log = createSecurityEventLog(
  'login_success',
  userId,
  userEmail,
  clientIP,
  { additionalData: 'value' }
);

console.log(JSON.stringify(log));
// {
//   "timestamp": "2026-03-22T12:34:56.789Z",
//   "eventType": "login_success",
//   "userId": "user123",
//   "maskedEmail": "j***@example.com",
//   "hashedIP": "abc123...",
//   "details": { ... }
// }
```

---

## Account Lockout in Code

### Check if Locked
```typescript
import { isAccountLocked, getLockoutTimeRemaining } from '@/lib/rate-limit';

if (isAccountLocked('user@example.com')) {
  const remainingMs = getLockoutTimeRemaining('user@example.com');
  const secondsRemaining = Math.ceil(remainingMs / 1000);
  // Return 403 with error message
}
```

### Record Failed Attempt
```typescript
import { recordFailedAttempt } from '@/lib/rate-limit';

if (password_invalid) {
  recordFailedAttempt(email);  // Increments counter, locks at 5
}
```

### Reset on Success
```typescript
import { resetFailedAttempts } from '@/lib/rate-limit';

if (authentication_successful) {
  resetFailedAttempts(email);  // Clears counter
}
```

---

## Token Rotation Example

### Generate Tokens
```typescript
import { generateToken, generateRefreshToken } from '@/lib/auth';

const accessToken = generateToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});

const refreshToken = generateRefreshToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});
```

### Rotate Tokens
```typescript
import { rotateTokens } from '@/lib/auth';

const { accessToken, refreshToken } = rotateTokens(
  oldRefreshToken,
  {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
);

// Old refresh token is automatically blacklisted
// New tokens can be used
```

---

## Environment Setup

### Required Environment Variables
```bash
# In .env.local or .env.production

# JWT secret (32+ characters, random)
JWT_SECRET=your-very-long-random-secret-here-min-32-chars

# Node environment
NODE_ENV=production

# Optional: Salt for IP hashing
IP_HASH_SALT=your-optional-salt-here
```

### If JWT_SECRET Not Set
- System generates random 32-byte secret
- Logs LOUD WARNING to console
- **Security**: Only acceptable in development
- **Production**: Must set JWT_SECRET explicitly

---

## Monitoring & Alerts

### Key Events to Log/Alert
```
- login_success
- login_user_not_found
- login_invalid_password
- login_account_locked
- login_account_inactive
- login_rate_limit_exceeded
- registration_success
- token_refresh_success
- token_blacklist_hit
```

### Suspicious Activity Levels
```
0 = Normal
1 = Medium (10+ failed attempts from IP in 1 hour)
2 = High (15+ failed attempts)
3 = Critical (20+ failed attempts)
```

### Check Suspicious Level
```typescript
import { getIpSuspiciousLevel } from '@/lib/rate-limit';

const suspicionLevel = getIpSuspiciousLevel(clientIP);
// 0 = Low, 1 = Medium, 2 = High, 3 = Critical

if (suspicionLevel >= 2) {
  // Log to security dashboard
  // Consider blocking IP temporarily
}
```

---

## Testing Account Lockout

### Manual Test
```bash
# Attempt 1: curl -X POST http://localhost:3000/api/auth/login \
#   -H "Content-Type: application/json" \
#   -d '{"email": "test@example.com", "password": "wrong"}'

# Repeat 5 times with wrong password

# Attempt 6: Returns 403 with lockout message
```

### Expect Behavior
- Attempts 1-4: `401 Unauthorized` (wrong password)
- Attempt 5: `401 Unauthorized` (last before lock)
- Attempt 6+: `403 Forbidden` (account locked)
- Wait 15 minutes or check time until unlock

---

## Troubleshooting

### "Invalid refresh token"
- **Cause:** Token expired (7 days)
- **Solution:** User must login again

### "Account locked"
- **Cause:** 5+ failed attempts in 15 minutes
- **Solution:** Wait 15 minutes or reset in admin panel

### "Too many requests"
- **Cause:** Rate limit exceeded (5/min for login)
- **Solution:** Wait for reset window (next minute)

### JWT_SECRET Warning in Logs
- **Cause:** JWT_SECRET not set in environment
- **Solution:** Set `JWT_SECRET` in .env.local/.env.production

### Token works then suddenly fails
- **Cause:** Refresh token rotation happened
- **Solution:** Call `/api/auth/refresh` to get new pair

---

## Production Checklist

- [ ] `JWT_SECRET` set to strong random value
- [ ] `NODE_ENV=production`
- [ ] HTTPS enabled (secure cookies won't work on HTTP)
- [ ] `X-Forwarded-For` headers passed from reverse proxy
- [ ] Logging/monitoring configured
- [ ] Redis deployment planned (for scaling beyond single server)
- [ ] Backup authentication method for emergencies
- [ ] Security monitoring dashboard set up

---

## Related Files

- `src/lib/auth.ts` - Token generation, rotation, blacklisting
- `src/lib/rate-limit.ts` - Account lockout, rate limiting
- `src/lib/security.ts` - Utility functions (masking, hashing, etc.)
- `src/app/api/auth/login/route.ts` - Login endpoint
- `src/app/api/auth/register/route.ts` - Registration endpoint
- `src/app/api/auth/refresh/route.ts` - Token refresh endpoint
- `SECURITY_HARDENING_SUMMARY.md` - Full implementation details

---

**Last Updated:** 2026-03-22
**Version:** 1.0
**Status:** Production Ready
