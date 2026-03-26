import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError, getPaginationParams, paginationMeta, validationErrorResponse } from '@/lib/api-helpers';
import { vehicleSchema } from '@/lib/validations';
import { checkApiRateLimit } from '@/lib/rate-limit';

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
        return errorResponse('VIN זה כבר קיים במערכת', 409);
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
        testStatus: parseFlexDate(testExpiryDate) ? getDocStatus(parseFlexDate(testExpiryDate)!) : 'valid',
        insuranceStatus: parseFlexDate(insuranceExpiry) ? getDocStatus(parseFlexDate(insuranceExpiry)!) : 'valid',
      },
    });

    return jsonResponse({ vehicle, message: 'הרכב נוסף בהצלחה!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// Parse dates - support DD/MM/YYYY, YYYY-MM-DD, and ISO formats
function parseFlexDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const ddmm = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return new Date(Number(ddmm[3]), Number(ddmm[2]) - 1, Number(ddmm[1]));
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function getDocStatus(expiryDate: Date): string {
  const now = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays < 30) return 'expiring';
  return 'valid';
}
