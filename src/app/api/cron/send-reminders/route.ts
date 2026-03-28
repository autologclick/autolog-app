import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/services/notification-service';

// Reminder thresholds in days
const REMINDER_DAYS = [30, 14, 7, 3, 1];

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If no secret configured, allow (for development)
  if (!cronSecret) return true;
  
  return authHeader === 'Bearer ' + cronSecret;
}

/**
 * Check if a reminder was already sent for this vehicle/type/threshold
 * Prevents duplicate reminders
 */
async function wasReminderAlreadySent(
  userId: string,
  type: string,
  licensePlate: string,
  daysUntil: number
): Promise<boolean> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      message: { contains: licensePlate },
      createdAt: { gte: dayAgo },
    },
  });
  
  return !!existing;
}

/**
 * Format days until expiry into Hebrew text
 */
function formatDaysHeb(days: number): string {
  if (days <= 0) return '\u05d4\u05d9\u05d5\u05dd';
  if (days === 1) return '\u05de\u05d7\u05e8';
  if (days <= 7) return '\u05ea\u05d5\u05da ' + days + ' \u05d9\u05de\u05d9\u05dd';
  if (days <= 14) return '\u05ea\u05d5\u05da \u05e9\u05d1\u05d5\u05e2\u05d9\u05d9\u05dd';
  return '\u05ea\u05d5\u05da ' + days + ' \u05d9\u05d5\u05dd';
}

/**
 * Get urgency emoji based on days remaining
 */
function getUrgency(days: number): string {
  if (days <= 1) return '\u26a0\ufe0f';
  if (days <= 7) return '\u23f0';
  return '\ud83d\udcc5';
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyCronAuth(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const stats = {
      testReminders: 0,
      insuranceReminders: 0,
      alreadySent: 0,
      errors: 0,
      processedVehicles: 0,
    };

    // Find all vehicles with test or insurance expiring within 30 days
    const maxDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
    
    const vehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { testExpiryDate: { lte: maxDate, gte: now } },
          { insuranceExpiry: { lte: maxDate, gte: now } },
        ],
      },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });

    stats.processedVehicles = vehicles.length;

    for (const vehicle of vehicles) {
      // --- Test expiry reminders ---
      if (vehicle.testExpiryDate) {
        const daysUntilTest = Math.ceil(
          (vehicle.testExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Find the matching threshold
        const threshold = REMINDER_DAYS.find(d => daysUntilTest <= d);
        if (threshold !== undefined) {
          const alreadySent = await wasReminderAlreadySent(
            vehicle.user.id,
            'test_expiry',
            vehicle.licensePlate,
            daysUntilTest
          );

          if (!alreadySent) {
            try {
              const urgency = getUrgency(daysUntilTest);
              const timeText = formatDaysHeb(daysUntilTest);
              const vehicleName = vehicle.nickname || (vehicle.manufacturer + ' ' + vehicle.model);

              await createNotification({
                userId: vehicle.user.id,
                type: 'test_expiry',
                title: urgency + ' \u05ea\u05d6\u05db\u05d5\u05e8\u05ea \u05d8\u05e1\u05d8 - ' + vehicleName,
                message: '\u05d4\u05d8\u05e1\u05d8 \u05e9\u05dc \u05e8\u05db\u05d1 ' + vehicle.licensePlate + ' \u05e4\u05d2 ' + timeText + '. \u05e7\u05d1\u05e2 \u05ea\u05d5\u05e8 \u05dc\u05d1\u05d3\u05d9\u05e7\u05d4 \u05e2\u05db\u05e9\u05d9\u05d5.',
                link: '/user/vehicles/' + vehicle.id,
              });
              stats.testReminders++;
            } catch (e) {
              stats.errors++;
            }
          } else {
            stats.alreadySent++;
          }
        }
      }

      // --- Insurance expiry reminders ---
      if (vehicle.insuranceExpiry) {
        const daysUntilIns = Math.ceil(
          (vehicle.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const threshold = REMINDER_DAYS.find(d => daysUntilIns <= d);
        if (threshold !== undefined) {
          const alreadySent = await wasReminderAlreadySent(
            vehicle.user.id,
            'insurance_expiry',
            vehicle.licensePlate,
            daysUntilIns
          );

          if (!alreadySent) {
            try {
              const urgency = getUrgency(daysUntilIns);
              const timeText = formatDaysHeb(daysUntilIns);
              const vehicleName = vehicle.nickname || (vehicle.manufacturer + ' ' + vehicle.model);

              await createNotification({
                userId: vehicle.user.id,
                type: 'insurance_expiry',
                title: urgency + ' \u05ea\u05d6\u05db\u05d5\u05e8\u05ea \u05d1\u05d9\u05d8\u05d5\u05d7 - ' + vehicleName,
                message: '\u05d4\u05d1\u05d9\u05d8\u05d5\u05d7 \u05e9\u05dc \u05e8\u05db\u05d1 ' + vehicle.licensePlate + ' \u05e4\u05d2 ' + timeText + '. \u05d7\u05d3\u05e9 \u05d0\u05ea \u05d4\u05e4\u05d5\u05dc\u05d9\u05e1\u05d4 \u05d1\u05d4\u05e7\u05d3\u05dd.',
                link: '/user/vehicles/' + vehicle.id,
              });
              stats.insuranceReminders++;
            } catch (e) {
              stats.errors++;
            }
          } else {
            stats.alreadySent++;
          }
        }
      }

      // --- Update vehicle status fields ---
      const updates: Record<string, string> = {};
      
      if (vehicle.testExpiryDate) {
        const daysTest = Math.ceil(
          (vehicle.testExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const newStatus = daysTest <= 0 ? 'expired' : daysTest <= 30 ? 'expiring' : 'valid';
        if (newStatus !== vehicle.testStatus) updates.testStatus = newStatus;
      }

      if (vehicle.insuranceExpiry) {
        const daysIns = Math.ceil(
          (vehicle.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const newStatus = daysIns <= 0 ? 'expired' : daysIns <= 30 ? 'expiring' : 'valid';
        if (newStatus !== vehicle.insuranceStatus) updates.insuranceStatus = newStatus;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.vehicle.update({ where: { id: vehicle.id }, data: updates });
      }
    }

    // --- Also check already-expired vehicles ---
    const expiredVehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { testExpiryDate: { lt: now }, testStatus: { not: 'expired' } },
          { insuranceExpiry: { lt: now }, insuranceStatus: { not: 'expired' } },
        ],
      },
    });

    for (const v of expiredVehicles) {
      const updates: Record<string, string> = {};
      if (v.testExpiryDate && v.testExpiryDate < now && v.testStatus !== 'expired') {
        updates.testStatus = 'expired';
      }
      if (v.insuranceExpiry && v.insuranceExpiry < now && v.insuranceStatus !== 'expired') {
        updates.insuranceStatus = 'expired';
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
        expiredStatusUpdated: expiredVehicles.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
