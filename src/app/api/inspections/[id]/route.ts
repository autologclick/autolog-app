import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { z } from 'zod';

// Helper to safely parse JSON fields
function safeJsonParse(value: string | null): any {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

// GET /api/inspections/[id] - Get single inspection with all details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const payload = requireAuth(req);

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true, nickname: true, manufacturer: true, model: true,
            year: true, licensePlate: true, color: true, vin: true,
            userId: true, mileage: true,
          },
        },
        garage: {
          select: {
            id: true, name: true, city: true, address: true, phone: true, email: true,
          },
        },
        items: true,
      },
    });

    if (!inspection) {
      return errorResponse('בדיקה לא נמצאה', 404);
    }

    // Verify access
    if (payload.role === 'user') {
      if (inspection.vehicle.userId !== payload.userId) {
        return errorResponse('אין הרשאה להציג בדיקה זו', 403);
      }
    } else if (payload.role === 'garage_owner') {
      const garage = await prisma.garage.findUnique({
        where: { ownerId: payload.userId },
        select: { id: true },
      });
      if (garage?.id !== inspection.garageId) {
        return errorResponse('אין הרשאה להציג בדיקה זו', 403);
      }
    }

    // Parse all JSON fields for the response
    const response = {
      ...inspection,
      detailedScores: safeJsonParse(inspection.detailedScores),
      recommendations: safeJsonParse(inspection.recommendations),
      photos: safeJsonParse(inspection.photos),
      exteriorPhotos: safeJsonParse(inspection.exteriorPhotos),
      interiorPhotos: safeJsonParse(inspection.interiorPhotos),
      tiresData: safeJsonParse(inspection.tiresData),
      lightsData: safeJsonParse(inspection.lightsData),
      frontAxle: safeJsonParse(inspection.frontAxle),
      steeringData: safeJsonParse(inspection.steeringData),
      shocksData: safeJsonParse(inspection.shocksData),
      bodyData: safeJsonParse(inspection.bodyData),
      batteryData: safeJsonParse(inspection.batteryData),
      fluidsData: safeJsonParse(inspection.fluidsData),
      interiorSystems: safeJsonParse(inspection.interiorSystems),
      windowsData: safeJsonParse(inspection.windowsData),
      engineIssues: safeJsonParse(inspection.engineIssues),
      gearboxIssues: safeJsonParse(inspection.gearboxIssues),
      brakingSystem: safeJsonParse(inspection.brakingSystem),
      notes: safeJsonParse(inspection.notes),
    };

    // Fetch new columns via raw SQL since Prisma client wasn't regenerated
    let extraFields: any = {};
    try {
      const rawRows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT preTestChecklist, preTestNotes, serviceItems, workPerformed FROM Inspection WHERE id = ?`,
        id
      );
      if (rawRows && rawRows.length > 0) {
        extraFields = rawRows[0];
      }
    } catch {}

    const fullResponse = {
      ...response,
      preTestChecklist: safeJsonParse(extraFields.preTestChecklist || null),
      preTestNotes: extraFields.preTestNotes || null,
      workPerformed: safeJsonParse(extraFields.workPerformed || null),
      serviceItems: safeJsonParse(extraFields.serviceItems || null),
    };

    return jsonResponse({ inspection: fullResponse });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/inspections/[id] - Update inspection
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const payload = requireAuth(req);
    const body = await req.json();

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!inspection) {
      return errorResponse('בדיקה לא נמצאה', 404);
    }

    if (payload.role === 'garage_owner') {
      const garage = await prisma.garage.findUnique({
        where: { ownerId: payload.userId },
        select: { id: true },
      });
      if (garage?.id !== inspection.garageId) {
        return errorResponse('אין הרשאה לעדכן בדיקה זו', 403);
      }
    } else if (payload.role !== 'admin') {
      return errorResponse('אין הרשאה לעדכן בדיקה זו', 403);
    }

    const updateSchema = z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'awaiting_signature']).optional(),
      overallScore: z.number().int().min(0).max(100).optional(),
      summary: z.string().optional(),
      mechanicName: z.string().optional(),
      aiSummary: z.string().optional(),
    });

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const updated = await prisma.inspection.update({
      where: { id },
      data: validation.data,
      include: {
        vehicle: { select: { nickname: true, model: true, licensePlate: true } },
        garage: { select: { name: true, city: true } },
        items: true,
      },
    });

    return jsonResponse({ inspection: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
