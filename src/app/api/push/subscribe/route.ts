import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

/**
 * POST /api/push/subscribe
 * Save a push subscription for the authenticated user.
 * Uses a self-managed table (auto-created if missing).
 */

let tableChecked = false;

async function ensurePushTable() {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PushSubscription" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL,
        "endpoint" TEXT NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key"
      ON "PushSubscription" ("endpoint")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"
      ON "PushSubscription" ("userId")
    `);
  } catch { /* non-fatal */ }
  tableChecked = true;
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return errorResponse('נתוני subscription חסרים', 400);
    }

    await ensurePushTable();

    // Upsert: replace if same endpoint exists
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PushSubscription" ("id", "userId", "endpoint", "p256dh", "auth")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       ON CONFLICT ("endpoint")
       DO UPDATE SET "userId" = $1, "p256dh" = $3, "auth" = $4`,
      payload.userId, endpoint, keys.p256dh, keys.auth
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/push/subscribe
 * Returns VAPID public key for client-side subscription.
 */
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return errorResponse('Push notifications not configured', 404);
  }
  return jsonResponse({ publicKey });
}
