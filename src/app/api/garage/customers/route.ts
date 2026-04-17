import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, handleApiError } from '@/lib/api-helpers';
import {
  AppointmentRow,
  InspectionRow,
  aggregateGarageCustomers,
} from '@/lib/services/garage-customer-service';

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

    // Fetch appointments and inspections in parallel
    const [appointments, inspections] = await Promise.all([
      prisma.appointment.findMany({
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
      }),
      prisma.inspection.findMany({
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
      }),
    ]);

    let customers = aggregateGarageCustomers(
      appointments as AppointmentRow[],
      inspections as InspectionRow[],
    );

    // Optional search filter
    const search = req.nextUrl.searchParams.get('search')?.trim().toLowerCase();
    if (search) {
      customers = customers.filter(c =>
        c.fullName.toLowerCase().includes(search) ||
        (c.phone && c.phone.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        c.vehicles.some(v => v.licensePlate.includes(search))
      );
    }

    // Optional limit
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '0');
    if (limit > 0) {
      customers = customers.slice(0, limit);
    }

    return jsonResponse({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}
