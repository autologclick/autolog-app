/**
 * Payment Processing Integration via Stripe
 * Handles payment intents, subscriptions, and webhooks
 * Gracefully disabled when env vars are missing
 */

import { createLogger } from '@/lib/logger';
import crypto from 'crypto';

const logger = createLogger('business');

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  intentId?: string;
  reason?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  reason?: string;
}

export interface WebhookVerification {
  valid: boolean;
  error?: string;
}

/**
 * Check if Stripe payment integration is configured
 */
export function isPaymentsConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/**
 * Create a payment intent for a one-time charge
 * @param amount - Amount in cents (e.g., 5000 for 50.00 ILS)
 * @param currency - Currency code (default: ILS)
 * @param metadata - Additional metadata to attach to the intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'ILS',
  metadata?: Record<string, string>
): Promise<PaymentIntentResult> {
  if (!isPaymentsConfigured()) {
    logger.warn('Stripe not configured, cannot create payment intent');
    return { success: false, reason: 'not_configured' };
  }

  // Validate amount
  if (amount < 50) {
    logger.error('Payment amount too low', { amount });
    return { success: false, reason: 'amount_too_low' };
  }

  try {
    // Dynamically load Stripe SDK only if available
    let Stripe: any;
    try {
      Stripe = require('stripe');
    } catch {
      logger.warn('Stripe package not installed, cannot create payment intent');
      return { success: false, reason: 'stripe_not_installed' };
    }

    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: metadata || {},
      // Set automatic payment methods to support multiple payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info('Payment intent created', {
      intentId: paymentIntent.id,
      amount,
      currency,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
    };
  } catch (error) {
    logger.error('Failed to create payment intent', {
      amount,
      currency,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, reason: 'intent_creation_failed' };
  }
}

/**
 * Create a subscription for a user
 * @param userId - User ID (for reference)
 * @param planId - Stripe price ID for the plan
 * @param customerId - Optional Stripe customer ID
 */
export async function createSubscription(
  userId: string,
  planId: string,
  customerId?: string
): Promise<SubscriptionResult> {
  if (!isPaymentsConfigured()) {
    logger.warn('Stripe not configured, cannot create subscription');
    return { success: false, reason: 'not_configured' };
  }

  if (!planId || planId.trim().length === 0) {
    logger.error('Invalid plan ID provided');
    return { success: false, reason: 'invalid_plan_id' };
  }

  try {
    // Dynamically load Stripe SDK only if available
    let Stripe: any;
    try {
      Stripe = require('stripe');
    } catch {
      logger.warn('Stripe package not installed, cannot create subscription');
      return { success: false, reason: 'stripe_not_installed' };
    }

    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

    // If no customer ID provided, would need to create or retrieve one
    // For now, we'll return an error requiring a customer ID
    if (!customerId) {
      logger.error('Customer ID required for subscription creation', { userId });
      return { success: false, reason: 'no_customer_id' };
    }

    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: planId }],
      metadata: { userId },
    });

    logger.info('Subscription created', {
      subscriptionId: subscription.id,
      userId,
      planId,
    });

    return {
      success: true,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    logger.error('Failed to create subscription', {
      userId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, reason: 'subscription_creation_failed' };
  }
}

/**
 * Verify and handle webhook signatures from Stripe
 * This ensures the webhook payload is legitimate and hasn't been tampered with
 * @param payload - Raw request body (must be string, not parsed JSON)
 * @param signature - Stripe signature header (Stripe-Signature)
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): WebhookVerification {
  if (!isPaymentsConfigured()) {
    return { valid: false, error: 'Stripe not configured' };
  }

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return { valid: false, error: 'Webhook secret not configured' };
    }

    // Convert payload to string if it's a Buffer
    const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf-8');

    // Stripe signature format: t=timestamp,v1=hash,...
    const parts = signature.split(',').reduce((acc: Record<string, string>, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});

    const timestamp = parts.t;
    const signedContent = `${timestamp}.${payloadStr}`;

    // Compute HMAC SHA256
    const hash = crypto
      .createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex');

    // Compare with provided signature (constant-time comparison for security)
    const computedSignature = `v1=${hash}`;
    const providedSignature = `v1=${parts.v1}`;

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(providedSignature)
    );

    // Also check timestamp freshness (within 5 minutes)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const webhookTimestamp = parseInt(timestamp, 10);
    const timeDiff = Math.abs(currentTimestamp - webhookTimestamp);

    if (timeDiff > 300) {
      logger.warn('Webhook signature valid but timestamp is stale', {
        timeDiff,
        maxAllowed: 300,
      });
      return { valid: false, error: 'Webhook timestamp too old' };
    }

    if (!isValid) {
      logger.warn('Invalid webhook signature');
      return { valid: false, error: 'Invalid webhook signature' };
    }

    logger.debug('Webhook signature verified successfully');
    return { valid: true };
  } catch (error) {
    logger.error('Failed to verify webhook signature', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Parse and process a Stripe webhook event
 * @param payload - Parsed webhook payload
 */
export function parseWebhookEvent(payload: Record<string, any>): {
  type: string;
  data: any;
} | null {
  try {
    if (!payload.type || !payload.data) {
      logger.error('Invalid webhook payload structure');
      return null;
    }

    logger.debug('Webhook event received', {
      type: payload.type,
      eventId: payload.id,
    });

    return {
      type: payload.type,
      data: payload.data.object,
    };
  } catch (error) {
    logger.error('Failed to parse webhook event', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Handle common Stripe webhook event types
 */
export function handleWebhookEvent(
  eventType: string,
  eventData: any
): { handled: boolean; action?: string } {
  switch (eventType) {
    case 'payment_intent.succeeded':
      logger.info('Payment succeeded', {
        intentId: eventData.id,
        amount: eventData.amount,
        currency: eventData.currency,
      });
      return { handled: true, action: 'payment_succeeded' };

    case 'payment_intent.payment_failed':
      logger.warn('Payment failed', {
        intentId: eventData.id,
        reason: eventData.last_payment_error?.message,
      });
      return { handled: true, action: 'payment_failed' };

    case 'charge.refunded':
      logger.info('Charge refunded', {
        chargeId: eventData.id,
        amount: eventData.amount_refunded,
      });
      return { handled: true, action: 'charge_refunded' };

    case 'customer.subscription.updated':
      logger.info('Subscription updated', {
        subscriptionId: eventData.id,
        status: eventData.status,
      });
      return { handled: true, action: 'subscription_updated' };

    case 'customer.subscription.deleted':
      logger.info('Subscription cancelled', {
        subscriptionId: eventData.id,
      });
      return { handled: true, action: 'subscription_cancelled' };

    default:
      logger.debug('Unhandled webhook event type', { eventType });
      return { handled: false };
  }
}
