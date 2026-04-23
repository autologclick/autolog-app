import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { sendPushToGarageOwner } from '@/lib/push-sender';
import { createNotification } from '@/lib/services/notification-service';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/bodywork — Create a new bodywork (פחחות) quote request
 */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const { vehicleId, description, images, damageArea, urgency, city, latitude, longitude } = body;

    if (!vehicleId || !description || !images || !Array.isArray(images) || images.length === 0) {
      return errorResponse('חסרים שדות חובה: רכב, תיאור ותמונות', 400);
    }

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: payload.userId },
    });
    if (!vehicle) {
      return errorResponse('הרכב לא נמצא', 404);
    }

    const request = await prisma.bodyworkRequest.create({
      data: {
        userId: payload.userId,
        vehicleId,
        description,
        images: JSON.stringify(images),
        damageArea: damageArea || null,
        urgency: urgency || 'normal',
        city: city || null,
        latitude: latitude || null,
        longitude: longitude || null,
      },
      include: {
        vehicle: { select: { nickname: true, manufacturer: true, model: true, year: true, licensePlate: true, color: true } },
      },
    });

    // ── Notify bodywork garages (async, non-blocking) ──
    const vehicleName = `${request.vehicle.manufacturer} ${request.vehicle.model}`;
    notifyBodyworkGarages(request.id, vehicleName, description, request.city).catch(() => {});

    return jsonResponse(request, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Find all garages offering bodywork and notify them via push + email + in-app notification
 */
async function notifyBodyworkGarages(requestId: string, vehicleName: string, description: string, city: string | null) {
  try {
    // Find garages that offer bodywork services
    const garages = await prisma.garage.findMany({
      where: {
        isActive: true,
        services: { not: null },
        ownerId: { not: null },
      },
      select: { id: true, ownerId: true, email: true, name: true, services: true, city: true },
    });

    const bodyworkGarages = garages.filter(g => {
      const services: string[] = g.services ? JSON.parse(g.services) : [];
      return services.some(s => s === 'bodywork' || s.includes('פחחות'));
    });

    // Optionally filter by city
    const relevantGarages = city
      ? bodyworkGarages.filter(g => g.city === city || !city)
      : bodyworkGarages;

    const shortDesc = description.length > 50 ? description.slice(0, 50) + '...' : description;

    for (const garage of relevantGarages) {
      if (!garage.ownerId) continue;

      // In-app notification
      createNotification({
        userId: garage.ownerId,
        type: 'bodywork_request',
        title: 'בקשת פחחות חדשה!',
        message: `${vehicleName} — ${shortDesc}`,
        link: '/garage/bodywork',
      }).catch(() => {});

      // Push notification
      sendPushToGarageOwner(garage.id, {
        title: 'בקשת פחחות חדשה!',
        body: `${vehicleName} — ${shortDesc}`,
        url: '/garage/bodywork',
      }).catch(() => {});

      // Email notification
      if (garage.email) {
        sendEmail({
          to: garage.email,
          subject: `בקשת פחחות חדשה — ${vehicleName}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px;">
              <h2 style="color: #1e3a5f;">בקשת פחחות חדשה ב-AutoLog</h2>
              <p><strong>רכב:</strong> ${vehicleName}</p>
              <p><strong>תיאור:</strong> ${description}</p>
              <br/>
              <a href="https://autolog.click/garage/bodywork"
                style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                צפה ושלח הצעת מחיר
              </a>
              <br/><br/>
              <p style="color: #999; font-size: 12px;">AutoLog — ניהול רכבים חכם</p>
            </div>
          `,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Failed to notify bodywork garages:', err);
  }
}

/**
 * GET /api/bodywork — List bodywork requests
 * For users: their own requests with quotes
 * For garage owners: open requests in their area
 * For admins: all requests
 */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const role = payload.role;

    let where: any = {};

    if (role === 'admin') {
      // Admin sees everything
      if (status) where.status = status;
    } else if (role === 'garage_owner') {
      // Garage owner sees open requests — only if they offer bodywork services
      const garage = await prisma.garage.findUnique({ where: { ownerId: payload.userId } });
      if (!garage) return errorResponse('מוסך לא נמצא', 404);

      // Check that this garage offers bodywork
      const services: string[] = garage.services ? JSON.parse(garage.services) : [];
      const hasBodywork = services.some(s => s === 'bodywork' || s.includes('פחחות'));
      if (!hasBodywork) {
        return errorResponse('המוסך שלך לא מציע שירותי פחחות. עדכן את השירותים בהגדרות.', 403);
      }

      where.status = status || 'open';
      // Show requests from the garage's city or without a city
      if (garage.city) {
        where.OR = [{ city: garage.city }, { city: null }];
      }
    } else {
      // Regular user sees only their own
      where.userId = payload.userId;
      if (status) where.status = status;
    }

    const requests = await prisma.bodyworkRequest.findMany({
      where,
      include: {
        user: { select: { fullName: true, phone: true, city: true } },
        vehicle: { select: { nickname: true, manufacturer: true, model: true, year: true, licensePlate: true, color: true } },
        quotes: {
          include: {
            garage: { select: { id: true, name: true, city: true, rating: true, reviewCount: true, phone: true, imageUrl: true } },
          },
          orderBy: { price: 'asc' },
        },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonResponse(requests);
  } catch (err) {
    return handleApiError(err);
  }
}
