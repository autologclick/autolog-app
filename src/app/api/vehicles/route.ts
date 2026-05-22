import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError, getPaginationParams, paginationMeta, validationErrorResponse,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { vehicleSchema } from '@/lib/validations';
import { parseFlexDate, getExpiryStatus } from '@/lib/utils';
import { normalizeManufacturer, friendlyModel } from '@/lib/vehicle-names';

/**
 * Convert raw MOT codes ("מיצובישי תאילנד" + "XTA03") to the friendly
 * commercial names users actually recognize ("מיצובישי" + "ספייס סטאר").
 * Applied on every response so existing rows in the DB are presented
 * cleanly without a schema migration.
 *
 * Also fixes auto-generated nicknames — if `nickname` looks like the
 * raw "${manufacturer} ${model}" concatenation (the default the wizard
 * sets at signup), we rebuild it with friendly names. User-customized
 * nicknames (anything else) are left untouched out of respect.
 *
 * If the model code can't be translated (not in our mapping yet),
 * friendlyModel returns '' rather than the ugly MOT code — the
 * manufacturer + year + plate are enough to identify the vehicle.
 */
function withFriendlyNames<T extends { manufacturer?: string | null; model?: string | null; nickname?: string | null }>(v: T): T {
  if (!v) return v;
  const rawMfr = v.manufacturer || '';
  const rawModel = v.model || '';
  const mfr = rawMfr ? normalizeManufacturer(rawMfr) : rawMfr;
  const model = rawModel && rawMfr ? friendlyModel(rawModel, rawMfr) : rawModel;

  // Detect auto-generated nicknames so we can update them. We compare against
  // both the raw and the normalized forms because the wizard might have used
  // either at the time of creation.
  let nickname = v.nickname;
  if (nickname) {
    const trimmed = nickname.trim();
    const autoCandidates = [
      `${rawMfr} ${rawModel}`.trim(),
      `${mfr} ${rawModel}`.trim(),
      `${rawMfr} ${model}`.trim(),
    ];
    if (autoCandidates.includes(trimmed)) {
      // It's an auto-generated nickname → regenerate with friendly names
      nickname = `${mfr} ${model}`.trim() || mfr || rawMfr;
    }
  }

  return { ...v, manufacturer: mfr, model, nickname };
}

// GET /api/vehicles - List user's vehicles (owned + shared)
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit general API calls: 100 per minute per user
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const { page, skip, limit } = getPaginationParams(req);

    const vehicleInclude = {
      _count: { select: { inspections: true, sosEvents: true, expenses: true } },
      drivers: { where: { isActive: true } },
      inspections: {
        orderBy: { date: 'desc' as const },
        take: 1,
        select: { id: true, overallScore: true, date: true, inspectionType: true },
      },
    };

    // Fetch owned vehicles
    const [ownedVehicles, ownedTotal] = await Promise.all([
      prisma.vehicle.findMany({
        where: { userId: payload.userId },
        include: vehicleInclude,
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where: { userId: payload.userId } }),
    ]);

    // Fetch shared vehicles (approved shares only)
    const sharedRecords = await prisma.vehicleShare.findMany({
      where: { sharedWithUserId: payload.userId, status: 'approved' },
      include: {
        vehicle: { include: vehicleInclude },
        owner: { select: { fullName: true } },
      },
    });

    // Combine: owned vehicles first, then shared
    const ownedWithMeta = ownedVehicles.map(v => ({
      ...v,
      overallScore: v.inspections?.[0]?.overallScore ?? null,
      lastInspectionId: v.inspections?.[0]?.id ?? null,
      lastInspectionDate: v.inspections?.[0]?.date ?? null,
      isShared: false,
      ownerName: null as string | null,
    }));

    const sharedWithMeta = sharedRecords.map(sr => ({
      ...sr.vehicle,
      overallScore: sr.vehicle.inspections?.[0]?.overallScore ?? null,
      lastInspectionId: sr.vehicle.inspections?.[0]?.id ?? null,
      lastInspectionDate: sr.vehicle.inspections?.[0]?.date ?? null,
      isShared: true,
      ownerName: sr.owner.fullName,
    }));

    const vehicles = [...ownedWithMeta, ...sharedWithMeta].map(withFriendlyNames);
    const total = ownedTotal + sharedRecords.length;

    return jsonResponse({ vehicles, ...paginationMeta(total, page, limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/vehicles - Add a new vehicle
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit API calls
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();

    // Validate input with Zod
    const validation = vehicleSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { nickname, manufacturer, model, year, licensePlate, color, vin, fuelType,
      testExpiryDate, insuranceExpiry, registrationDate, mileage } = validation.data;

    // Check plate uniqueness
    const existing = await prisma.vehicle.findUnique({
      where: { licensePlate },
      select: { id: true, userId: true, nickname: true, licensePlate: true },
    });
    if (existing) {
      // If the user already has this vehicle (owns or shared), block duplicate
      if (existing.userId === payload.userId) {
        return errorResponse('רכב זה כבר רשום אצלך', 409);
      }
      // Vehicle belongs to someone else — offer share request option
      return jsonResponse({
        error: 'מספר רישוי כבר קיים במערכת',
        canRequestShare: true,
        vehiclePlate: existing.licensePlate,
      }, 409);
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
        mileage: mileage,
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
