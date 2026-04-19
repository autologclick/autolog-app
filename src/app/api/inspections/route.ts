import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, requireGarageOwner, jsonResponse, errorResponse, handleApiError, getPaginationParams, paginationMeta, validationErrorResponse } from '@/lib/api-helpers';
import { comprehensiveInspectionSchema } from '@/lib/validations';
import { NOT_FOUND } from '@/lib/messages';
import { INSPECTION_TYPE_HEB } from '@/lib/constants/translations';
import { buildInspectionData, generateAutoInspectionItems, ValidatedInspectionInput } from '@/lib/services/inspection-service';
import { updateVehicleMileage, MileageError } from '@/lib/mileage';

// GET /api/inspections - List inspections (user sees their own, garage sees theirs)
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { page, skip, limit } = getPaginationParams(req);
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId');
    const garageId = url.searchParams.get('garageId');
    const status = url.searchParams.get('status');

    const where: Prisma.InspectionWhereInput = {};

    if (payload.role === 'user') {
      const userVehicles = await prisma.vehicle.findMany({
        where: { userId: payload.userId },
        select: { id: true },
      });
      where.vehicleId = { in: userVehicles.map(v => v.id) };
    } else if (payload.role === 'garage_owner') {
      const garage = await prisma.garage.findUnique({ where: { ownerId: payload.userId } });
      if (garage) where.garageId = garage.id;
    }
    // admin sees all

    if (vehicleId) where.vehicleId = vehicleId;
    if (garageId) where.garageId = garageId;
    if (status) where.status = status;

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          vehicle: { select: { nickname: true, model: true, manufacturer: true, licensePlate: true, userId: true, year: true } },
          garage: { select: { name: true, city: true, phone: true } },
          items: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inspection.count({ where }),
    ]);

    return jsonResponse({ inspections, ...paginationMeta(total, page, limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/inspections - Create new comprehensive inspection (garage only)
export async function POST(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const body = await req.json();

    const validation = comprehensiveInspectionSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const data = validation.data;

    if (!data.vehicleId && !data.manualVehicle) {
      return errorResponse('יש לבחור רכב או להזין מספר רישוי', 400);
    }

    const garage = await prisma.garage.findUnique({ where: { ownerId: payload.userId } });
    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    let vehicle: { id: string; userId: string; nickname: string; manufacturer: string; model: string; licensePlate: string; [key: string]: unknown };

    if (data.vehicleId) {
      // Find existing vehicle by ID
      vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) return errorResponse(NOT_FOUND.VEHICLE, 404);
    } else if (data.manualVehicle) {
      // Try to find by license plate first
      vehicle = await prisma.vehicle.findFirst({
        where: { licensePlate: data.manualVehicle.licensePlate },
      });

      if (!vehicle) {
        // Create a new vehicle record linked to the garage owner.
        // The vehicle will be transferred to the actual customer when they
        // register/claim it via the inspection link.
        vehicle = await prisma.vehicle.create({
          data: {
            userId: payload.userId,
            licensePlate: data.manualVehicle.licensePlate,
            manufacturer: data.manualVehicle.manufacturer || 'לא צוין',
            model: data.manualVehicle.model || 'לא צוין',
            year: data.manualVehicle.year || 0,
            color: data.manualVehicle.color || null,
            nickname: (data.manualVehicle.manufacturer && data.manualVehicle.model)
              ? `${data.manualVehicle.manufacturer} ${data.manualVehicle.model}`
              : data.manualVehicle.licensePlate,
          },
        });
      }
    }

    // Validate + auto-propagate mileage BEFORE creating the inspection
    if (data.mileage && data.mileage > 0) {
      try {
        await updateVehicleMileage(vehicle.id, data.mileage);
      } catch (e) {
        if (e instanceof MileageError) return errorResponse(e.message, e.status);
        throw e;
      }
    }

    // Build the inspection data object
    let inspectionData;
    try {
      inspectionData = buildInspectionData(data as ValidatedInspectionInput, vehicle.id, garage.id);
    } catch (buildErr) {
      console.error('[Inspection] Failed to build inspection data:', buildErr);
      return errorResponse('שגיאה בבניית נתוני הבדיקה', 500);
    }

    // Create inspection and items in a transaction
    const inspection = await prisma.$transaction(async (tx) => {
      const newInspection = await tx.inspection.create({
        data: inspectionData,
      });

      // Create inspection items if provided (legacy support)
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        await tx.inspectionItem.createMany({
          data: data.items.map((item) => ({
            inspectionId: newInspection.id,
            category: item.category,
            itemName: item.itemName,
            status: item.status,
            notes: item.notes || null,
            score: item.score || null,
          })),
        });
      }

      // Auto-generate inspection items from the system checks
      const autoItems = generateAutoInspectionItems(newInspection.id, data as ValidatedInspectionInput);

      if (autoItems.length > 0) {
        await tx.inspectionItem.createMany({ data: autoItems });
      }

      // Send notification to the vehicle owner only if it's a real customer
      // (not the garage owner who created the vehicle manually)
      const vehicleOwnerId = vehicle.userId;
      const isOwnedByGarage = vehicleOwnerId === payload.userId;

      if (!isOwnedByGarage) {
        await tx.notification.create({
          data: {
            userId: vehicleOwnerId,
            type: 'system',
            title: 'דוח בדיקה חדש!',
            message: `דוח בדיקה מסוג ${INSPECTION_TYPE_HEB[data.inspectionType] || data.inspectionType} לרכב ${vehicle.nickname || vehicle.manufacturer + ' ' + vehicle.model} (${vehicle.licensePlate}) זמין לצפייה.`,
            link: `/inspection/${newInspection.id}`,
          },
        });
      }

      // Auto-create a Treatment record for ALL inspection types so it appears
      // in the customer's treatments history
      const totalCost = data.workPerformed?.reduce((sum, w) => sum + (w.cost || 0), 0) || 0;
      const typeLabel = INSPECTION_TYPE_HEB[data.inspectionType] || data.inspectionType;
      const vehicleLabel = vehicle.nickname || vehicle.licensePlate;

      const treatmentTypeMap: Record<string, string> = {
        full: 'inspection',
        pre_test: 'inspection',
        periodic: 'maintenance',
        troubleshoot: 'repair',
        rot: 'inspection',
        engine: 'inspection',
        tires: 'maintenance',
        brakes: 'maintenance',
      };
      const treatmentType = treatmentTypeMap[data.inspectionType] || 'inspection';

      await tx.treatment.create({
        data: {
          vehicleId: vehicle.id,
          userId: vehicleOwnerId,
          garageId: garage.id,
          garageName: garage.name,
          mechanicName: data.mechanicName || null,
          type: treatmentType,
          title: `${typeLabel} - ${vehicleLabel}`,
          description: data.summary || null,
          items: data.serviceItems ? JSON.stringify(data.serviceItems) :
                 data.workPerformed ? JSON.stringify(data.workPerformed) : null,
          mileage: data.mileage || null,
          cost: totalCost > 0 ? totalCost : null,
          date: new Date().toISOString().split('T')[0],
          status: isOwnedByGarage ? 'completed' : 'pending_approval',
          sentByGarage: true,
          notes: JSON.stringify({ inspectionId: newInspection.id }),
        },
      });

      // Send treatment notification only to real customers (not garage-owned vehicles)
      if (!isOwnedByGarage) {
        const treatmentAction = treatmentType === 'inspection' ? 'בדיקה' : treatmentType === 'maintenance' ? 'תחזוקה' : 'תיקון';
        await tx.notification.create({
          data: {
            userId: vehicleOwnerId,
            type: 'system',
            title: 'טיפול חדש ממתין לאישורך',
            message: `${garage.name} שלח/ה ${treatmentAction} מסוג ${typeLabel} לרכב ${vehicleLabel}. לחץ כאן לצפייה ואישור.`,
            link: '/user/treatments',
          },
        });
      }

      return await tx.inspection.findUnique({
        where: { id: newInspection.id },
        include: {
          vehicle: { select: { nickname: true, model: true, manufacturer: true, licensePlate: true, year: true } },
          garage: { select: { name: true, city: true, phone: true } },
          items: true,
        },
      });
    });

    return jsonResponse({ inspection, message: 'הבדיקה נוצרה בהצלחה' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
