import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

// GET /api/garage/profile - Get garage profile for current owner
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
    });

    if (!garage) {
      return errorResponse('מוסך לא נמצא', 404);
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
      return errorResponse('מוסך לא נמצא', 404);
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
