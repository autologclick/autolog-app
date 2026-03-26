import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError, getPaginationParams, paginationMeta, validationErrorResponse } from '@/lib/api-helpers';
import { vehicleSchema } from '@/lib/validations';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { parseFlexDate, getExpiryStatus } from '@/lib/utils';

// GET /api/vehicles - List user's vehicles
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit general API calls: 100 per minute per user
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    const { page, skip, limit } = getPaginationParams(req);

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where: { userId: payload.userId },
        include: {
          _count: { select: { inspections: true, sosEvents: true, expenses: true } },
          drivers: { where: { isActive: true } },
          inspections: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { id: true, overallScore: true, date: true, inspectionType: true },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where: { userId: payload.userId } }),
    ]);

    // Attach latest inspection score to each vehicle
    const vehiclesWithScore = vehicles.map(v => ({
      ...v,
      overallScore: v.inspections?.[0]?.overallScore ?? null,
      lastInspectionId: v.inspections?.[0]?.id ?? null,
      lastInspectionDate: v.inspections?.[0]?.date ?? null,
    }));

    return jsonResponse({ vehicles: vehiclesWithScore, ...paginationMeta(total, page, limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/vehicles - Add a new vehicle
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit API calls
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    const body = await req.json();

    // Validate input with Zod
    const validation = vehicleSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { nickname, manufacturer, model, year, licensePlate, color, vin, fuelType,
      testExpiryDate, insuranceExpiry, registrationDate, mileage } = validation.data;

    // Check plate uniqueness
    const existing = await prisma.vehicle.findUnique({ where: { licensePlate } });
    if (existing) {
      return errorResponse('מספר רישוי כבר קיים במערכת', 409);
    }

    // Check if VIN already exists (if provided)
    if (vin) {
      const existingVin = await prisma.vehicle.findUnique({ where: { vin } });
      if (existingVin) {
        return errorResponse('VIN הז כבר קיים במערכת', 409);
      }
    }

    // Check if user has no vehicles yet -> make primary
    const vehicleCount = await prisma.vehicle.count({ where: { userId: payload.userId } });

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: payload.userId,
        nickname,
        manufacturer,
        model,
        year,
        licensePlate,
        color: color || null,
        vin: vin || null,
        fuelType: fuelType || null,
        testExpiryDate: parseFlexDate(testExpiryDate),
        insuranceExpiry: parseFlexDate(insuranceExpiry),
        registrationDate: parseFlexDate(registrationDate),
        mileage: mileage || null,
        isPrimary: vehicleCount === 0,
        testStatus: parseFlexDate(testExpiryDate) ? getExpiryStatus(parseFlexDate(testExpiryDate)!) : 'valid',
        insuranceStatus: parseFlexDate(insuranceExpiry) ? getExpiryStatus(parseFlexDate(insuranceExpiry)!) : 'valid',
      },
    });

    return jsonResponse({ vehicle, message: 'הרכב נוסף בהצלחה!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// parseFlexDate and getExpiryStatus imported from @/lib/utils
