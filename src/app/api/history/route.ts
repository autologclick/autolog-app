import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { checkApiRateLimit } from '@/lib/rate-limit';
import {
  HISTORY_EVENT_TITLES,
  INSPECTION_TYPE_HEB,
  EXPENSE_CATEGORY_HEB,
  SOS_TYPE_HEB,
} from '@/lib/constants/translations';

type TimelineEvent = {
  id: string;
  type: 'inspection' | 'appointment' | 'expense' | 'sos';
  date: Date;
  title: string;
  description: string;
  vehicleId: string;
  vehicleName: string;
  status: string;
  metadata: Record<string, any>;
};

// GET /api/history - Get unified timeline of all events
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500); // Max 500

    // Validate type if provided
    if (type && !['inspection', 'appointment', 'expense', 'sos'].includes(type)) {
      return errorResponse('סוג אירוע לא תקין', 400);
    }

    // If vehicleId is specified, verify user owns it
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.userId !== payload.userId) {
        return errorResponse('אין הרשאה לגישה לרכב זה', 403);
      }
    }

    // Get all user vehicles for filtering
    const userVehicles = await prisma.vehicle.findMany({
      where: { userId: payload.userId },
      select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true },
    });

    const vehicleMap = new Map(userVehicles.map(v => [v.id, v]));

    // If vehicleId is specified, filter to only that vehicle
    const vehicleIds = vehicleId ? [vehicleId] : Array.from(vehicleMap.keys());

    if (vehicleIds.length === 0) {
      return jsonResponse({ events: [], total: 0 });
    }

    const events: TimelineEvent[] = [];

    // Fetch inspections
    if (!type || type === 'inspection') {
      const inspections = await prisma.inspection.findMany({
        where: { vehicleId: { in: vehicleIds } },
        select: {
          id: true,
          vehicleId: true,
          date: true,
          inspectionType: true,
          status: true,
          overallScore: true,
          garage: { select: { name: true } },
        },
      });

      inspections.forEach(inspection => {
        const vehicle = vehicleMap.get(inspection.vehicleId);
        if (vehicle) {
          events.push({
            id: `inspection_${inspection.id}`,
            type: 'inspection',
            date: inspection.date,
            title: HISTORY_EVENT_TITLES.inspection,
            description: `בדיקה ${inspection.inspectionType} ב${inspection.garage?.name || 'סדנה'}`,
            vehicleId: inspection.vehicleId,
            vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
            status: inspection.status,
            metadata: {
              inspectionId: inspection.id,
              inspectionType: inspection.inspectionType,
              garageName: inspection.garage?.name,
              overallScore: inspection.overallScore,
            },
          });
        }
      });
    }

    // Fetch appointments
    if (!type || type === 'appointment') {
      const appointments = await prisma.appointment.findMany({
        where: { vehicleId: { in: vehicleIds } },
        select: {
          id: true,
          vehicleId: true,
          date: true,
          serviceType: true,
          status: true,
          garage: { select: { name: true } },
          notes: true,
        },
      });

      appointments.forEach(appointment => {
        const vehicle = vehicleMap.get(appointment.vehicleId);
        if (vehicle) {
          events.push({
            id: `appointment_${appointment.id}`,
            type: 'appointment',
            date: appointment.date,
            title: HISTORY_EVENT_TITLES.appointment,
            description: `תור ל${getServiceTypeName(appointment.serviceType)} ב${appointment.garage?.name || 'סדנה'}`,
            vehicleId: appointment.vehicleId,
            vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
            status: appointment.status,
            metadata: {
              appointmentId: appointment.id,
              serviceType: appointment.serviceType,
              garageName: appointment.garage?.name,
              notes: appointment.notes,
            },
          });
        }
      });
    }

    // Fetch expenses
    if (!type || type === 'expense') {
      const expenses = await prisma.expense.findMany({
        where: { vehicleId: { in: vehicleIds } },
        select: {
          id: true,
          vehicleId: true,
          date: true,
          category: true,
          amount: true,
          description: true,
        },
      });

      expenses.forEach(expense => {
        const vehicle = vehicleMap.get(expense.vehicleId);
        if (vehicle) {
          events.push({
            id: `expense_${expense.id}`,
            type: 'expense',
            date: expense.date,
            title: HISTORY_EVENT_TITLES.expense,
            description: `${getExpenseCategoryName(expense.category)}${expense.description ? `: ${expense.description}` : ''}`,
            vehicleId: expense.vehicleId,
            vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
            status: 'completed',
            metadata: {
              expenseId: expense.id,
              category: expense.category,
              amount: expense.amount,
            },
          });
        }
      });
    }

    // Fetch SOS events
    if (!type || type === 'sos') {
      const sosEvents = await prisma.sosEvent.findMany({
        where: { vehicleId: { in: vehicleIds } },
        select: {
          id: true,
          vehicleId: true,
          createdAt: true,
          eventType: true,
          status: true,
          description: true,
          priority: true,
        },
      });

      sosEvents.forEach(sosEvent => {
        const vehicle = vehicleMap.get(sosEvent.vehicleId);
        if (vehicle) {
          events.push({
            id: `sos_${sosEvent.id}`,
            type: 'sos',
            date: sosEvent.createdAt,
            title: HISTORY_EVENT_TITLES.sos,
            description: `${getEventTypeName(sosEvent.eventType)}${sosEvent.description ? `: ${sosEvent.description}` : ''}`,
            vehicleId: sosEvent.vehicleId,
            vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
            status: sosEvent.status,
            metadata: {
              sosEventId: sosEvent.id,
              eventType: sosEvent.eventType,
              priority: sosEvent.priority,
            },
          });
        }
      });
    }

    // Sort by date descending (newest first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply limit
    const paginatedEvents = events.slice(0, limit);

    return jsonResponse({
      events: paginatedEvents,
      total: events.length,
      limit,
      vehicleCount: vehicleIds.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper functions use centralized translations
function getServiceTypeName(serviceType: string): string {
  return INSPECTION_TYPE_HEB[serviceType] || serviceType;
}

function getExpenseCategoryName(category: string): string {
  return EXPENSE_CATEGORY_HEB[category] || category;
}

function getEventTypeName(eventType: string): string {
  return SOS_TYPE_HEB[eventType] || eventType;
}
