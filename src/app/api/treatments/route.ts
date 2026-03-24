import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { getUserTreatments, createTreatment, getPendingTreatments } from '@/lib/treatments-db';
import { z } from 'zod';

const createTreatmentSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(['maintenance', 'repair', 'oil_change', 'tires', 'brakes', 'electrical', 'ac', 'bodywork', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  items: z.string().optional(), // JSON array
  mileage: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  date: z.string().min(1),
  garageName: z.string().max(200).optional(),
  mechanicName: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

// GET /api/treatments - Get user's treatments
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const vehicleId = req.nextUrl.searchParams.get('vehicleId') || undefined;
    const pending = req.nextUrl.searchParams.get('pending');

    if (pending === 'true') {
      const treatments = await getPendingTreatments(payload.userId);
      return jsonResponse({ treatments });
    }

    const treatments = await getUserTreatments(payload.userId, vehicleId);
    return jsonResponse({ treatments });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/treatments - Create a treatment (user self-report)
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const validation = createTreatmentSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || 'נתונים לא תקינים', 400);
    }

    const data = validation.data;

    // Verify vehicle belongs to user
    const vehicle = await (await import('@/lib/db')).default.vehicle.findFirst({
      where: { id: data.vehicleId, userId: payload.userId },
      select: { id: true },
    });

    if (!vehicle) {
      return errorResponse('רכב לא נמצא', 404);
    }

    const treatment = await createTreatment({
      ...data,
      userId: payload.userId,
    });

    return jsonResponse({ treatment, message: 'הטיפול נוסף בהצלחה!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
