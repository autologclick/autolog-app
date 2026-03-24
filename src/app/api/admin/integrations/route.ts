/**
 * Admin Integration Status Endpoint
 * GET /api/admin/integrations
 * Returns the status of all configured integrations
 * Admin only access
 */

import { NextRequest } from 'next/server';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { createRequestLogger } from '@/lib/logger';
import {
  getIntegrationStatus,
  getIntegrationsHealthCheck,
} from '@/lib/integrations';

export async function GET(req: NextRequest) {
  const logger = createRequestLogger('api', req);

  try {
    // Require admin authentication
    const payload = requireAdmin(req);
    logger.setUserId(payload.userId);

    logger.info('Fetching integration status');

    // Get detailed status of all integrations
    const integrationStatus = getIntegrationStatus();

    // Get health summary
    const healthCheck = getIntegrationsHealthCheck();

    // Build detailed response with missing env vars hints
    const response = {
      status: 'success',
      health: healthCheck,
      integrations: {
        whatsapp: {
          ...integrationStatus.whatsapp,
          setupGuide: !integrationStatus.whatsapp.configured
            ? 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM'
            : undefined,
        },
        pushNotifications: {
          ...integrationStatus.pushNotifications,
          publicKey: integrationStatus.pushNotifications.configured
            ? process.env.VAPID_PUBLIC_KEY?.substring(0, 20) + '...'
            : undefined,
          setupGuide: !integrationStatus.pushNotifications.configured
            ? 'Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT'
            : undefined,
        },
        maps: {
          ...integrationStatus.maps,
          setupGuide: !integrationStatus.maps.configured
            ? 'Set MAPS_API_KEY and optionally MAPS_PROVIDER (google or mapbox)'
            : undefined,
        },
        payments: {
          ...integrationStatus.payments,
          stripeDashboard: 'https://dashboard.stripe.com',
          setupGuide: !integrationStatus.payments.configured
            ? 'Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID'
            : undefined,
        },
      },
      timestamp: new Date().toISOString(),
    };

    logger.info('Integration status retrieved successfully', {
      configured: healthCheck.totalConfigured,
      totalFeatures: healthCheck.totalFeatures,
    });

    return jsonResponse(response);
  } catch (error) {
    logger.error('Failed to fetch integration status', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error);
  }
}
