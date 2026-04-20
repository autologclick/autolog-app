/**
 * Push Notification Sender
 * Sends web push notifications to users by looking up their subscriptions in the DB.
 * Gracefully degrades if VAPID keys are missing or web-push is not installed.
 */

import prisma from '@/lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebPush = any;

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
  requireInteraction?: boolean;
}

/**
 * Send push notification to a specific user (all their registered devices).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return 0;

  let webPush: WebPush;
  try {
    webPush = require('web-push');
  } catch {
    return 0;
  }

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'https://autolog.click',
    publicKey,
    privateKey
  );

  let subs: PushSub[] = [];
  try {
    subs = await prisma.$queryRawUnsafe<PushSub[]>(
      `SELECT "endpoint", "p256dh", "auth" FROM "PushSubscription" WHERE "userId" = $1`,
      userId
    );
  } catch {
    return 0; // Table might not exist yet
  }

  const jsonPayload = JSON.stringify({
    ...payload,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        jsonPayload
      );
      sent++;
    } catch (err: unknown) {
      // If subscription expired (410 Gone), remove it
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        try {
          await prisma.$executeRawUnsafe(
            `DELETE FROM "PushSubscription" WHERE "endpoint" = $1`,
            sub.endpoint
          );
        } catch { /* non-fatal */ }
      }
    }
  }
  return sent;
}

/**
 * Send push notification to all users with a specific role (e.g., 'admin', 'garage_owner').
 */
export async function sendPushToRole(role: string, payload: PushPayload): Promise<number> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return 0;

  let subs: (PushSub & { userId: string })[] = [];
  try {
    subs = await prisma.$queryRawUnsafe<(PushSub & { userId: string })[]>(
      `SELECT ps."endpoint", ps."p256dh", ps."auth", ps."userId"
       FROM "PushSubscription" ps
       JOIN "User" u ON u."id" = ps."userId"
       WHERE u."role" = $1`,
      role
    );
  } catch {
    return 0;
  }

  if (subs.length === 0) return 0;

  let webPush: WebPush;
  try {
    webPush = require('web-push');
  } catch {
    return 0;
  }

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'https://autolog.click',
    publicKey,
    privateKey
  );

  const jsonPayload = JSON.stringify({
    ...payload,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        jsonPayload
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        try {
          await prisma.$executeRawUnsafe(
            `DELETE FROM "PushSubscription" WHERE "endpoint" = $1`,
            sub.endpoint
          );
        } catch { /* non-fatal */ }
      }
    }
  }
  return sent;
}

/**
 * De-duplication: Create an in-app notification only if a similar one
 * hasn't been sent to this user in the last `cooldownDays` days.
 * Prevents notification spam for recurring events (test expiry, insurance, etc.).
 *
 * @param userId    - Target user
 * @param type      - Notification type (e.g. "test_expiry", "insurance_expiry")
 * @param title     - Notification title (Hebrew)
 * @param message   - Notification body (Hebrew)
 * @param link      - Optional deep link
 * @param cooldownDays - Minimum days between same-type notifications (default 7)
 * @returns true if notification was created, false if suppressed (duplicate)
 */
export async function createNotificationIfNew(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  cooldownDays = 7
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);

    // Check if a similar notification was already sent recently
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        title,
        createdAt: { gte: since },
      },
      select: { id: true },
    });

    if (existing) {
      return false; // Skip — already sent recently
    }

    await prisma.notification.create({
      data: { userId, type, title, message, link },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Send push notification to a specific garage owner by garageId.
 */
export async function sendPushToGarageOwner(garageId: string, payload: PushPayload): Promise<number> {
  let ownerIds: { ownerId: string }[] = [];
  try {
    ownerIds = await prisma.$queryRawUnsafe<{ ownerId: string }[]>(
      `SELECT "ownerId" FROM "Garage" WHERE "id" = $1 AND "ownerId" IS NOT NULL`,
      garageId
    );
  } catch {
    return 0;
  }

  if (ownerIds.length === 0 || !ownerIds[0].ownerId) return 0;
  return sendPushToUser(ownerIds[0].ownerId, payload);
}
