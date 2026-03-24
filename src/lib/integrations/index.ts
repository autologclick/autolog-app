/**
 * Integration Hub
 * Central export point for all third-party integrations
 * Each integration is gracefully disabled when env vars are missing
 */

import * as whatsapp from './whatsapp';
import * as pushNotifications from './push-notifications';
import * as maps from './maps';
import * as payments from './payments';
import * as notificationService from './notification-service';

export { whatsapp, pushNotifications, maps, payments, notificationService };

export type { PushSubscription } from './push-notifications';
export type { Coordinates, GarageLocation, DirectionRoute } from './maps';
export type { PaymentIntentResult, SubscriptionResult } from './payments';
export type { NotificationType, NotificationPayload } from './notification-service';

/**
 * Integration status report
 */
export interface IntegrationStatus {
  whatsapp: {
    configured: boolean;
    features: string[];
  };
  pushNotifications: {
    configured: boolean;
    features: string[];
  };
  maps: {
    configured: boolean;
    provider?: string;
    features: string[];
  };
  payments: {
    configured: boolean;
    features: string[];
  };
}

/**
 * Get status of all integrations
 * Returns which integrations are available and configured
 */
export function getIntegrationStatus(): IntegrationStatus {
  return {
    whatsapp: {
      configured: whatsapp.isWhatsAppConfigured(),
      features: whatsapp.isWhatsAppConfigured()
        ? [
          'sendTestReminder',
          'sendAppointmentConfirmation',
          'sendSOSAlert',
          'sendWhatsAppMessage',
        ]
        : [],
    },
    pushNotifications: {
      configured: pushNotifications.isPushNotificationsConfigured(),
      features: pushNotifications.isPushNotificationsConfigured()
        ? [
          'sendPushNotification',
          'subscribeUser',
          'sendTestExpiryReminder',
          'sendAppointmentReminder',
          'sendInsuranceExpiryReminder',
          'sendSOSNotification',
        ]
        : [],
    },
    maps: {
      configured: maps.isMapsConfigured(),
      provider: maps.isMapsConfigured() ? maps.getMapsProvider() : undefined,
      features: maps.isMapsConfigured()
        ? [
          'searchNearbyGarages',
          'getDirections',
          'geocodeAddress',
          'calculateDistance',
        ]
        : [],
    },
    payments: {
      configured: payments.isPaymentsConfigured(),
      features: payments.isPaymentsConfigured()
        ? [
          'createPaymentIntent',
          'createSubscription',
          'verifyWebhookSignature',
          'parseWebhookEvent',
          'handleWebhookEvent',
        ]
        : [],
    },
  };
}

/**
 * Health check for all integrations
 * Returns a summary of available services
 */
export function getIntegrationsHealthCheck(): {
  totalConfigured: number;
  totalFeatures: number;
  integrations: string[];
} {
  const status = getIntegrationStatus();

  const configured = [
    status.whatsapp.configured && 'whatsapp',
    status.pushNotifications.configured && 'pushNotifications',
    status.maps.configured && 'maps',
    status.payments.configured && 'payments',
  ].filter(Boolean) as string[];

  const totalFeatures =
    status.whatsapp.features.length +
    status.pushNotifications.features.length +
    status.maps.features.length +
    status.payments.features.length;

  return {
    totalConfigured: configured.length,
    totalFeatures,
    integrations: configured,
  };
}
