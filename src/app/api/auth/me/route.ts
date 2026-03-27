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
        // New profile fields
        city: true, address: true, dateOfBirth: true,
        gender: true, preferredLanguage: true,
        emailVerified: true, phoneVerified: true,
        lastLoginAt: true, notificationPreferences: true,
        _count: { select: { vehicles: true, sosEvents: true, appointments: true } },
      },
    });

    if (!user) return jsonResponse({ error: 'משתמש לא נמצא' }, 404);

    // Parse JSON fields for cleaner response
    const parsed = {
      ...user,
      notificationPreferences: user.notificationPreferences
        ? JSON.parse(user.notificationPreferences)
        : { email: true, push: true, sms: false, whatsapp: false },
    };

    return jsonResponse({ user: parsed });
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

    const {
      fullName, phone, licenseNumber,
      city, address, dateOfBirth, gender,
      preferredLanguage, avatarUrl, notificationPreferences,
    } = validation.data;

    const updateData: Record<string, unknown> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber || null;
    if (city !== undefined) updateData.city = city || null;
    if (address !== undefined) updateData.address = address || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
    if (notificationPreferences !== undefined) {
      updateData.notificationPreferences = JSON.stringify(notificationPreferences);
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, licenseNumber: true, avatarUrl: true,
        city: true, address: true, dateOfBirth: true,
        gender: true, preferredLanguage: true,
        emailVerified: true, phoneVerified: true,
        notificationPreferences: true,
      },
    });

    return jsonResponse({ user, message: 'הפרופיל עודכן בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
