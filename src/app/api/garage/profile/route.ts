import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';

const updateGarageProfileSchema = z.object({
  name: z.string().min(2, 'שם המוסך חייב להכיל לפחות 2 תווים').max(100).optional(),
  address: z.string().min(2, 'כתובת חייבת להכיל לפחות 2 תווים').max(200).optional(),
  city: z.string().min(2, 'עיר חייבת להכיל לפחות 2 תווים').max(100).optional(),
  phone: z.string().regex(/^[\d\-+() ]{7,20}$/, 'מספר טלפון לא תקין').optional(),
  email: z.string().email('כתובת אימייל לא תקינה').optional(),
  description: z.string().max(1000, 'תיאור ארוך מדי').optional(),
  services: z.array(z.string()).optional(),
  workingHours: z.record(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

// GET /api/garage/profile - Get garage profile for current owner
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    return jsonResponse({ garage });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/garage/profile - Update garage profile
export async function PUT(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const body = await req.json();

    const validation = updateGarageProfileSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    const updated = await prisma.garage.update({
      where: { id: garage.id },
      data: validation.data,
    });

    return jsonResponse({ garage: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
