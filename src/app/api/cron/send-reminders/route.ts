import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/services/notification-service';
import { sendEmail, buildExpiryReminderEmailHtml } from '@/lib/email';
import { sendPushToUser } from '@/lib/push-sender';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cron-reminders');

// Reminder thresholds (days before expiry). Sent in this exact order — each
// gets its own deduplicated notification, so a user gets up to 4 reminders
// per renewal cycle, not 1.
const REMINDER_THRESHOLDS = [30, 14, 7, 1] as const;
type Threshold = (typeof REMINDER_THRESHOLDS)[number];

type ReminderType = 'test_expiry' | 'insurance_expiry' | 'compulsory_insurance_expiry';

// Matches the shape persisted by the settings UI at /user/settings.
interface UserPrefs {
  // Per-channel global opt-out
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
  // Per-reminder-type opt-out (UI controls these toggles)
  testReminder?: boolean;
  insuranceReminder?: boolean; // covers BOTH comprehensive AND compulsory insurance
  inspectionUpdate?: boolean;
  appointmentReminder?: boolean;
  sosAlerts?: boolean;
  benefitAlerts?: boolean;
}

// =============================================================
// Cron auth
// =============================================================

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  // In development without a secret, allow any caller (useful for local testing).
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

// =============================================================
// Helpers
// =============================================================

function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Pick the matching threshold for a given days-until-expiry value.
 * Returns the LARGEST threshold ≥ daysUntil so that:
 *   daysUntil = 25 → 30 (we passed the 30-day mark, in the 30-14 window)
 *   daysUntil = 10 → 14
 *   daysUntil = 5  → 7
 *   daysUntil = 1  → 1
 *   daysUntil = 0  → 1 (last-chance reminder)
 *   daysUntil = -1 → null (already expired, no more reminders)
 */
function thresholdFor(daysUntil: number): Threshold | null {
  if (daysUntil < 0) return null;
  // Find the smallest threshold that's still ≥ daysUntil (since thresholds
  // count days remaining, smaller = closer to expiry = more urgent).
  for (const t of REMINDER_THRESHOLDS) {
    if (daysUntil <= t) return t;
  }
  return null; // beyond 30 days, no reminder
}

function formatDaysHeb(days: number): string {
  if (days <= 0) return 'היום';
  if (days === 1) return 'מחר';
  if (days <= 7) return `תוך ${days} ימים`;
  if (days <= 14) return 'תוך שבועיים';
  return `תוך ${days} יום`;
}

function getUrgencyIcon(days: number): string {
  if (days <= 1) return '⚠️';
  if (days <= 7) return '⏰';
  return '📅';
}

const TYPE_LABEL: Record<ReminderType, string> = {
  test_expiry: 'טסט',
  insurance_expiry: 'ביטוח מקיף',
  compulsory_insurance_expiry: 'ביטוח חובה',
};

// We embed `[t:N]` in the notification title so dedup can distinguish
// "30-day reminder sent" from "14-day reminder sent" for the same vehicle.
function thresholdMarker(t: Threshold): string {
  return `[t:${t}]`;
}

/**
 * Was the SAME threshold reminder already sent for this vehicle?
 * Look back 60 days to catch anything within a renewal cycle.
 */
async function wasThresholdReminderSent(
  userId: string,
  type: ReminderType,
  licensePlate: string,
  threshold: Threshold,
): Promise<boolean> {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const marker = thresholdMarker(threshold);
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      // The marker MUST be in the title — see sendReminder below.
      title: { contains: marker },
      // And the message MUST mention this specific vehicle's plate.
      message: { contains: licensePlate },
      createdAt: { gte: sixtyDaysAgo },
    },
  });
  return !!existing;
}

function parsePrefs(json: string | null): UserPrefs {
  if (!json) return {};
  try {
    return JSON.parse(json) as UserPrefs;
  } catch {
    return {};
  }
}

function isReminderEnabled(prefs: UserPrefs, type: ReminderType): boolean {
  // Default to enabled — opt-out model. Only skip when explicitly false.
  // Both comprehensive and compulsory insurance share `insuranceReminder` —
  // matches the single "תזכורת ביטוח" toggle in the UI.
  if (type === 'test_expiry' && prefs.testReminder === false) return false;
  if (type === 'insurance_expiry' && prefs.insuranceReminder === false) return false;
  if (type === 'compulsory_insurance_expiry' && prefs.insuranceReminder === false) return false;
  return true;
}

