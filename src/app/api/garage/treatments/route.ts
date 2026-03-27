import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { createGarageTreatment, getGarageTreatments } from '@/lib/treatments-db';
import prisma from '@/lib/db';
import { NOT_FOUND, AUTH_ERRORS } from '@/lib/messages';
import { z } from 'zod';

const garageTreatmentSchema = z.object({
  licensePlate: z.string().min(1),
  type: z.enum(['maintenance', 'repair', 'oil_change', 'tires', 'brakes', 'electrical', 'ac', 'bodywork', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  items: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  date: z.string().min(1),
  mechanicName: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

// GET /api/garage/treatments - Get treatments sent by this garage
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'garage_owner') {
      return errorResponse(AUTH_ERRORS.FORBIDDEN, 403);
    }

    const garage = await prisma.garage.findFirst({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    const treatments = await getGarageTreatments(garage.id);
    return jsonResponse({ treatments });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/garage/treatments - Send treatment to a vehicle owner
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'garage_owner') {
      return errorResponse(AUTH_ERRORS.FORBIDDEN, 403);
    }

    const body = await req.json();
    const validation = garageTreatmentSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || '× ×ª×× ×× ×× ×ª×§×× ××', 400);
    }

    const data = validation.data;

    // Find the garage
    const garage = await prisma.garage.findFirst({
      where: { ownerId: payload.userId },
      select: { id: true, name: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    // Find the vehicle by license plate
    const vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate as string },
      select: { id: true, userId: true, nickname: true },
    });

    if (!vehicle) {
      return errorResponse('×¨×× ×× × ××¦× ×××¢×¨××ª. ×××§×× ×¦×¨×× ××××¨×©× ×ª××××.', 404);
    }

    const treatment = await createGarageTreatment({
      vehicleId: vehicle.id,
      userId: vehicle.userId,
      garageId: garage.id,
      garageName: garage.name,
      mechanicName: data.mechanicName as string | undefined,
      type: data.type,
      title: data.title,
      description: data.description,
      items: data.items,
      mileage: data.mileage,
      cost: data.cost,
      date: data.date,
      notes: data.notes,
    });

    return jsonResponse({ treatment, message: '××××¤×× × ×©×× ×××§×× ××××©××¨!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
