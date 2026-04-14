import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

// GET /api/garage/vehicles - List vehicles that have had interaction with THIS garage
// (security: garages must not see customers/vehicles of other garages)
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    // Find garages owned by this user
    const garages = await prisma.garage.findMany({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (garages.length === 0) {
      return jsonResponse({ vehicles: [] });
    }

    const garageIds = garages.map(g => g.id);

    // Collect vehicle IDs that have appointments, inspections or treatments at this garage
    const [appts, inspections, treatments] = await Promise.all([
      prisma.appointment.findMany({
        where: { garageId: { in: garageIds } },
        select: { vehicleId: true },
      }),
      prisma.inspection.findMany({
        where: { garageId: { in: garageIds } },
        select: { vehicleId: true },
      }),
      prisma.treatment.findMany({
        where: { garageId: { in: garageIds } },
        select: { vehicleId: true },
      }),
    ]);

    const vehicleIds = Array.from(new Set([
      ...appts.map(a => a.vehicleId),
      ...inspections.map(i => i.vehicleId),
      ...treatments.map(t => t.vehicleId).filter((id): id is string => !!id),
    ]));

    if (vehicleIds.length === 0) {
      return jsonResponse({ vehicles: [] });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
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