// =============================================================
// Per-reminder send (in-app + email + push)
// =============================================================

interface SendStats {
  inAppCreated: number;
  emailsSent: number;
  emailsFailed: number;
  pushesSent: number;
  pushesFailed: number;
}

async function sendReminder(opts: {
  userId: string;
  userEmail: string | null;
  userFullName: string | null;
  prefs: UserPrefs;
  vehicleId: string;
  licensePlate: string;
  vehicleName: string;
  type: ReminderType;
  threshold: Threshold;
  expiryDate: Date;
  daysUntilExpiry: number;
  stats: SendStats;
}): Promise<void> {
  const { userId, userEmail, userFullName, prefs, vehicleId, licensePlate, vehicleName,
          type, threshold, expiryDate, daysUntilExpiry, stats } = opts;

  const typeLabel = TYPE_LABEL[type];
  const urgency = getUrgencyIcon(daysUntilExpiry);
  const timeText = formatDaysHeb(daysUntilExpiry);
  const link = `/user/vehicles/${vehicleId}`;
  const marker = thresholdMarker(threshold);

  // ─── 1. In-app notification (always sent; cheap and the user can disable
  //        per-type globally via prefs) ───
  if (prefs.inApp !== false) {
    try {
      await createNotification({
        userId,
        type,
        title: `${urgency} תזכורת ${typeLabel} ${marker} — ${vehicleName}`,
        message: `ה${typeLabel} של רכב ${licensePlate} פג ${timeText}. כדאי לטפל בזה עכשיו.`,
        link,
      });
      stats.inAppCreated++;
    } catch (e) {
      logger.warn('Failed to create in-app reminder', {
        userId, vehicleId, type, threshold,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // ─── 2. Email (opt-out via prefs.email === false) ───
  if (userEmail && prefs.email !== false) {
    try {
      const reminderType: 'test' | 'insurance' | 'compulsory' =
        type === 'test_expiry' ? 'test' :
        type === 'compulsory_insurance_expiry' ? 'compulsory' :
        'insurance';
      const html = buildExpiryReminderEmailHtml({
        fullName: userFullName || 'נהג/ת יקר/ה',
        vehicleName,
        licensePlate,
        reminderType,
        expiryDate,
        daysUntil: daysUntilExpiry,
      });
      const sent = await sendEmail({
        to: userEmail,
        subject: `${urgency} תזכורת ${typeLabel} — ${vehicleName} (${licensePlate})`,
        html,
      });
      if (sent) stats.emailsSent++; else stats.emailsFailed++;
    } catch (e) {
      stats.emailsFailed++;
      logger.error('Failed to send reminder email', {
        userId, vehicleId, type, threshold,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // ─── 3. Push (opt-out via prefs.push === false) ───
  if (prefs.push !== false) {
    try {
      const sent = await sendPushToUser(userId, {
        title: `${urgency} תזכורת ${typeLabel}`,
        body: `${vehicleName} (${licensePlate}) — פג ${timeText}`,
        tag: `reminder-${vehicleId}-${type}-${threshold}`,
        requireInteraction: daysUntilExpiry <= 1,
        data: { link, type },
      });
      if (sent > 0) stats.pushesSent++; else stats.pushesFailed++;
    } catch (e) {
      stats.pushesFailed++;
      logger.warn('Failed to send push reminder', {
        userId, vehicleId, type, threshold,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

// =============================================================
// Main handler
// =============================================================

export async function GET(req: NextRequest) {
  try {
    if (!verifyCronAuth(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const maxDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

    const stats: SendStats & { processedVehicles: number; remindersDeduped: number; statusUpdated: number } = {
      processedVehicles: 0,
      remindersDeduped: 0,
      statusUpdated: 0,
      inAppCreated: 0,
      emailsSent: 0,
      emailsFailed: 0,
      pushesSent: 0,
      pushesFailed: 0,
    };

    // Fetch vehicles whose test, insurance, or compulsory insurance expires
    // within the next 31 days. One query, multiple conditions.
    const vehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { testExpiryDate: { lte: maxDate, gte: now } },
          { insuranceExpiry: { lte: maxDate, gte: now } },
          { compulsoryInsuranceExpiry: { lte: maxDate, gte: now } },
        ],
      },
      include: {
        user: {
          select: {
            id: true, fullName: true, email: true,
            notificationPreferences: true,
          },
        },
      },
    });

    stats.processedVehicles = vehicles.length;

    for (const vehicle of vehicles) {
      const prefs = parsePrefs(vehicle.user.notificationPreferences);
      const vehicleName = vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`;

      const checks: Array<{ type: ReminderType; expiry: Date | null }> = [
        { type: 'test_expiry', expiry: vehicle.testExpiryDate },
        { type: 'insurance_expiry', expiry: vehicle.insuranceExpiry },
        { type: 'compulsory_insurance_expiry', expiry: vehicle.compulsoryInsuranceExpiry },
      ];

      for (const { type, expiry } of checks) {
        if (!expiry) continue;
        if (!isReminderEnabled(prefs, type)) continue;

        const d = daysUntil(expiry, now);
        const threshold = thresholdFor(d);
        if (threshold === null) continue;

        // Per-threshold dedup — key insight: when daysUntil crosses 14→7,
        // we DO want a new reminder, even though one was sent last week.
        // Looking up by (vehicle, type, threshold) makes this work.
        const alreadySent = await wasThresholdReminderSent(
          vehicle.user.id, type, vehicle.licensePlate, threshold,
        );
        if (alreadySent) {
          stats.remindersDeduped++;
          continue;
        }

        await sendReminder({
          userId: vehicle.user.id,
          userEmail: vehicle.user.email,
          userFullName: vehicle.user.fullName,
          prefs,
          vehicleId: vehicle.id,
          licensePlate: vehicle.licensePlate,
          vehicleName,
          type,
          threshold,
          expiryDate: expiry,
          daysUntilExpiry: d,
          stats,
        });
      }

      // ─── Update Vehicle status fields so the UI shows the right colors ───
      const updates: Record<string, string> = {};
      const updateStatus = (current: string, expiry: Date | null, fieldName: string) => {
        if (!expiry) return;
        const d = daysUntil(expiry, now);
        const next = d <= 0 ? 'expired' : d <= 30 ? 'expiring' : 'valid';
        if (next !== current) updates[fieldName] = next;
      };

      updateStatus(vehicle.testStatus, vehicle.testExpiryDate, 'testStatus');
      updateStatus(vehicle.insuranceStatus, vehicle.insuranceExpiry, 'insuranceStatus');
      updateStatus(vehicle.compulsoryInsuranceStatus, vehicle.compulsoryInsuranceExpiry, 'compulsoryInsuranceStatus');

      if (Object.keys(updates).length > 0) {
        await prisma.vehicle.update({ where: { id: vehicle.id }, data: updates });
        stats.statusUpdated++;
      }
    }

    // ─── Also catch vehicles that JUST expired (status fix-up) ───
    const expiredVehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { testExpiryDate: { lt: now }, testStatus: { not: 'expired' } },
          { insuranceExpiry: { lt: now }, insuranceStatus: { not: 'expired' } },
          { compulsoryInsuranceExpiry: { lt: now }, compulsoryInsuranceStatus: { not: 'expired' } },
        ],
      },
    });

    for (const v of expiredVehicles) {
      const updates: Record<string, string> = {};
      if (v.testExpiryDate && v.testExpiryDate < now && v.testStatus !== 'expired') updates.testStatus = 'expired';
      if (v.insuranceExpiry && v.insuranceExpiry < now && v.insuranceStatus !== 'expired') updates.insuranceStatus = 'expired';
      if (v.compulsoryInsuranceExpiry && v.compulsoryInsuranceExpiry < now && v.compulsoryInsuranceStatus !== 'expired') {
        updates.compulsoryInsuranceStatus = 'expired';
      }
      if (Object.keys(updates).length > 0) {
        await prisma.vehicle.update({ where: { id: v.id }, data: updates });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        stats,
        expiredStatusFixed: expiredVehicles.length,
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    logger.error('Cron reminders failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
