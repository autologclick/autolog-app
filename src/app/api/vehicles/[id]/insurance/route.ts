import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { assertVehicleRecordAccess } from '@/lib/vehicle-access';
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

    await assertVehicleRecordAccess(payload.userId, params.id);

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
        // Roadside assistance — comprehensive policies only
        roadServiceProvider,
        roadServicePhone,
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
      // Roadside provider — optional, silent on missing.
      // Accept empty string as "clear it" (so user can manually remove a bad scan).
      if (roadServiceProvider !== undefined) {
        updateData.roadServiceProvider = roadServiceProvider || null;
      }
      if (roadServicePhone !== undefined) {
        updateData.roadServicePhone = roadServicePhone || null;
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
        // Roadside assistance — silent feature, only surfaces if populated
        roadServiceProvider: true,
        roadServicePhone: true,
      },
    });

    // ─────────────────────────────────────────────────────────────────────
    // Auto-sync to Expenses — without this the dashboard shows 0 even though
    // the user just paid for insurance. Idempotent: we use a description
    // marker `[insurance:compulsory:2026]` to find an existing expense
    // for the same policy year and update it instead of creating duplicates.
    // ─────────────────────────────────────────────────────────────────────
    const insuranceCost = body.insuranceCost;
    const parsedCost = typeof insuranceCost === 'string' ? parseFloat(insuranceCost) : insuranceCost;

    if (parsedCost && !isNaN(parsedCost) && parsedCost > 0) {
      const expenseDate = body.insuranceStart
        ? new Date(body.insuranceStart)
        : new Date(); // fall back to "today" if no start date provided

      if (!isNaN(expenseDate.getTime())) {
        const policyYear = expenseDate.getFullYear();
        const typeLabel = insuranceCategory === 'compulsory' ? 'ביטוח חובה' : "ביטוח מקיף / צד ג'";
        const marker = `[insurance:${insuranceCategory}:${policyYear}]`;
        const companyName = body.insuranceCompany || 'לא צוין';
        const description = `${typeLabel} — ${companyName} ${marker}`;

        try {
          // Look for an existing expense for this policy year (same insurance
          // category) so a "save again" doesn't double up.
          const existing = await prisma.expense.findFirst({
            where: {
              vehicleId: id,
              category: 'insurance',
              description: { contains: marker },
            },
          });

          if (existing) {
            await prisma.expense.update({
              where: { id: existing.id },
              data: {
                amount: parsedCost,
                description,
                date: expenseDate,
              },
            });
          } else {
            await prisma.expense.create({
              data: {
                vehicleId: id,
                category: 'insurance',
                amount: parsedCost,
                description,
                date: expenseDate,
              },
            });
          }
        } catch (e) {
          // Non-fatal — log to server but don't fail the insurance save itself.
          // The vehicle's insurance fields already saved successfully above.
          console.warn('[insurance] expense sync failed', e);
        }
      }
    }

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
        // Roadside assistance
        roadServiceProvider: true,
        roadServicePhone: true,
      },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    await assertVehicleRecordAccess(payload.userId, params.id);

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
        roadServiceProvider: vehicle.roadServiceProvider,
        roadServicePhone: vehicle.roadServicePhone,
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
