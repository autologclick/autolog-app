import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

// GET /api/garage/vehicles - List all vehicles (for garage inspections)
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    // Get all vehicles that have had appointments at this garage,
    // plus any vehicle in the system (for comprehensive search)
    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        nickname: true,
        manufacturer: true,
        model: true,
        year: true,
        licensePlate: true,
        color: true,
        mileage: true,
        userId: true,
        user: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return jsonResponse({ vehicles });
  } catch (error) {
    return handleApiError(error);
  }
}
