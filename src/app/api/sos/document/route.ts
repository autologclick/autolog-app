import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { notifyAdmins } from '@/lib/services/notification-service';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
  validationErrorResponse,
  requireOwnershipOrAdmin,
} from '@/lib/api-helpers';

/**
 * POST /api/sos/document
 *
 * Create OR update the structured "incident documentation" attached to an SOS event.
 * The full report is stored as JSON in SosEvent.incidentData; photo URLs go in SosEvent.photos.
 *
 *  - If `eventId` is provided  → update that event (owner/admin only).
 *  - Otherwise                 → create a new SosEvent that carries the documentation.
 *
 * Everything in the report is optional except the incident category, because the
 * documentation is captured progressively at the scene and is frequently partial.
 */

const INCIDENT_TYPES = ['road_accident', 'hit_and_run', 'theft_vandalism', 'injury'] as const;

const involvedPartySchema = z
  .object({
    fullName: z.string().max(100).optional(),
    idNumber: z.string().max(20).optional(),
    phone: z.string().max(30).optional(),
    licensePlate: z.string().max(15).optional(),
    driverLicenseNumber: z.string().max(20).optional(),
    vehicleManufacturer: z.string().max(50).optional(),
    vehicleModel: z.string().max(50).optional(),
    vehicleColor: z.string().max(30).optional(),
    insuranceCompany: z.string().max(60).optional(),
    insurancePolicyNumber: z.string().max(40).optional(),
    isDriverOwner: z.boolean().optional(),
    ownerName: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .partial();

const witnessSchema = z
  .object({
    fullName: z.string().max(100).optional(),
    phone: z.string().max(30).optional(),
    notes: z.string().max(300).optional(),
  })
  .partial();

const incidentReportSchema = z
  .object({
    incidentType: z.enum(INCIDENT_TYPES),
    occurredAt: z.string().max(40).optional(),
    description: z.string().max(2000).optional(),
    hasInjuries: z.boolean().optional(),
    injuriesDetails: z.string().max(1000).optional(),
    ambulanceCalled: z.boolean().optional(),
    policeCalled: z.boolean().optional(),
    policeReportNumber: z.string().max(60).optional(),
    ownInsuranceCompany: z.string().max(60).optional(),
    ownInsurancePolicyNumber: z.string().max(40).optional(),
    involvedParties: z.array(involvedPartySchema).max(10).optional(),
    witnesses: z.array(witnessSchema).max(20).optional(),
    nearbyCameras: z.string().max(1000).optional(),
    stolenItems: z.string().max(1000).optional(),
    checklist: z.record(z.boolean()).optional(),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();

const bodySchema = z.object({
  eventId: z.string().optional(),
  vehicleId: z.string().optional(),
  location: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photos: z.array(z.string().url()).max(40).optional(),
  report: incidentReportSchema,
});

const EVENT_TYPE_BY_INCIDENT: Record<string, string> = {
  road_accident: 'accident',
  hit_and_run: 'accident',
  injury: 'accident',
  theft_vandalism: 'other',
};

const INCIDENT_LABEL: Record<string, string> = {
  road_accident: 'תאונת דרכים',
  hit_and_run: 'פגע וברח / רכב חונה',
  theft_vandalism: 'גניבה / פריצה / ונדליזם',
  injury: 'פגיעת גוף / נפגעים',
};

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const json = await req.json();

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { eventId, vehicleId, location, latitude, longitude, photos, report } = parsed.data;

    const incidentDataStr = JSON.stringify(report);
    const photosStr = photos && photos.length ? JSON.stringify(photos) : undefined;

    /* ───────── Update an existing event ───────── */
    if (eventId) {
      const existing = await prisma.sosEvent.findUnique({ where: { id: eventId } });
      if (!existing) return errorResponse('אירוע לא נמצא', 404);
      requireOwnershipOrAdmin(payload, existing.userId);

      const updated = await prisma.sosEvent.update({
        where: { id: eventId },
        data: {
          incidentData: incidentDataStr,
          ...(photosStr ? { photos: photosStr } : {}),
          ...(location ? { location } : {}),
          ...(latitude != null ? { latitude } : {}),
          ...(longitude != null ? { longitude } : {}),
        },
        include: { vehicle: { select: { nickname: true, licensePlate: true } } },
      });
      return jsonResponse({ event: updated, message: 'התיעוד נשמר בהצלחה' });
    }

    /* ───────── Create a new documentation event ───────── */
    let vehicle;
    if (vehicleId) {
      vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId: payload.userId } });
    } else {
      vehicle = await prisma.vehicle.findFirst({
        where: { userId: payload.userId },
        orderBy: { isPrimary: 'desc' },
      });
    }
    if (!vehicle) return errorResponse('רכב לא נמצא. יש להוסיף רכב תחילה.', 404);

    const event = await prisma.sosEvent.create({
      data: {
        userId: payload.userId,
        vehicleId: vehicle.id,
        eventType: EVENT_TYPE_BY_INCIDENT[report.incidentType] || 'other',
        description: report.description ? report.description.slice(0, 500) : null,
        location: location || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        status: 'open',
        priority: report.hasInjuries
          ? 'critical'
          : report.incidentType === 'road_accident'
            ? 'high'
            : 'medium',
        incidentData: incidentDataStr,
        ...(photosStr ? { photos: photosStr } : {}),
      },
      include: { vehicle: { select: { nickname: true, licensePlate: true } } },
    });

    await notifyAdmins(
      'sos',
      'תיעוד אירוע חדש',
      `${vehicle.nickname} (${vehicle.licensePlate}) — ${INCIDENT_LABEL[report.incidentType] || report.incidentType}`,
      `/admin/sos/${event.id}`,
    );

    return jsonResponse({ event, message: 'התיעוד נשמר בהצלחה' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

