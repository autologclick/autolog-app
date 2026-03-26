import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { updateProfileSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, avatarUrl: true, licenseNumber: true,
        idNumber: true, isActive: true, createdAt: true,
        _count: { select: { vehicles: true, sosEvents: true, appointments: true } },
      },
    });

    if (!user) return jsonResponse({ error: 'משתמש לא נמצא' }, 404);

    return jsonResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    // Validate input with Zod
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { fullName, phone, licenseNumber } = validation.data;

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(licenseNumber && { licenseNumber }),
      },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, licenseNumber: true,
      },
    });

    return jsonResponse({ user, message: 'הפרופיל עודכן בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
