import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { analyzeVehicleHealth } from '@/lib/ai-analysis';

// GET /api/ai/vehicle-health?vehicleId=xxx
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId');

    if (!vehicleId) {
      return errorResponse('חסר מזהה רכב', 400);
    }

    // Fetch vehicle with all related data
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        inspections: {
          orderBy: { date: 'desc' },
          take: 5,
          include: { items: true },
        },
        appointments: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        expenses: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });

    if (!vehicle) {
      return errorResponse('רכב לא נמצא', 404);
    }

    // Verify ownership (unless admin)
    if (payload.role !== 'admin' && vehicle.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    // Prepare data for analysis
    const vehicleData = {
      id: vehicle.id,
      nickname: vehicle.nickname,
      manufacturer: vehicle.manufacturer || undefined,
      model: vehicle.model,
      year: vehicle.year || undefined,
      mileage: vehicle.mileage || undefined,
      fuelType: vehicle.fuelType || undefined,
      testExpiryDate: vehicle.testExpiryDate?.toISOString(),
      testStatus: vehicle.testStatus || undefined,
      insuranceExpiry: vehicle.insuranceExpiry?.toISOString(),
      insuranceStatus: vehicle.insuranceStatus || undefined,
      inspections: vehicle.inspections.map(i => ({
        id: i.id,
        date: i.date.toISOString(),
        overallScore: i.overallScore || undefined,
        status: i.status,
        inspectionType: i.inspectionType,
        items: i.items.map(item => ({
          status: item.status,
          category: item.category,
          itemName: item.itemName,
        })),
      })),
      appointments: vehicle.appointments.map(a => ({
        id: a.id,
        date: a.date.toISOString(),
        serviceType: a.serviceType,
        status: a.status,
      })),
      expenses: vehicle.expenses.map(e => ({
        id: e.id,
        amount: e.amount,
        category: e.category,
        date: e.date.toISOString(),
      })),
    };

    const report = analyzeVehicleHealth(vehicleData);

    return jsonResponse({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
