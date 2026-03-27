import { NextRequest } from 'next/server';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { aggregateUserPayments } from '@/lib/services/payment-service';

// GET /api/user/payments - Aggregate payment data from inspections, appointments, and expenses
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const summary = await aggregateUserPayments(payload.userId);
    return jsonResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
