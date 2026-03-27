import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError,
  enforceRateLimit,
} from '@/lib/api-helpers';
import {
  buildVehicleMap,
  buildInspectionEvents,
  buildAppointmentEvents,
  buildExpenseEvents,
  buildSosEvents,
  sortEventsByDateDesc,
} from '@/lib/services/timeline-service';

// GET /api/history - Get unified timeline of all events
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    // Parse query parameters
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);

    // Validate type if provided
    if (type && !['inspection', 'appointment', 'expense', 'sos'].includes(type)) {
      return errorResponse('ÃÂ¡ÃÂÃÂ ÃÂÃÂÃÂ¨ÃÂÃÂ¢ ÃÂÃÂ ÃÂªÃÂ§ÃÂÃÂ', 400);
    }

    // If vehicleId is specified, verify user owns it
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.userId !== payload.userId) {
        return errorResponse('ÃÂÃÂÃÂ ÃÂÃÂ¨ÃÂ©ÃÂÃÂ ÃÂÃÂÃÂÃÂ©ÃÂ ÃÂÃÂ¨ÃÂÃÂ ÃÂÃÂ', 403);
      }
    }

    // Get all user vehicles for filtering
    const userVehicles = await prisma.vehicle.findMany({
      where: { userId: payload.userId },
      select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true },
    });

    const vehicleMap = buildVehicleMap(userVehicles);
    const vehicleIds = vehicleId ? [vehicleId] : Array.from(vehicleMap.keys());

    if (vehicleIds.length === 0) {
      return jsonResponse({ events: [], total: 0 });
    }

    // Fetch and build events using the service layer
    const allEvents = [
      ...(!type || type === 'inspection'
        ? buildInspectionEvents(
            await prisma.inspection.findMany({
              where: { vehicleId: { in: vehicleIds } },
              select: {
                id: true, vehicleId: true, date: true, inspectionType: true,
                status: true, overallScore: true,
                garage: { select: { name: true } },
              },
            }),
            vehicleMap,
          )
        : []),
      ...(!type || type === 'appointment'
        ? buildAppointmentEvents(
            await prisma.appointment.findMany({
              where: { vehicleId: { in: vehicleIds } },
              select: {
                id: true, vehicleId: true, date: true, serviceType: true,
                status: true, notes: true,
                garage: { select: { name: true } },
              },
            }),
            vehicleMap,
          )
        : []),
      ...(!type || type === 'expense'
        ? buildExpenseEvents(
            await prisma.expense.findMany({
              where: { vehicleId: { in: vehicleIds } },
              select: {
                id: true, vehicleId: true, date: true,
                category: true, amount: true, description: true,
              },
            }),
            vehicleMap,
          )
        : []),
      ...(!type || type === 'sos'
        ? buildSosEvents(
            await prisma.sosEvent.findMany({
              where: { vehicleId: { in: vehicleIds } },
              select: {
                id: true, vehicleId: true, createdAt: true, eventType: true,
                status: true, description: true, priority: true,
              },
            }),
            vehicleMap,
          )
        : []),
    ];

    // Sort and paginate
    sortEventsByDateDesc(allEvents);
    const paginatedEvents = allEvents.slice(0, limit);

    return jsonResponse({
      events: paginatedEvents,
      total: allEvents.length,
      limit,
      vehicleCount: vehicleIds.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
