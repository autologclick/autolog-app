import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, requireGarageOwner, jsonResponse, errorResponse, handleApiError, getPaginationParams, paginationMeta, validationErrorResponse } from '@/lib/api-helpers';
import { z } from 'zod';
import { NOT_FOUND } from '@/lib/messages';

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

    // Comprehensive validation schema matching the 8-step form
    const comprehensiveSchema = z.object({
      vehicleId: z.string().optional(),
      appointmentId: z.string().optional(),
      // Manual vehicle entry (when vehicleId is not provided)
      manualVehicle: z.object({
        licensePlate: z.string().min(5),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        year: z.number().int().optional(),
        color: z.string().optional(),
      }).optional(),
      inspectionType: z.enum(['full', 'rot', 'engine', 'tires', 'brakes', 'pre_test']),
      mechanicName: z.string().max(100).optional(),
      mileage: z.number().int().optional(),
      engineNumber: z.string().optional(),
      engineVerified: z.boolean().optional(),
      overallScore: z.number().int().min(0).max(100).optional(),

      // Photos (JSON objects with base64 strings)
      exteriorPhotos: z.record(z.string()).optional(),
      interiorPhotos: z.record(z.string()).optional(),

      // Tires & Lights
      tiresData: z.object({
        frontLeft: z.string().optional(),
        frontRight: z.string().optional(),
        rearLeft: z.string().optional(),
        rearRight: z.string().optional(),
      }).optional(),
      lightsData: z.object({
        brakes: z.string().optional(),
        reverse: z.string().optional(),
        fog: z.string().optional(),
        headlights: z.string().optional(),
        frontSignal: z.string().optional(),
        rearSignal: z.string().optional(),
        highBeam: z.string().optional(),
        plate: z.string().optional(),
      }).optional(),

      // Mechanical systems
      frontAxle: z.object({
        status: z.string().optional(),
        ballBearings: z.string().optional(),
        notes: z.string().optional(),
      }).optional(),
      steeringData: z.object({
        status: z.string().optional(),
        alignment: z.string().optional(),
        notes: z.string().optional(),
      }).optional(),
      shocksData: z.object({
        frontLeft: z.string().optional(),
        frontRight: z.string().optional(),
        rearLeft: z.string().optional(),
        rearRight: z.string().optional(),
        notes: z.string().optional(),
      }).optional(),
      bodyData: z.object({
        condition: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }).optional(),
      batteryData: z.object({
        isOriginal: z.boolean().optional(),
        date: z.string().optional(),
      }).optional(),

      // Fluids & Interior
      fluidsData: z.object({
        brakeFluid: z.string().optional(),
        engineOil: z.string().optional(),
        coolant: z.string().optional(),
      }).optional(),
      interiorSystems: z.object({
        acCold: z.string().optional(),
        acHot: z.string().optional(),
        audio: z.string().optional(),
      }).optional(),
      windowsData: z.object({
        frontLeft: z.string().optional(),
        frontRight: z.string().optional(),
        rearLeft: z.string().optional(),
        rearRight: z.string().optional(),
      }).optional(),

      // Engine & Gearbox
      engineIssues: z.object({
        issues: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }).optional(),
      gearboxIssues: z.object({
        notes: z.string().optional(),
      }).optional(),

      // Braking system percentages
      brakingSystem: z.object({
        frontDiscs: z.number().optional(),
        rearDiscs: z.number().optional(),
        frontPads: z.number().optional(),
        rearPads: z.number().optional(),
      }).optional(),

      // Summary & Notes
      summary: z.string().optional(),
      recommendations: z.array(z.object({
        text: z.string(),
        urgency: z.string().optional(),
        estimatedCost: z.string().optional(),
      })).optional(),
      notes: z.object({
        undercarriage: z.string().optional(),
        engine: z.string().optional(),
        general: z.string().optional(),
      }).optional(),

      // Customer signature
      customerName: z.string().optional(),
      customerIdNumber: z.string().optional(),
      customerSignature: z.string().optional(),

      // Legacy support
      detailedScores: z.record(z.number()).optional(),
      items: z.array(z.object({
        category: z.string(),
        itemName: z.string(),
        status: z.enum(['ok', 'warning', 'critical']),
        notes: z.string().optional(),
        score: z.number().int().min(0).max(100).optional(),
      })).optional(),

      // Pre-test data
      preTestChecklist: z.record(z.boolean()).optional(),
      preTestNotes: z.string().optional(),

      // Service/work items
      serviceItems: z.array(z.string()).optional(),
      workPerformed: z.array(z.object({
        item: z.string(),
        action: z.enum(['fixed', 'replaced', 'adjusted', 'checked', 'cleaned']),
        notes: z.string().optional(),
        cost: z.number().optional(),
      })).optional(),

      // Photos for non-full types
      vehiclePhoto: z.string().optional(),
      invoicePhoto: z.string().optional(),
    });

    const validation = comprehensiveSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const data = validation.data;

    if (!data.vehicleId && !data.manualVehicle) {
      return errorResponse('\u05d9\u05e9 \u05dc\u05d1\u05d7\u05d5\u05e8 \u05e8\u05db\u05d1 \u05d0\u05d5 \u05dc\u05d4\u05d6\u05d9\u05df \u05de\u05e1\u05e4\u05e8 \u05e8\u05d9\u05e9\u05d5\u05d9', 400);
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
        // Create a new vehicle record linked to the garage owner temporarily
        // (In production, this would be linked to the actual customer)
        vehicle = await prisma.vehicle.create({
          data: {
            userId: payload.userId, // temporary owner - garage
            licensePlate: data.manualVehicle.licensePlate,
            manufacturer: data.manualVehicle.manufacturer || '\u05dc\u05d0 \u05e6\u05d5\u05d9\u05df',
            model: data.manualVehicle.model || '\u05dc\u05d0 \u05e6\u05d5\u05d9\u05df',
            year: data.manualVehicle.year || 0,
            color: data.manualVehicle.color || null,
            nickname: (data.manualVehicle.manufacturer && data.manualVehicle.model)
              ? `${data.manualVehicle.manufacturer} ${data.manualVehicle.model}`
              : data.manualVehicle.licensePlate,
          },
        });
      }
    }

    // Build the inspection data object
    const inspectionData: Prisma.InspectionUncheckedCreateInput = {
      vehicleId: vehicle.id,
      garageId: garage.id,
      appointmentId: data.appointmentId || null,
      inspectionType: data.inspectionType,
      mechanicName: data.mechanicName || null,
      date: new Date(),
      status: 'completed',
      overallScore: data.overallScore ?? null,
      mileage: data.mileage ?? null,
      engineNumber: data.engineNumber || null,
      engineVerified: data.engineVerified ?? false,

      // Photos as JSON strings
      exteriorPhotos: data.exteriorPhotos ? JSON.stringify(data.exteriorPhotos) : null,
      interiorPhotos: data.interiorPhotos ? JSON.stringify(data.interiorPhotos) : null,

      // System checks as JSON strings
      tiresData: data.tiresData ? JSON.stringify(data.tiresData) : null,
      lightsData: data.lightsData ? JSON.stringify(data.lightsData) : null,
      frontAxle: data.frontAxle ? JSON.stringify(data.frontAxle) : null,
      steeringData: data.steeringData ? JSON.stringify(data.steeringData) : null,
      shocksData: data.shocksData ? JSON.stringify(data.shocksData) : null,
      bodyData: data.bodyData ? JSON.stringify(data.bodyData) : null,
      batteryData: data.batteryData ? JSON.stringify(data.batteryData) : null,
      fluidsData: data.fluidsData ? JSON.stringify(data.fluidsData) : null,
      interiorSystems: data.interiorSystems ? JSON.stringify(data.interiorSystems) : null,
      windowsData: data.windowsData ? JSON.stringify(data.windowsData) : null,
      engineIssues: data.engineIssues ? JSON.stringify(data.engineIssues) : null,
      gearboxIssues: data.gearboxIssues ? JSON.stringify(data.gearboxIssues) : null,
      brakingSystem: data.brakingSystem ? JSON.stringify(data.brakingSystem) : null,

      // Summary & results
      summary: data.summary || null,
      recommendations: data.recommendations ? JSON.stringify(data.recommendations) : null,
      notes: data.notes ? JSON.stringify(data.notes) : null,
      detailedScores: data.detailedScores ? JSON.stringify(data.detailedScores) : null,

      // Customer signature
      customerName: data.customerName || null,
      customerIdNumber: data.customerIdNumber || null,
      customerSignature: data.customerSignature || null,
      signedAt: data.customerSignature ? new Date() : null,

      // Pre-test fields
      preTestChecklist: data.preTestChecklist ? JSON.stringify(data.preTestChecklist) : null,
      preTestNotes: data.preTestNotes || null,
      serviceItems: data.serviceItems ? JSON.stringify(data.serviceItems) : null,
      workPerformed: data.workPerformed ? JSON.stringify(data.workPerformed) : null,
    };

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
      const autoItems: Array<{ inspectionId: string; category: string; itemName: string; status: string; notes: string | null; score: number | null }> = [];

      // Tires
      if (data.tiresData) {
        Object.entries(data.tiresData).forEach(([key, val]) => {
          if (val) {
            const nameMap: Record<string, string> = { frontLeft: '\u05e6\u05de\u05d9\u05d2 \u05e7\u05d3\u05de\u05d9 \u05e9\u05de\u05d0\u05dc', frontRight: '\u05e6\u05de\u05d9\u05d2 \u05e7\u05d3\u05de\u05d9 \u05d9\u05de\u05d9\u05df', rearLeft: '\u05e6\u05de\u05d9\u05d2 \u05d0\u05d7\u05d5\u05e8\u05d9 \u05e9\u05de\u05d0\u05dc', rearRight: '\u05e6\u05de\u05d9\u05d2 \u05d0\u05d7\u05d5\u05e8\u05d9 \u05d9\u05de\u05d9\u05df' };
            autoItems.push({ inspectionId: newInspection.id, category: 'tires', itemName: nameMap[key] || key, status: val, notes: null, score: null });
          }
        });
      }

      // Lights
      if (data.lightsData) {
        Object.entries(data.lightsData).forEach(([key, val]) => {
          if (val) {
            const nameMap: Record<string, string> = { brakes: '\u05d0\u05d5\u05e8\u05d5\u05ea \u05d1\u05dc\u05dd', reverse: '\u05d0\u05d5\u05e8\u05d5\u05ea \u05e8\u05d9\u05d5\u05d5\u05e8\u05e1', fog: '\u05d0\u05d5\u05e8\u05d5\u05ea \u05e2\u05e8\u05e4\u05dc', headlights: '\u05e4\u05e0\u05e1\u05d9\u05dd \u05e8\u05d0\u05e9\u05d9\u05d9\u05dd', frontSignal: '\u05d0\u05d9\u05ea\u05d5\u05ea \u05e7\u05d3\u05de\u05d9', rearSignal: '\u05d0\u05d9\u05ea\u05d5\u05ea \u05d0\u05d7\u05d5\u05e8\u05d9', highBeam: '\u05d0\u05d5\u05e8 \u05d2\u05d1\u05d5\u05d4', plate: '\u05ea\u05d0\u05d5\u05e8\u05ea \u05dc\u05d5\u05d7\u05d9\u05ea' };
            autoItems.push({ inspectionId: newInspection.id, category: 'electrical', itemName: nameMap[key] || key, status: val, notes: null, score: null });
          }
        });
      }

      // Fluids
      if (data.fluidsData) {
        Object.entries(data.fluidsData).forEach(([key, val]) => {
          if (val) {
            const nameMap: Record<string, string> = { brakeFluid: '\u05e0\u05d5\u05d6\u05dc \u05d1\u05dc\u05de\u05d9\u05dd', engineOil: '\u05e9\u05de\u05df \u05de\u05e0\u05d5\u05e2', coolant: '\u05e0\u05d5\u05d6\u05dc \u05e7\u05d9\u05e8\u05d5\u05e8' };
            autoItems.push({ inspectionId: newInspection.id, category: 'fluids', itemName: nameMap[key] || key, status: val, notes: null, score: null });
          }
        });
      }

      // Auto-generate items from pre-test checklist
      if (data.preTestChecklist) {
        const preTestNameMap: Record<string, string> = {
          tires: '\u05e6\u05de\u05d9\u05d2\u05d9\u05dd (\u05de\u05e6\u05d1 + \u05dc\u05d7\u05e5)', lights: '\u05d0\u05d5\u05e8\u05d5\u05ea \u05d5\u05de\u05d7\u05d5\u05d5\u05e0\u05d9\u05dd', brakes: '\u05d1\u05dc\u05de\u05d9\u05dd',
          mirrors: '\u05de\u05e8\u05d0\u05d5\u05ea', wipers: '\u05de\u05d2\u05d1\u05d9\u05dd + \u05e0\u05d5\u05d6\u05dc', horn: '\u05e6\u05d5\u05e4\u05e8',
          seatbelts: '\u05d7\u05d2\u05d5\u05e8\u05d5\u05ea \u05d1\u05d8\u05d9\u05d7\u05d5\u05ea', exhaust: '\u05de\u05e2\u05e8\u05db\u05ea \u05e4\u05dc\u05d9\u05d8\u05d4', steering: '\u05d4\u05d9\u05d2\u05d5\u05d9',
          suspension: '\u05de\u05ea\u05dc\u05d9\u05dd \u05d5\u05d1\u05d5\u05dc\u05de\u05d9\u05dd', fluids: '\u05e0\u05d5\u05d6\u05dc\u05d9\u05dd', battery: '\u05de\u05e6\u05d1\u05e8',
          handbrake: '\u05d1\u05dc\u05dd \u05d9\u05d3', speedometer: '\u05de\u05d3 \u05de\u05d4\u05d9\u05e8\u05d5\u05ea', windows: '\u05d7\u05dc\u05d5\u05e0\u05d5\u05ea \u05d5\u05e9\u05de\u05e9\u05d5\u05ea',
        };
        const preTestItems = Object.entries(data.preTestChecklist).map(([key, passed]) => ({
          inspectionId: newInspection.id,
          category: 'pre_test',
          itemName: preTestNameMap[key] || key,
          status: passed ? 'ok' : 'critical',
          notes: null,
          score: passed ? 100 : 0,
        }));
        if (preTestItems.length > 0) {
          autoItems.push(...preTestItems);
        }
      }

      // Auto-generate items from work performed
      if (data.workPerformed && data.workPerformed.length > 0) {
        const workItems = data.workPerformed.map((work) => ({
          inspectionId: newInspection.id,
          category: 'work_performed',
          itemName: work.item,
          status: work.action,
          notes: work.notes || null,
          score: null,
        }));
        autoItems.push(...workItems);
      }

      if (autoItems.length > 0) {
        await tx.inspectionItem.createMany({ data: autoItems });
      }

      // Create notification for the vehicle owner
      await tx.notification.create({
        data: {
          userId: vehicle.userId,
          type: 'system',
          title: '\u05d3\u05d5\u05d7 \u05d1\u05d3\u05d9\u05e7\u05d4 \u05d7\u05d3\u05e9!',
          message: `\u05d3\u05d5\u05d7 \u05d1\u05d3\u05d9\u05e7\u05d4 \u05de\u05e1\u05d5\u05d2 ${data.inspectionType === 'full' ? '\u05d1\u05d3\u05d9\u05e7\u05d4 \u05de\u05dc\u05d0\u05d4' : data.inspectionType === 'pre_test' ? '\u05d4\u05db\u05e0\u05d4 \u05dc\u05d8\u05e1\u05d8' : data.inspectionType === 'rot' ? '\u05d1\u05d3\u05d9\u05e7\u05ea \u05e8\u05e7\u05d1' : data.inspectionType} \u05dc\u05e8\u05db\u05d1 ${vehicle.nickname || vehicle.manufacturer + ' ' + vehicle.model} (${vehicle.licensePlate}) \u05d6\u05de\u05d9\u05df \u05dc\u05e6\u05e4\u05d9\u05d9\u05d4.`,
          link: `/inspection/${newInspection.id}`,
        },
      });

      return await tx.inspection.findUnique({
        where: { id: newInspection.id },
        include: {
          vehicle: { select: { nickname: true, model: true, manufacturer: true, licensePlate: true, year: true } },
          garage: { select: { name: true, city: true, phone: true } },
          items: true,
        },
      });
    });

    return jsonResponse({ inspection, message: '\u05d4\u05d1\u05d3\u05d9\u05e7\u05d4 \u05e0\u05d5\u05e6\u05e8\u05d4 \u05d1\u05d4\u05e6\u05dc\u05d7\u05d4' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
