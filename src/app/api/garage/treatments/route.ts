import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { createGarageTreatment, getGarageTreatments } from '@/lib/treatments-db';
import prisma from '@/lib/db';
import { NOT_FOUND, AUTH_ERRORS } from '@/lib/messages';
import { z } from 'zod';
import { updateVehicleMileage, MileageError } from '@/lib/mileage';
import { createNotification } from '@/lib/services/notification-service';
import { sendEmail, buildTreatmentEmailHtml } from '@/lib/email';
import { sendPushToUser } from '@/lib/push-sender';

const TREATMENT_TYPE_HEB: Record<string, string> = {
  maintenance: 'טיפול תקופתי',
  repair: 'תיקון',
  oil_change: 'החלפת שמן',
  tires: 'צמיגים',
  brakes: 'בלמים',
  electrical: 'חשמל',
  ac: 'מיזוג',
  bodywork: 'פחחות/צבע',
  other: 'אחר',
};

const garageTreatmentSchema = z.object({
  licensePlate: z.string().min(1),
  type: z.enum(['maintenance', 'repair', 'oil_change', 'tires', 'brakes', 'electrical', 'ac', 'bodywork', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  items: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  date: z.string().min(1),
  mechanicName: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

// GET /api/garage/treatments - Get treatments sent by this garage
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'garage_owner') {
      return errorResponse(AUTH_ERRORS.FORBIDDEN, 403);
    }

    const garage = await prisma.garage.findFirst({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    const treatments = await getGarageTreatments(garage.id);
    return jsonResponse({ treatments });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/garage/treatments - Send treatment to a vehicle owner
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'garage_owner') {
      return errorResponse(AUTH_ERRORS.FORBIDDEN, 403);
    }

    const body = await req.json();
    const validation = garageTreatmentSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || 'נתונים לא תקינים', 400);
    }

    const data = validation.data;

    // Find the garage
    const garage = await prisma.garage.findFirst({
      where: { ownerId: payload.userId },
      select: { id: true, name: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    // Find the vehicle by license plate
    const vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate as string },
      select: { id: true, userId: true, nickname: true, manufacturer: true, model: true, licensePlate: true },
    });

    if (!vehicle) {
      return errorResponse('רכב לא נמצא במערכת. הלקוח צריך להירשם תחילה.', 404);
    }

    // Validate and update mileage before creating the treatment
    if (data.mileage && data.mileage > 0) {
      try {
        await updateVehicleMileage(vehicle.id, data.mileage);
      } catch (e) {
        if (e instanceof MileageError) return errorResponse(e.message, e.status);
        throw e;
      }
    }

    const treatment = await createGarageTreatment({
      vehicleId: vehicle.id,
      userId: vehicle.userId,
      garageId: garage.id,
      garageName: garage.name,
      mechanicName: data.mechanicName as string | undefined,
      type: data.type,
      title: data.title,
      description: data.description,
      items: data.items,
      mileage: data.mileage,
      cost: data.cost,
      date: data.date,
      notes: data.notes,
    });

    // ──────────────────────────────────────────────────────────────
    // Notify the customer through 3 channels (best-effort, fire-and-forget)
    // We skip notifications if the vehicle is "garage-owned" — i.e., the
    // garage owner created the vehicle manually and there's no real customer.
    // ──────────────────────────────────────────────────────────────
    const isOwnedByGarage = vehicle.userId === payload.userId;

    if (!isOwnedByGarage) {
      const vehicleLabel = vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`;
      const typeLabel = TREATMENT_TYPE_HEB[data.type] || data.type;

      // 1. In-app notification
      createNotification({
        userId: vehicle.userId,
        type: 'system',
        title: 'טיפול חדש ממתין לאישורך',
        message: `${garage.name} שלח/ה ${typeLabel} — "${data.title}" לרכב ${vehicleLabel} (${vehicle.licensePlate}). לחיצה כאן לאישור.`,
        link: '/user/treatments',
      }).catch(() => {});

      // 2. Email + 3. Push — only if we can fetch the customer's contact details
      prisma.user
        .findUnique({ where: { id: vehicle.userId }, select: { email: true, fullName: true } })
        .then((customer) => {
          if (!customer) return;

          // Email (Resend)
          if (customer.email) {
            sendEmail({
              to: customer.email,
              subject: `AutoLog — טיפול חדש מ${garage.name} ממתין לאישור`,
              html: buildTreatmentEmailHtml({
                recipientName: customer.fullName || 'לקוח/ה',
                garageName: garage.name,
                vehicleLabel: `${vehicleLabel} (${vehicle.licensePlate})`,
                treatmentTitle: data.title,
                treatmentType: typeLabel,
                cost: data.cost,
                mileage: data.mileage,
                date: data.date,
                status: 'sent',
                description: data.description,
              }),
            }).catch(() => {});
          }

          // Web push
          sendPushToUser(vehicle.userId, {
            title: '🔧 טיפול חדש ממתין לאישור',
            body: `${garage.name}: ${data.title} — ${vehicleLabel}`,
            tag: `treatment-${treatment.id}-new`,
            requireInteraction: true,
            data: { link: '/user/treatments', type: 'treatment_new' },
          }).catch(() => {});
        })
        .catch(() => {});
    }

    return jsonResponse({ treatment, message: 'הטיפול נשלח ללקוח לאישור!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
