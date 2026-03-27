import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { NOT_FOUND, SUCCESS_MESSAGES } from '@/lib/messages';

const mechanicSchema = z.object({
  fullName: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100),
  phone: z.string().regex(/^[\d\-+() ]{7,20}$/, 'מספר טלפון לא תקין').optional().or(z.literal('')),
  role: z.enum(['mechanic', 'senior_mechanic', 'manager', 'inspector']).optional(),
  specialization: z.enum(['engine', 'electrical', 'bodywork', 'tires', 'general']).optional(),
  avatarUrl: z.string().url('כתובת תמונה לא תקינה').optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
});

// GET /api/garage/mechanics - List all mechanics for garage
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    const mechanics = await prisma.garageMechanic.findMany({
      where: { garageId: garage.id },
      orderBy: { createdAt: 'asc' },
    });

    return jsonResponse({ mechanics });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/garage/mechanics - Add a new mechanic
export async function POST(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const body = await req.json();

    const validation = mechanicSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    const data = validation.data;
    const mechanic = await prisma.garageMechanic.create({
      data: {
        garageId: garage.id,
        fullName: data.fullName,
        phone: data.phone || null,
        role: data.role || 'mechanic',
        specialization: data.specialization || 'general',
        avatarUrl: data.avatarUrl || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
      },
    });

    return jsonResponse({ mechanic, message: SUCCESS_MESSAGES.SAVED }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/garage/mechanics?id=xxx - Soft-delete a mechanic
export async function DELETE(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const url = new URL(req.url);
    const mechanicId = url.searchParams.get('id');

    if (!mechanicId) {
      return errorResponse('מזהה מכונאי נדרש', 400);
    }

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    // Verify mechanic belongs to this garage
    const mechanic = await prisma.garageMechanic.findFirst({
      where: { id: mechanicId, garageId: garage.id },
    });

    if (!mechanic) return errorResponse('מכונאי לא נמצא', 404);

    await prisma.garageMechanic.update({
      where: { id: mechanicId },
      data: { isActive: false },
    });

    return jsonResponse({ message: SUCCESS_MESSAGES.DELETED });
  } catch (error) {
    return handleApiError(error);
  }
}
