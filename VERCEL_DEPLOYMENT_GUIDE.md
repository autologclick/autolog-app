# AutoLog Vercel Deployment Guide

## Overview
The AutoLog Next.js application has been configured for deployment to Vercel with PostgreSQL (Neon/Vercel Postgres).

## Changes Made

### 1. Prisma Schema Update
**File:** `prisma/schema.prisma`
- Changed database provider from `sqlite` to `postgresql`
- Updated DATABASE_URL to use environment variable
- All models remain intact and compatible with PostgreSQL

### 2. Environment Configuration
**File:** `.env.example`
- Updated DATABASE_URL to PostgreSQL connection string format
- Set NEXT_PUBLIC_APP_URL to production domain: `https://autolog.click`
- All other environment variables preserved (Twilio, VAPID, Maps, Stripe)

### 3. Vercel Deployment Configuration
**File:** `vercel.json` (NEW)
- Build command includes `prisma generate` before Next.js build
- Output directory: `.next`
- Install command runs `npm install && prisma generate`
- Region: `fra1` (Frankfurt, closest to Israel)
- API functions have 60-second timeout

### 4. Package.json Updates
**File:** `package.json`
- Added `postinstall` script: `"postinstall": "prisma generate"`
  - This ensures Prisma client is generated after npm install
  - Critical for Vercel deployments to avoid binary mismatch issues
- Build script already present: `"build": "next build"`

### 5. Next.js Configuration
**File:** `next.config.js`
- Already configured with `output: 'standalone'`
- Includes security headers (CSP, X-Frame-Options, etc.)
- Proper cache headers for API routes

### 6. Git Ignore Updates
**File:** `.gitignore`
- Added: `prisma/dev.db`, `prisma/dev.db-journal`
- Added: `.vercel`, `.turbo`, and other deployment artifacts
- Prevents committing local development files

### 7. Health Check Endpoint
**File:** `src/app/api/health/route.ts` (Already Exists)
- Returns 200 OK with health status and database latency
- Useful for monitoring and smoke tests
- Used by: `GET /api/health`

## Pre-Deployment Checklist

### Environment Variables (Set in Vercel)
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string from Vercel
- [ ] `JWT_SECRET` - Strong random string (at least 32 characters)
- [ ] `NEXT_PUBLIC_APP_URL` - Set to `https://autolog.click`
- [ ] `TWILIO_ACCOUNT_SID` - For WhatsApp integration (if needed)
- [ ] `TWILIO_AUTH_TOKEN` - For WhatsApp integration (if needed)
- [ ] `TWILIO_WHATSAPP_FROM` - WhatsApp number (if needed)
- [ ] `VAPID_PUBLIC_KEY` - For web push notifications (if needed)
- [ ] `VAPID_PRIVATE_KEY` - For web push notifications (if needed)
- [ ] `MAPS_API_KEY` - For maps feature (if needed)
- [ ] `STRIPE_SECRET_KEY` - For payments (if needed)

### Database Setup
1. Create a PostgreSQL database via Neon or Vercel Postgres
2. Copy the DATABASE_URL connection string
3. Set DATABASE_URL in Vercel environment variables
4. Vercel will run `prisma generate` during build via postinstall script
5. (Optional) Run migrations manually if needed: `npx prisma migrate deploy`

### Important Notes
- **Do NOT run** `npx prisma migrate` or `npx prisma generate` on Windows host
- The postinstall script in Vercel handles Prisma client generation
- All Hebrew UI text is preserved
- Build command in vercel.json includes prisma generate to handle any edge cases

## Deployment Steps

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel project settings
3. Deploy - Vercel will automatically:
   - Run `npm install && prisma generate` (via postinstall)
   - Build with `prisma generate && next build` (via vercel.json buildCommand)
   - Deploy to fra1 (Frankfurt) region
   - Health check available at `GET /api/health`

## Post-Deployment Verification

1. Check health endpoint: `https://autolog.click/api/health`
2. Verify database connectivity
3. Test authentication flows
4. Monitor Vercel logs for any issues

## Database Migrations (if needed)

To run database migrations after deployment:
```bash
npx prisma migrate deploy
```

Or to create new migrations after schema changes:
```bash
npx prisma migrate dev --name migration_name
```

**Note:** Run these commands locally, commit the migrations folder, and they'll be applied during deployment if configured.

## Reverting to SQLite (if needed)

To revert to SQLite development:
1. Change `prisma/schema.prisma` provider back to "sqlite"
2. Set `DATABASE_URL="file:./dev.db"` in `.env`
3. Run `npx prisma generate` (on appropriate system)

