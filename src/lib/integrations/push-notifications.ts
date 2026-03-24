/**
 * Web Push Notifications Integration
 * Uses Web Push API (VAPID) for browser-based notifications
 * Gracefully disabled when env vars are missing
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('business');

// Hebrew message templates for push notifications
const NOTIFICATION_TEMPLATES = {
  test_expiry_reminder: {
    title: 'תזכורת בדיקה',
    getBody: (vehicleName: string, daysUntil: number) =>
      `בדיקת ה-${vehicleName} תפוג בעוד ${daysUntil} ימים. בואו לתור כעת!`,
  },
  appointment_reminder: {
    title: 'תזכורת תור',
    getBody: (garageName: string, date: string) =>
      `תור שלך ב-${garageName} ב-${date}. אנא הגיעו בזמן!`,
  },
  insurance_expiry: {
    title: 'ביטוח רכב פוג בעקרוב',
    getBody: (vehicleName: string, daysUntil: number) =>
      `הביטוח של ${vehicleName} פוג בעוד ${daysUntil} ימים. רנו את הביטוח כעת.`,
  },
  sos_notification: {
    title: 'התראת חירום',
    getBody: (vehicleName: string, location: string) =>
      `התראת חירום ל-${vehicleName} ב-${location}. בדוקו כעת!`,
  },
};

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SendNotificationResponse {
  sent: boolean;
  reason?: string;
}

/**
 * Check if Web Push is configured
 */
export function isPushNotificationsConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/**
 * Get VAPID public key for client subscription
 */
export function getVAPIDPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Send a push notification to a user
 * @param userId - User ID (for logging)
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Additional data to include in notification
 * @param subscription - PushSubscription object
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  subscription?: PushSubscription
): Promise<SendNotificationResponse> {
  // Check if push notifications are configured
  if (!isPushNotificationsConfigured()) {
    logger.warn('Push notifications not configured, skipping', { userId });
    return { sent: false, reason: 'not_configured' };
  }

  if (!subscription) {
    logger.debug('No subscription provided, skipping push notification', { userId });
    return { sent: false, reason: 'no_subscription' };
  }

  try {
    // Dynamically load web-push only if available
    let webPush: any;
    try {
      webPush = require('web-push');
    } catch {
      logger.warn('web-push package not installed, cannot send push notification');
      return { sent: false, reason: 'web_push_not_installed' };
    }

    // Configure VAPID
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'https://autolog.local',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Build notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo.png',
      badge: '/badge.png',
      ...(data && { data }),
    });

    // Send push notification
    await webPush.sendNotification(subscription, payload);

    logger.info('Push notification sent', {
      userId,
      title,
    });

    return { sent: true };
  } catch (error) {
    logger.error('Failed to send push notification', {
      userId,
      title,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: false, reason: 'send_failed' };
  }
}

/**
 * Subscribe a user to push notifications
 * Stores the subscription in memory or database
 * @param userId - User ID
 * @param subscription - PushSubscription object from browser
 */
export async function subscribeUser(
  userId: string,
  subscription: PushSubscription
): Promise<{ success: boolean; reason?: string }> {
  if (!isPushNotificationsConfigured()) {
    logger.warn('Push notifications not configured, cannot subscribe user', { userId });
    return { success: false, reason: 'not_configured' };
  }

  try {
    // In a real implementation, store this in the database
    // For now, we just validate it
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      logger.error('Invalid push subscription object', { userId });
      return { success: false, reason: 'invalid_subscription' };
    }

    logger.info('User subscribed to push notifications', {
      userId,
      endpoint: subscription.endpoint,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to subscribe user to push notifications', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, reason: 'subscription_failed' };
  }
}

/**
 * Send a test expiry reminder
 * @param userId - User ID
 * @param vehicleName - Name of the vehicle
 * @param daysUntilExpiry - Number of days until expiry
 * @param subscription - Optional PushSubscription
 */
export async function sendTestExpiryReminder(
  userId: string,
  vehicleName: string,
  daysUntilExpiry: number,
  subscription?: PushSubscription
): Promise<SendNotificationResponse> {
  const template = NOTIFICATION_TEMPLATES.test_expiry_reminder;
  return sendPushNotification(
    userId,
    template.title,
    template.getBody(vehicleName, daysUntilExpiry),
    { type: 'test_expiry', vehicleName, daysUntilExpiry: String(daysUntilExpiry) },
    subscription
  );
}

/**
 * Send an appointment reminder
 * @param userId - User ID
 * @param garageName - Name of the garage
 * @param date - Appointment date
 * @param subscription - Optional PushSubscription
 */
export async function sendAppointmentReminder(
  userId: string,
  garageName: string,
  date: string,
  subscription?: PushSubscription
): Promise<SendNotificationResponse> {
  const template = NOTIFICATION_TEMPLATES.appointment_reminder;
  return sendPushNotification(
    userId,
    template.title,
    template.getBody(garageName, date),
    { type: 'appointment_reminder', garageName, date },
    subscription
  );
}

/**
 * Send an insurance expiry reminder
 * @param userId - User ID
 * @param vehicleName - Name of the vehicle
 * @param daysUntilExpiry - Number of days until expiry
 * @param subscription - Optional PushSubscription
 */
export async function sendInsuranceExpiryReminder(
  userId: string,
  vehicleName: string,
  daysUntilExpiry: number,
  subscription?: PushSubscription
): Promise<SendNotificationResponse> {
  const template = NOTIFICATION_TEMPLATES.insurance_expiry;
  return sendPushNotification(
    userId,
    template.title,
    template.getBody(vehicleName, daysUntilExpiry),
    { type: 'insurance_expiry', vehicleName, daysUntilExpiry: String(daysUntilExpiry) },
    subscription
  );
}

/**
 * Send an SOS notification
 * @param userId - User ID
 * @param vehicleName - Name of the vehicle
 * @param location - Location of the SOS event
 * @param subscription - Optional PushSubscription
 */
export async function sendSOSNotification(
  userId: string,
  vehicleName: string,
  location: string,
  subscription?: PushSubscription
): Promise<SendNotificationResponse> {
  const template = NOTIFICATION_TEMPLATES.sos_notification;
  return sendPushNotification(
    userId,
    template.title,
    template.getBody(vehicleName, location),
    { type: 'sos', vehicleName, location },
    subscription
  );
}
