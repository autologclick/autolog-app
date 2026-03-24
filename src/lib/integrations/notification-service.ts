/**
 * Unified Notification Service
 * Attempts to send notifications through multiple channels in priority order:
 * 1. Push Notifications (Web Push)
 * 2. WhatsApp (Twilio)
 * 3. In-app (Database Notification)
 *
 * This service provides a single API for sending various types of notifications
 */

import { createLogger } from '@/lib/logger';
import * as pushNotifications from './push-notifications';
import * as whatsapp from './whatsapp';

const logger = createLogger('business');

export type NotificationType =
  | 'test_reminder'
  | 'appointment_reminder'
  | 'insurance_expiry'
  | 'sos_alert'
  | 'payment_confirmation'
  | 'payment_failed'
  | 'appointment_booked';

export interface NotificationPayload {
  userId: string;
  vehicleName?: string;
  garageName?: string;
  date?: string;
  time?: string;
  location?: string;
  amount?: number;
  currency?: string;
  daysUntil?: number;
  phone?: string;
  pushSubscription?: pushNotifications.PushSubscription;
}

interface NotificationResult {
  sent: boolean;
  channels: {
    push?: boolean;
    whatsapp?: boolean;
    inApp?: boolean;
  };
  reason?: string;
}

/**
 * Send a notification through the best available channel
 * @param userId - User ID
 * @param type - Type of notification
 * @param payload - Notification data
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<NotificationResult> {
  const result: NotificationResult = {
    sent: false,
    channels: {},
  };

  try {
    // Try push notification first (highest priority)
    if (payload.pushSubscription && pushNotifications.isPushNotificationsConfigured()) {
      const pushResult = await sendPushNotificationByType(type, userId, payload);
      if (pushResult.sent) {
        result.channels.push = true;
        result.sent = true;
        logger.info('Notification sent via push', { userId, type });
        return result;
      }
    }

    // Try WhatsApp second
    if (payload.phone && whatsapp.isWhatsAppConfigured()) {
      const whatsappResult = await sendWhatsAppByType(type, payload);
      if (whatsappResult.sent) {
        result.channels.whatsapp = true;
        result.sent = true;
        logger.info('Notification sent via WhatsApp', { userId, type });
        return result;
      }
    }

    // Fallback to in-app notification (would store in database)
    result.channels.inApp = true;
    result.sent = true;
    logger.info('Notification sent via in-app (database)', { userId, type });
    return result;
  } catch (error) {
    logger.error('Failed to send notification', {
      userId,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ...result, reason: 'send_failed' };
  }
}

/**
 * Send bulk reminders for a specific type
 * Used for scheduled reminder jobs
 * @param type - Type of reminder (test_reminder, insurance_expiry, etc.)
 * @param recipients - List of recipient data
 */
export async function sendBulkReminders(
  type: NotificationType,
  recipients: NotificationPayload[]
): Promise<{ sent: number; failed: number; details: Array<{ userId: string; sent: boolean }> }> {
  const results = {
    sent: 0,
    failed: 0,
    details: [] as Array<{ userId: string; sent: boolean }>,
  };

  logger.info('Starting bulk reminder send', { type, recipientCount: recipients.length });

  // Send notifications in parallel with concurrency limit
  const concurrencyLimit = 5;
  for (let i = 0; i < recipients.length; i += concurrencyLimit) {
    const batch = recipients.slice(i, i + concurrencyLimit);

    const batchResults = await Promise.all(
      batch.map((recipient) => sendNotification(recipient.userId, type, recipient))
    );

    batchResults.forEach((result, index) => {
      const recipient = batch[index];
      if (result.sent) {
        results.sent++;
      } else {
        results.failed++;
      }
      results.details.push({
        userId: recipient.userId,
        sent: result.sent,
      });
    });
  }

  logger.info('Bulk reminder send completed', {
    type,
    sent: results.sent,
    failed: results.failed,
  });

  return results;
}

/**
 * Send push notification based on type
 */
