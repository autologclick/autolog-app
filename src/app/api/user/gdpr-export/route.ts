import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { logAuditEvent } from '@/lib/audit-log';

// GET /api/user/gdpr-export - Exports all data belonging to the caller as JSON.
// GDPR Art. 15 (right of access) + Art. 20 (data portability).
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const userId = payload.userId;

    const [
      user, vehicles, appointments, expenses, inspections,
      documents, treatments, notifications, sosEvents, reviews,
      redemptions, vehicleShares,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, fullName: true, phone: true, idNumber: true,
          licenseNumber: true, role: true, avatarUrl: true, city: true, address: true,
          dateOfBirth: true, gender: true, preferredLanguage: true,
          emailVerified: true, phoneVerified: true, lastLoginAt: true,
          createdAt: true, notificationPreferences: true,
        },
      }),
      prisma.vehicle.findMany({ where: { userId } }),
      prisma.appointment.findMany({ where: { userId } }),
      prisma.expense.findMany({ where: { vehicle: { userId } } }),
      prisma.inspection.findMany({ where: { vehicle: { userId } }, include: { items: true } }),
      prisma.document.findMany({ where: { vehicle: { userId } } }),
      prisma.treatment.findMany({ where: { vehicle: { userId } } }),
      prisma.notification.findMany({ where: { userId } }),
      prisma.sosEvent.findMany({ where: { userId } }),
      prisma.garageReview.findMany({ where: { userName: { contains: '' } } }).catch(() => []),
      prisma.benefitRedemption.findMany({ where: { userId } }).catch(() => []),
      prisma.vehicleShare.findMany({ where: { OR: [{ ownerId: userId }, { sharedWithUserId: userId }] } }).catch(() => []),
    ]);

    logAuditEvent('EXPORT', userId, 'user', userId, { req, metadata: { type: 'gdpr-export' } });

    const payloadOut = {
      generatedAt: new Date().toISOString(),
      user, vehicles, appointments, expenses, inspections, documents,
      treatments, notifications, sosEvents, reviews, redemptions, vehicleShares,
    };

    const res = jsonResponse(payloadOut);
    res.headers.set('Content-Disposition', `attachment; filename="autolog-export-${userId}.json"`);
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
