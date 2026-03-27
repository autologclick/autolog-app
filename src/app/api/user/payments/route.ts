import { NextRequest } from 'next/server';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { aggregateUserPayments } from '@/lib/services/payment-service';

// GET /api/user/payments - Aggregate payment data from inspections, appointments, and expenses
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    const summary = await aggregateUserPayments(payload.userId);
    return jsonResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
