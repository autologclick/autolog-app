import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';

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

    return jsonResponse(request, 201);
  } catch (err) {
    return handleApiError(err);
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
      if (!services.includes('bodywork')) {
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