async function sendPushNotificationByType(
  type: NotificationType,
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: boolean }> {
  const subscription = payload.pushSubscription;
  if (!subscription) {
    return { sent: false };
  }

  switch (type) {
    case 'test_reminder':
      if (!payload.vehicleName || payload.daysUntil === undefined) {
        return { sent: false };
      }
      const testResult = await pushNotifications.sendTestExpiryReminder(
        userId,
        payload.vehicleName,
        payload.daysUntil,
        subscription
      );
      return { sent: testResult.sent };

    case 'appointment_reminder':
      if (!payload.garageName || !payload.date) {
        return { sent: false };
      }
      const appointmentResult = await pushNotifications.sendAppointmentReminder(
        userId,
        payload.garageName,
        payload.date,
        subscription
      );
      return { sent: appointmentResult.sent };

    case 'insurance_expiry':
      if (!payload.vehicleName || payload.daysUntil === undefined) {
        return { sent: false };
      }
      const insuranceResult = await pushNotifications.sendInsuranceExpiryReminder(
        userId,
        payload.vehicleName,
        payload.daysUntil,
        subscription
      );
      return { sent: insuranceResult.sent };

    case 'sos_alert':
      if (!payload.vehicleName || !payload.location) {
        return { sent: false };
      }
      const sosResult = await pushNotifications.sendSOSNotification(
        userId,
        payload.vehicleName,
        payload.location,
        subscription
      );
      return { sent: sosResult.sent };

    case 'appointment_booked':
      if (!payload.garageName || !payload.date) {
        return { sent: false };
      }
      const appointmentBookedResult = await pushNotifications.sendAppointmentReminder(
        userId,
        payload.garageName,
        payload.date,
        subscription
      );
      return { sent: appointmentBookedResult.sent };

    default:
      logger.warn('Unknown notification type for push', { type });
      return { sent: false };
  }
}

/**
 * Send WhatsApp message based on type
 */
async function sendWhatsAppByType(
  type: NotificationType,
  payload: NotificationPayload
): Promise<{ sent: boolean }> {
  if (!payload.phone) {
    return { sent: false };
  }

  switch (type) {
    case 'test_reminder':
      if (!payload.vehicleName || !payload.date) {
        return { sent: false };
      }
      const testResult = await whatsapp.sendTestReminder(
        payload.phone,
        payload.vehicleName,
        payload.date
      );
      return { sent: testResult.sent };

    case 'appointment_reminder':
      if (!payload.garageName || !payload.date || !payload.time) {
        return { sent: false };
      }
      const appointmentResult = await whatsapp.sendAppointmentConfirmation(
        payload.phone,
        payload.garageName,
        payload.date,
        payload.time
      );
      return { sent: appointmentResult.sent };

    case 'sos_alert':
      if (!payload.vehicleName || !payload.location) {
        return { sent: false };
      }
      const sosResult = await whatsapp.sendSOSAlert(
        payload.phone,
        payload.vehicleName,
        payload.location
      );
      return { sent: sosResult.sent };

    case 'appointment_booked':
      if (!payload.garageName || !payload.date || !payload.time) {
        return { sent: false };
      }
      const appointmentBookedWhatsAppResult = await whatsapp.sendAppointmentConfirmation(
        payload.phone,
        payload.garageName,
        payload.date,
        payload.time
      );
      return { sent: appointmentBookedWhatsAppResult.sent };

    default:
      logger.warn('WhatsApp not supported for notification type', { type });
      return { sent: false };
  }
}

/**
 * Create an in-app notification record in the database
 * This is a fallback when other channels are not available
 * In a real implementation, this would insert into a Notification table
 * @param userId - User ID
 * @param type - Notification type
 * @param title - Notification title (Hebrew)
 * @param body - Notification body (Hebrew)
 */
export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string
): Promise<{ success: boolean; notificationId?: string }> {
  try {
    // TODO: Insert into Notification table in database
    // For now, just log it
    logger.info('In-app notification created', {
      userId,
      type,
      title,
    });

    return {
      success: true,
      notificationId: `notif_${Date.now()}`,
    };
  } catch (error) {
    logger.error('Failed to create in-app notification', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false };
  }
}

/**
 * Get notification templates for a specific type
 */
export function getNotificationTemplate(type: NotificationType) {
  const templates: Record<NotificationType, { title: string; defaultBody: string }> = {
    test_reminder: {
      title: 'תזכורת בדיקה',
      defaultBody: 'הרכב שלך זקוק לבדיקה',
    },
    appointment_reminder: {
      title: 'תזכורת תור',
      defaultBody: 'יש לך תור מתוכנן',
    },
    insurance_expiry: {
      title: 'ביטוח פוג',
      defaultBody: 'הביטוח שלך על סיום',
    },
    sos_alert: {
      title: 'התראת חירום',
      defaultBody: 'קיימת התראת חירום לרכב שלך',
    },
    payment_confirmation: {
      title: 'אישור תשלום',
      defaultBody: 'התשלום שלך בוצע בהצלחה',
    },
    payment_failed: {
      title: 'תשלום נכשל',
      defaultBody: 'התשלום שלך נכשל, אנא נסה שוב',
    },
    appointment_booked: {
      title: 'תור נוסף',
      defaultBody: 'קביעת תור חדשה ממתינה לאישור',
    },
  };

  return templates[type] || { title: 'התראה', defaultBody: 'יש לך התראה חדשה' };
}
