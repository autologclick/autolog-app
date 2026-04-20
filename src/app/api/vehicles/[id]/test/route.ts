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

const TEST_SELECT = {
  id: true,
  testExpiryDate: true,
  testStatus: true,
  testDate: true,
  testCost: true,
  testStation: true,
  testMileageAtTest: true,
  testDocUrl: true,
  previousOwners: true,
};

/**
 * GET /api/vehicles/[id]/test — Get test (טסט) details
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
      select: { userId: true, ...TEST_SELECT },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    return jsonResponse({
      testExpiryDate: vehicle.testExpiryDate,
      testStatus: vehicle.testStatus,
      testDate: vehicle.testDate,
      testCost: vehicle.testCost,
      testStation: vehicle.testStation,
      testMileageAtTest: vehicle.testMileageAtTest,
      testDocUrl: vehicle.testDocUrl,
      previousOwners: vehicle.previousOwners,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/vehicles/[id]/test — Update test (טסט) details
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    const updateData: Record<string, unknown> = {};

    const {
      testExpiryDate,
      testDate,
      testCost,
      testStation,
      testMileageAtTest,
      testDocUrl,
    } = body;

    if (testExpiryDate !== undefined && testExpiryDate) {
      const d = new Date(testExpiryDate);
      if (!isNaN(d.getTime())) {
        updateData.testExpiryDate = d;
        updateData.testStatus = getExpiryStatus(d);
      }
    }

    if (testDate !== undefined && testDate) {
      const d = new Date(testDate);
      if (!isNaN(d.getTime())) updateData.testDate = d;
    }

    if (testCost !== undefined) {
      const cost = typeof testCost === 'string' ? parseFloat(testCost) : testCost;
      if (cost !== null && !isNaN(cost) && cost >= 0) updateData.testCost = cost;
    }

    if (testStation !== undefined) {
      updateData.testStation = testStation || null;
    }

    if (testMileageAtTest !== undefined) {
      const km = typeof testMileageAtTest === 'string' ? parseInt(testMileageAtTest) : testMileageAtTest;
      if (km !== null && !isNaN(km) && km >= 0) updateData.testMileageAtTest = km;
    }

    if (testDocUrl !== undefined) {
      updateData.testDocUrl = testDocUrl || null;
    }

    if (body.previousOwners !== undefined) {
      const owners = typeof body.previousOwners === 'string' ? parseInt(body.previousOwners) : body.previousOwners;
      if (owners !== null && !isNaN(owners) && owners >= 0) updateData.previousOwners = owners;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('לא סופקו נתונים לעדכון', 400);
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      select: TEST_SELECT,
    });

    return jsonResponse({
      message: 'פרטי הטסט עודכנו בהצלחה',
      test: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
