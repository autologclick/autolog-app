import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError, validationErrorResponse, sanitize } from '@/lib/api-helpers';

const updateGarageSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  phone: z.string().regex(/^[0-9\-+()\s]+$/).max(20).optional(),
  email: z.string().email().optional(),
  description: z.string().max(500).optional(),
  services: z.string().max(1000).optional(),
  workingHours: z.string().max(500).optional(),
  amenities: z.string().max(500).optional(),
});

// GET /api/garage/profile - Get garage profile for current owner
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
    });

    if (!garage) {
      return errorResponse('×××¡× ×× × ××¦×', 404);
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

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) {
      return errorResponse('×××¡× ×× × ××¦×', 404);
    }

    const updated = await prisma.garage.update({
      where: { id: garage.id },
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        phone: body.phone,
        email: body.email,
        description: body.description,
        services: body.services,
        workingHours: body.workingHours,
        amenities: body.amenities,
      },
    });

    return jsonResponse({ garage: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
