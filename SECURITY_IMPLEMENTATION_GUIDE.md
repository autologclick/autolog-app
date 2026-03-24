# Security Implementation Quick Reference

## How the Security Measures Work Together

```
User Request
    ↓
Middleware (RBAC + JWT Validation)
    ↓
Rate Limiter (Per IP or Per User)
    ↓
Input Sanitization
    ↓
Authorization Check (Ownership)
    ↓
Database Query
    ↓
Response + Security Headers
```

---

## 1. ROLE-BASED ACCESS CONTROL (RBAC)

### Where it happens: `/src/middleware.ts`

**Flow:**
```typescript
// 1. Check if route requires auth
if (!token) return unauthorized();

// 2. Verify JWT signature
const payload = verifyToken(token);

// 3. Check user role
if (pathname.startsWith('/admin') && payload.role !== 'admin') {
  return forbidden();
}
```

**To protect a new route:**
```typescript
// In middleware.ts, add:
if (pathname.startsWith('/my-feature')) {
  if (payload.role !== 'required_role') {
    return forbidden();
  }
}
```

---

## 2. RATE LIMITING

### Where it happens: `/src/lib/rate-limit.ts`

**How it tracks:**
- By IP address: `x-forwarded-for` header
- By User ID: Token userId claim
- In-memory Map for O(1) lookups

**To apply to an endpoint:**
```typescript
import { checkApiRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);

  // Add this check
  const rateLimit = checkApiRateLimit(payload.userId);
  if (!rateLimit.allowed) {
    return errorResponse('Too many requests', 429);
  }

  // Rest of endpoint...
}
```

**To create a custom rate limit:**
```typescript
// In rate-limit.ts, add new store and function:
const customAttempts = new Map();

export function checkCustomRateLimit(userId: string) {
  return checkRateLimit(customAttempts, userId, 10, 60 * 1000);
}
```

---

## 3. INPUT SANITIZATION

### Where it happens: `/src/lib/api-helpers.ts`

**Functions:**
```typescript
sanitizeInput(str)        // Single string
sanitizeObject(obj)       // Entire object
```

**To sanitize input:**
```typescript
import { sanitizeInput } from '@/lib/api-helpers';

const nickname = sanitizeInput(body.nickname);
// '<script>alert(1)</script>' becomes 'alert(1)'
```

**Already applied to:**
- Email inputs
- Text fields (nickname, name, description)
- Optional: phone, IDs

**NOT applied to:**
- Enum fields (validated by Zod)
- Boolean fields
- Number fields
- Date fields

---

## 4. OWNERSHIP VERIFICATION

### Where it happens: `/src/lib/api-helpers.ts`

**Function:**
```typescript
requireOwnership(userIdFromToken, resourceUserId, resourceType)
```

**Usage:**
```typescript
// Get user's vehicle
const vehicle = await prisma.vehicle.findUnique({
  where: { id: vehicleId }
});

// Verify ownership
requireOwnership(payload.userId, vehicle.userId, 'vehicle');

// If different user, throws 403 Forbidden
```

**To add to a route:**
```typescript
export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  const { id } = getParams(req); // vehicleId, etc.

  const resource = await prisma.model.findUnique({
    where: { id }
  });

  // NEW: Check ownership
  requireOwnership(payload.userId, resource.userId, 'vehicle');

  return jsonResponse(resource);
}
```

---

## 5. SECURITY HEADERS

### Where they're set: `/next.config.js`

**Headers configuration:**
```javascript
headers: async () => {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        // ... more headers
      ]
    }
  ]
}
```

**These are automatic!** No code changes needed in routes.

**Verify headers are sent:**
```bash
curl -I http://localhost:3000/api/vehicles
# Check for X-Content-Type-Options: nosniff
```

---

## 6. ENVIRONMENT VALIDATION

### Where it happens: `/src/lib/env.ts`

**To validate on startup:**
```typescript
import { validateAndLogEnv } from '@/lib/env';

// In your app initialization (e.g., root layout or API setup):
if (typeof window === 'undefined') {
  validateAndLogEnv();
}
```

