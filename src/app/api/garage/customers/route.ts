import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, handleApiError } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    // Find garage by owner
    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
    });

    if (!garage) {
      return jsonResponse({ customers: [] });
    }

    // Get appointments at this garage
    const appointments = await prisma.appointment.findMany({
      where: { garageId: garage.id },
      select: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        vehicle: {
          select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true, year: true },
        },
        date: true,
      },
      orderBy: { date: 'desc' },
    });

    // Get inspections at this garage
    const inspections = await prisma.inspection.findMany({
      where: { garageId: garage.id },
      select: {
        vehicle: {
          select: {
            id: true,
            nickname: true,
            licensePlate: true,
            manufacturer: true,
            model: true,
            year: true,
            userId: true,
            user: { select: { id: true, fullName: true, phone: true, email: true } },
          },
        },
        date: true,
      },
      orderBy: { date: 'desc' },
    });

    // Build customer map using plain objects
    const customerMap: Record<string, any> = {};
    const vehicleMap: Record<string, Record<string, any>> = {};

    // From appointments
    for (const apt of appointments) {
      const userId = apt.user.id;
      if (!customerMap[userId]) {
        customerMap[userId] = {
          id: apt.user.id,
          fullName: apt.user.fullName,
          phone: apt.user.phone,
          email: apt.user.email,
          lastVisit: apt.date,
          totalVisits: 0,
        };
        vehicleMap[userId] = {};
      }
      customerMap[userId].totalVisits++;
      if (new Date(apt.date) > new Date(customerMap[userId].lastVisit)) {
        customerMap[userId].lastVisit = apt.date;
      }
      if (!vehicleMap[userId][apt.vehicle.id]) {
        vehicleMap[userId][apt.vehicle.id] = {
          id: apt.vehicle.id,
          nickname: apt.vehicle.nickname,
          licensePlate: apt.vehicle.licensePlate,
          manufacturer: apt.vehicle.manufacturer,
          model: apt.vehicle.model,
          year: apt.vehicle.year,
        };
      }
    }

    // From inspections
    for (const insp of inspections) {
      const userId = insp.vehicle.userId;
      const user = insp.vehicle.user;
      if (!customerMap[userId]) {
        customerMap[userId] = {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          lastVisit: insp.date,
          totalVisits: 0,
        };
        vehicleMap[userId] = {};
      }
      customerMap[userId].totalVisits++;
      if (new Date(insp.date) > new Date(customerMap[userId].lastVisit)) {
        customerMap[userId].lastVisit = insp.date;
      }
      if (!vehicleMap[userId][insp.vehicle.id]) {
        vehicleMap[userId][insp.vehicle.id] = {
          id: insp.vehicle.id,
          nickname: insp.vehicle.nickname,
          licensePlate: insp.vehicle.licensePlate,
          manufacturer: insp.vehicle.manufacturer,
          model: insp.vehicle.model,
          year: insp.vehicle.year,
        };
      }
    }

    // Convert to array with vehicles
    const customers = Object.keys(customerMap).map(userId => ({
      ...customerMap[userId],
      vehicles: Object.values(vehicleMap[userId] || {}),
    }));

    // Sort by last visit desc
    customers.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

    return jsonResponse({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}
