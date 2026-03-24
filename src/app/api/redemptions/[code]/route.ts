import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { getRedemptionByCode, markRedemptionUsed } from '@/lib/redemptions-db';

// GET /api/redemptions/[code] - Verify a redemption code (public - for partners to scan)
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();

    const redemption = await getRedemptionByCode(code);

    if (!redemption) {
      return errorResponse('Code not found', 404);
    }

    // Return redemption details (without sensitive info)
    return jsonResponse({
      code: redemption.code,
      benefitName: redemption.benefitName,
      partnerName: redemption.partnerName,
      discount: redemption.discount,
      status: redemption.status,
      expiresAt: redemption.expiresAt,
      usedAt: redemption.usedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/redemptions/[code] - Mark redemption as used
export async function PUT(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();

    const redemption = await getRedemptionByCode(code);

    if (!redemption) {
      return errorResponse('Code not found', 404);
    }

    // Check if already used or expired
    if (redemption.status === 'used') {
      return errorResponse('This code has already been used', 400);
    }

    if (redemption.status === 'expired') {
      return errorResponse('This code has expired', 400);
    }

    // Check expiry date
    if (redemption.expiresAt) {
      const expiryDate = new Date(redemption.expiresAt);
      if (expiryDate < new Date()) {
        return errorResponse('This code has expired', 400);
      }
    }

    const success = await markRedemptionUsed(code);

    if (!success) {
      return errorResponse('Failed to mark redemption as used', 400);
    }

    return jsonResponse({
      message: 'Redemption marked as used',
      code: redemption.code,
      status: 'used',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