**What's checked:**
- JWT_SECRET exists and is strong (≥32 chars)
- DATABASE_URL exists
- NODE_ENV is set
- No dev config in production

---

## Common Security Patterns

### Pattern 1: Protect Admin Route

```typescript
import { requireAdmin } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const payload = requireAdmin(req); // Throws 403 if not admin

  // Safe to proceed with admin operations
  const stats = await getAdminStats();
  return jsonResponse(stats);
}
```

### Pattern 2: User-Specific Data

```typescript
import { requireAuth, requireOwnership } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  const vehicleId = getParam(req, 'id');

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId }
  });

  // Only owner can access
  requireOwnership(payload.userId, vehicle.userId, 'vehicle');

  return jsonResponse(vehicle);
}
```

### Pattern 3: Rate-Limited Action

```typescript
import { checkApiRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);

  // Check rate limit
  const limit = checkApiRateLimit(payload.userId);
  if (!limit.allowed) {
    return errorResponse('Too many requests', 429);
  }

  // Proceed with action
  const result = await performAction();
  return jsonResponse(result);
}
```

### Pattern 4: Sanitized Input

```typescript
import { sanitizeInput } from '@/lib/api-helpers';

const { nickname, description } = body;
const sanitized = {
  nickname: sanitizeInput(nickname),
  description: sanitizeInput(description)
};

// Safe to store in database
await db.create({ ...sanitized });
```

---

## Testing Security

### 1. Test Rate Limiting
```bash
# Try to login 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# 6th attempt should return 429
```

### 2. Test RBAC
```bash
# Login as regular user
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"user@test.com","password":"pass"}' \
  | jq -r '.token')

# Try to access admin API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin
# Should return 403 Forbidden
```

### 3. Test Ownership
```bash
# Login as user A, get their vehicle ID
# Login as user B
# Try to access user A's vehicle
curl http://localhost:3000/api/vehicles/user-a-vehicle-id
# Should return 403 if different owner
```

### 4. Test Input Sanitization
```bash
# Try to inject XSS
curl -X POST http://localhost:3000/api/vehicles \
  -d '{"nickname":"<script>alert(1)</script>"}'
# Script tags should be stripped
```

---

## Troubleshooting

### "Unauthorized" on protected route
1. Check JWT token in `auth-token` cookie
2. Verify token hasn't expired (7 days)
3. Check JWT_SECRET matches signing key

### "Forbidden" on route you should access
1. Check your user role in JWT payload
2. Verify middleware rule matches your role
3. Check resource ownership if applicable

### Rate limit error (429)
1. Wait for the rate limit window to reset
2. Reduce request frequency
3. Check X-RateLimit-Reset header (if implemented)

### Input sanitization breaking data
1. Check what characters are being removed
2. Adjust sanitization rules if legitimate
3. Validate input format before sanitization

---

## Security Checklist for New Features

When adding a new API route:

- [ ] Add `requireAuth()` to check authentication
- [ ] Add role check if admin/special access needed
- [ ] Add `requireOwnership()` if user-specific data
- [ ] Add rate limiting if public or high-volume
- [ ] Sanitize string inputs with `sanitizeInput()`
- [ ] Validate with Zod schema
- [ ] Test 403/401/429 error cases
- [ ] Verify response doesn't leak sensitive data

---

## Performance Notes

### Rate Limiter Memory Usage
- ~100 active users = ~300 KB
- ~10,000 active users = ~30 MB
- Expires entries every 5 minutes

**For high-volume apps:** Use Redis-based rate limiter instead

### Sanitization Overhead
- ~0.1ms per string field
- Regex processing is optimized
- Negligible performance impact

### JWT Verification
- Signature check: ~0.5ms
- Decoding: < 0.1ms
- Cached in cookie, no repeated lookups

---

## Useful Commands

```bash
# Check for security vulnerabilities
npm audit

# Generate strong secret
openssl rand -base64 32

# Test API with auth
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/endpoint

# Check security headers
curl -I http://localhost:3000/
```

---

**Last Updated:** March 20, 2026
**Version:** 1.0
