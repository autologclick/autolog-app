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

/**
 * PUT /api/vehicles/[id]/insurance — Update insurance details
 * Query param: ?type=compulsory | comprehensive (default: comprehensive)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const insuranceCategory = req.nextUrl.searchParams.get('type') || 'comprehensive';

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    const updateData: Record<string, unknown> = {};

    if (insuranceCategory === 'compulsory') {
      // ביטוח חובה
      const {
        insuranceCompany,
        insuranceStart,
        insuranceExpiry,
        insuranceCost,
        insurancePolicyNumber,
        insuranceDocUrl,
      } = body;

      if (insuranceCompany !== undefined) {
        updateData.compulsoryInsuranceCompany = insuranceCompany || null;
      }
      if (insuranceStart !== undefined && insuranceStart) {
        const d = new Date(insuranceStart);
        if (!isNaN(d.getTime())) updateData.compulsoryInsuranceStart = d;
      }
      if (insuranceExpiry !== undefined && insuranceExpiry) {
        const d = new Date(insuranceExpiry);
        if (!isNaN(d.getTime())) {
          updateData.compulsoryInsuranceExpiry = d;
          updateData.compulsoryInsuranceStatus = getExpiryStatus(d);
        }
      }
      if (insuranceCost !== undefined) {
        const cost = typeof insuranceCost === 'string' ? parseFloat(insuranceCost) : insuranceCost;
        if (cost !== null && !isNaN(cost) && cost >= 0) updateData.compulsoryInsuranceCost = cost;
      }
      if (insurancePolicyNumber !== undefined) {
        updateData.compulsoryInsurancePolicyNumber = insurancePolicyNumber || null;
      }
      if (insuranceDocUrl !== undefined) {
        updateData.compulsoryInsuranceDocUrl = insuranceDocUrl || null;
      }
    } else {
      // מקיף / צד ג'
      const {
        insuranceCompany,
        insuranceType,
        insuranceStart,
        insuranceExpiry,
        insuranceCost,
        insurancePolicyNumber,
        insuranceDocUrl,
      } = body;

      if (insuranceCompany !== undefined) {
        updateData.insuranceCompany = insuranceCompany || null;
      }
      if (insuranceType !== undefined) {
        updateData.insuranceType = insuranceType || null;
      }
      if (insuranceStart !== undefined && insuranceStart) {
        const d = new Date(insuranceStart);
        if (!isNaN(d.getTime())) updateData.insuranceStart = d;
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
        if (cost !== null && !isNaN(cost) && cost >= 0) updateData.insuranceCost = cost;
      }
      if (insurancePolicyNumber !== undefined) {
        updateData.insurancePolicyNumber = insurancePolicyNumber || null;
      }
      if (insuranceDocUrl !== undefined) {
        updateData.insuranceDocUrl = insuranceDocUrl || null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('לא סופקו נתונים לעדכון', 400);
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        // Comprehensive / third-party
        insuranceCompany: true,
        insuranceType: true,
        insuranceStart: true,
        insuranceExpiry: true,
        insuranceCost: true,
        insurancePolicyNumber: true,
        insuranceDocUrl: true,
        insuranceStatus: true,
        // Compulsory
        compulsoryInsuranceCompany: true,
        compulsoryInsuranceExpiry: true,
        compulsoryInsuranceStart: true,
        compulsoryInsuranceCost: true,
        compulsoryInsurancePolicyNumber: true,
        compulsoryInsuranceDocUrl: true,
        compulsoryInsuranceStatus: true,
      },
    });

    return jsonResponse({
      message: insuranceCategory === 'compulsory'
        ? 'פרטי ביטוח חובה עודכנו בהצלחה'
        : 'פרטי הביטוח עודכנו בהצלחה',
      insurance: updated,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/vehicles/[id]/insurance — Get all insurance details (both types)
 */
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
        // Comprehensive / third-party
        insuranceCompany: true,
        insuranceType: true,
        insuranceStart: true,
        insuranceExpiry: true,
        insuranceCost: true,
        insurancePolicyNumber: true,
        insuranceDocUrl: true,
        insuranceStatus: true,
        // Compulsory
        compulsoryInsuranceCompany: true,
        compulsoryInsuranceExpiry: true,
        compulsoryInsuranceStart: true,
        compulsoryInsuranceCost: true,
        compulsoryInsurancePolicyNumber: true,
        compulsoryInsuranceDocUrl: true,
        compulsoryInsuranceStatus: true,
      },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    return jsonResponse({
      comprehensive: {
        insuranceCompany: vehicle.insuranceCompany,
        insuranceType: vehicle.insuranceType,
        insuranceStart: vehicle.insuranceStart,
        insuranceExpiry: vehicle.insuranceExpiry,
        insuranceCost: vehicle.insuranceCost,
        insurancePolicyNumber: vehicle.insurancePolicyNumber,
        insuranceDocUrl: vehicle.insuranceDocUrl,
        insuranceStatus: vehicle.insuranceStatus,
      },
      compulsory: {
        insuranceCompany: vehicle.compulsoryInsuranceCompany,
        insuranceStart: vehicle.compulsoryInsuranceStart,
        insuranceExpiry: vehicle.compulsoryInsuranceExpiry,
        insuranceCost: vehicle.compulsoryInsuranceCost,
        insurancePolicyNumber: vehicle.compulsoryInsurancePolicyNumber,
        insuranceDocUrl: vehicle.compulsoryInsuranceDocUrl,
        insuranceStatus: vehicle.compulsoryInsuranceStatus,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}
