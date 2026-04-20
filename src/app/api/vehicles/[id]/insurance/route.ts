import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
  requireOwnership,
} from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';
import { getExpiryStatus } from '@/lib/utils';

// PUT /api/vehicles/[id]/insurance — Update insurance details (from AI scan or manual)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    const {
      insuranceCompany,
      insuranceType,
      insuranceStart,
      insuranceExpiry,
      insuranceCost,
      insurancePolicyNumber,
      insuranceDocUrl,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (insuranceCompany !== undefined) {
      updateData.insuranceCompany = insuranceCompany || null;
    }

    if (insuranceType !== undefined) {
      updateData.insuranceType = insuranceType || null;
    }

    if (insuranceStart !== undefined && insuranceStart) {
      const d = new Date(insuranceStart);
      if (!isNaN(d.getTime())) {
        updateData.insuranceStart = d;
      }
    }

    if (insuranceExpiry !== undefined && insuranceExpiry) {
      const d = new Date(insuranceExpiry);
      if (!isNaN(d.getTime())) {
        updateData.insuranceExpiry = d;
        updateData.insuranceStatus = getExpiryStatus(d);
      }
    }

    if (insuranceCost !== undefined) {
      const cost = typeof insuranceCost === 'string' ? parseFloat(insuranceCost) : insuranceCost;
      if (cost !== null && !isNaN(cost) && cost >= 0) {
        updateData.insuranceCost = cost;
      }
    }

    if (insurancePolicyNumber !== undefined) {
      updateData.insurancePolicyNumber = insurancePolicyNumber || null;
    }

    if (insuranceDocUrl !== undefined) {
      updateData.insuranceDocUrl = insuranceDocUrl || null;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('לא סופקו נתונים לעדכון', 400);
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        insuranceCompany: true,
        insuranceType: true,
        insuranceStart: true,
        insuranceExpiry: true,
        insuranceCost: true,
        insurancePolicyNumber: true,
        insuranceDocUrl: true,
        insuranceStatus: true,
      },
    });

    return jsonResponse({
      message: 'פרטי הביטוח עודכנו בהצלחה',
      insurance: updated,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/vehicles/[id]/insurance — Get insurance details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        userId: true,
        insuranceCompany: true,
        insuranceType: true,
        insuranceStart: true,
        insuranceExpiry: true,
        insuranceCost: true,
        insurancePolicyNumber: true,
        insuranceDocUrl: true,
        insuranceStatus: true,
      },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    return jsonResponse({ insurance: vehicle });

  } catch (error) {
    return handleApiError(error);
  }
}
