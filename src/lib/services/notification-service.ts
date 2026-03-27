/**
 * Notification Service - Centralized notification creation helpers.
 * Consolidates notification creation logic used across appointment,
 * SOS, and other routes into a single service layer.
 */

import prisma from '@/lib/db';

// =============================================
// Types
// =============================================

export type NotificationType =
  | 'appointment'
  | 'sos'
  | 'test_expiry'
  | 'insurance_expiry'
  | 'system'
  | 'inspection';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// =============================================
// Core helpers
// =============================================

/**
 * Create a single notification for a user.
 */
export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
    },
  });
}

/**
 * Notify all admin users at once.
 */
export async function notifyAdmins(
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  const admins = await prisma.user.findMany({ where: { role: 'admin' } });
  if (admins.length === 0) return;

  return prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type,
      title,
      message,
      link: link || null,
    })),
  });
}

// =============================================
// Appointment-specific helpers
// =============================================

/**
 * Notify a customer that their appointment was confirmed.
 */
export function notifyAppointmentConfirmed(
  userId: string,
  garageName: string,
  dateStr: string,
  time: string,
) {
  return createNotification({
    userId,
    type: 'appointment',
    title: 'התור אושר!',
    message: `התור שלך ב${garageName} אושר. נתראה בתאריך ${dateStr} בשעה ${time}.`,
    link: '/user/appointments',
  });
}

/**
 * Notify a customer that their appointment was cancelled.
 */
export function notifyAppointmentCancelled(userId: string, garageName: string) {
  return createNotification({
    userId,
    type: 'appointment',
    title: 'התור בוטל',
    message: `התור שלך ב${garageName} בוטל. אנא צור קשר עם המוסך לפרטים נוספים.`,
    link: '/user/appointments',
  });
}

/**
 * Notify a customer that their vehicle is now being serviced.
 */
export function notifyAppointmentInProgress(userId: string, garageName: string) {
  return createNotification({
    userId,
    type: 'appointment',
    title: 'הרכב נכנס לטיפול',
    message: `הרכב שלך נכנס לטיפול ב${garageName}.`,
    link: '/user/appointments',
  });
}

/**
 * Notify a customer that their appointment / service is completed.
 */
export function notifyAppointmentCompleted(
  userId: string,
  garageName: string,
  serviceLabel: string,
  vehicleLabel: string,
  licensePlate: string,
  completionNotes?: string,
) {
  const message = completionNotes
    ? `${serviceLabel} ברכב ${vehicleLabel} (${licensePlate}) הושלם ב${garageName}. סיכום: ${completionNotes}`
    : `${serviceLabel} ברכב ${vehicleLabel} (${licensePlate}) הושלם בהצלחה ב${garageName}.`;

  return createNotification({
    userId,
    type: 'appointment',
    title: 'הטיפול הושלם בהצלחה!',
    message,
    link: '/user/appointments',
  });
}

/**
 * Notify a garage owner about a new appointment.
 */
export function notifyNewAppointment(
  garageOwnerId: string,
  customerName: string,
  serviceLabel: string,
  vehicleLabel: string,
  dateLabel: string,
  timeLabel: string,
) {
  return createNotification({
    userId: garageOwnerId,
    type: 'appointment',
    title: `תור חדש — ${customerName}`,
    message: `${customerName} קבע תור ל${serviceLabel} עבור ${vehicleLabel} בתאריך ${dateLabel} בשעה ${timeLabel}`,
    link: '/garage/appointments',
  });
}
