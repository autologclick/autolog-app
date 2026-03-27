import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';
import {
  AdminAlert,
  buildSosAlerts,
  buildTestExpiryAlert,
  buildInsuranceExpiryAlert,
  buildApplicationAlerts,
  buildInspectionAlerts,
  buildUserAlerts,
  buildPendingAppointmentsAlert,
  sortAlertsByPriorityAndTime,
} from '@/lib/services/alert-service';

// GET /api/admin/alerts - Aggregate system alerts for admin
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch multiple data sources in parallel
    const [
      activeSosEvents,
      expiringTestVehicles,
      expiringInsuranceVehicles,
      recentUsers,
      pendingApplications,
      recentInspections,
      pendingAppointments,
    ] = await Promise.all([
      prisma.sosEvent.findMany({
        where: { status: { in: ['active', 'open'] } },
        include: {
          user: { select: { fullName: true } },
          vehicle: { select: { licensePlate: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.vehicle.findMany({
        where: { testExpiryDate: { lte: weekFromNow, gte: now } },
        select: { id: true, licensePlate: true, testExpiryDate: true },
      }),
      prisma.vehicle.findMany({
        where: { insuranceExpiry: { lte: weekFromNow, gte: now } },
        select: { id: true, licensePlate: true, insuranceExpiry: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: dayAgo } },
        select: { id: true, fullName: true, createdAt: true, role: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.garageApplication ? prisma.garageApplication.findMany({
        where: { status: 'pending' },
        select: { id: true, garageName: true, ownerName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).catch(() => []) : Promise.resolve([]),
      prisma.inspection.findMany({
        where: { status: 'completed', date: { gte: dayAgo } },
        include: {
          vehicle: { select: { licensePlate: true, manufacturer: true, model: true } },
          garage: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.appointment.findMany({
        where: { status: 'pending' },
        include: {
          vehicle: { select: { licensePlate: true } },
          garage: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Build typed alerts using the service layer
    const alerts: AdminAlert[] = [
      ...buildSosAlerts(activeSosEvents),
      ...buildApplicationAlerts(pendingApplications as any[]),
      ...buildInspectionAlerts(recentInspections),
      ...buildUserAlerts(recentUsers),
    ];

    const testExpiryAlert = buildTestExpiryAlert(expiringTestVehicles, now);
    if (testExpiryAlert) alerts.push(testExpiryAlert);

    const insuranceExpiryAlert = buildInsuranceExpiryAlert(expiringInsuranceVehicles, now);
    if (insuranceExpiryAlert) alerts.push(insuranceExpiryAlert);

    const appointmentAlert = buildPendingAppointmentsAlert(pendingAppointments, now);
    if (appointmentAlert) alerts.push(appointmentAlert);

    // Sort by priority then time
    sortAlertsByPriorityAndTime(alerts);

    const unreadCount = alerts.filter(a => !a.read).length;

    return jsonResponse({ alerts, total: alerts.length, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
