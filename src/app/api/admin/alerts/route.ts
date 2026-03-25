import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

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
      // Active SOS events
      prisma.sosEvent.findMany({
        where: { status: { in: ['active', 'open'] } },
        include: {
          user: { select: { fullName: true } },
          vehicle: { select: { licensePlate: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Vehicles with expiring test
      prisma.vehicle.findMany({
        where: {
          testExpiryDate: { lte: weekFromNow, gte: now },
        },
        select: { id: true, licensePlate: true, testExpiryDate: true },
      }),
      // Vehicles with expiring insurance
      prisma.vehicle.findMany({
        where: {
          insuranceExpiry: { lte: weekFromNow, gte: now },
        },
        select: { id: true, licensePlate: true, insuranceExpiry: true },
      }),
      // Recent new users (last 24h)
      prisma.user.findMany({
        where: { createdAt: { gte: dayAgo } },
        select: { id: true, fullName: true, createdAt: true, role: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Pending garage applications
      // GarageApplication model not yet implemented
      Promise.resolve([]),
      // Recent completed inspections (last 24h)
      prisma.inspection.findMany({
        where: {
          status: 'completed',
          date: { gte: dayAgo },
        },
        include: {
          vehicle: { select: { licensePlate: true, manufacturer: true, model: true } },
          garage: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      // Pending appointments
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

    // Build alerts array
    const alerts: any[] = [];

    // SOS alerts - highest priority
    activeSosEvents.forEach((sos: any) => {
      const typeMap: Record<string, string> = {
        accident: '×ª××× ×', breakdown: '×ª×§×× ××× ××ª', flat_tire: '×¦××× ×ª×§××¢',
        fuel: '×××§ × ×××¨', electrical: '××¢×× ××©××××ª', locked_out: '× ×¢××× ××¨××', other: '×××¨',
      };
      alerts.push({
        id: `sos-${sos.id}`,
        type: 'sos',
        priority: 'high',
        title: `×××¨××¢ SOS - ${typeMap[sos.eventType] || sos.eventType}`,
        message: `${sos.user?.fullName || '××©×ª××©'} ×××××${sos.location ? ` ×${sos.location}` : ''}`,
        time: sos.createdAt.toISOString(),
        read: false,
        link: '/admin/sos',
      });
    });

    // Test expiry alerts
    if (expiringTestVehicles.length > 0) {
      alerts.push({
        id: `test-expiry-batch`,
        type: 'expiry',
        priority: expiringTestVehicles.length >= 5 ? 'high' : 'medium',
        title: `××¡× ×¢××× ××¤×× - ${expiringTestVehicles.length} ×¨××××`,
        message: `${expiringTestVehicles.length} ×¨×××× ×¢× ××¡× ×©×¤× ×ª××§×£ ××©×××¢ ××§×¨××`,
        time: now.toISOString(),
        read: false,
        link: '/admin/documents',
      });
    }

    // Insurance expiry alerts
    if (expiringInsuranceVehicles.length > 0) {
      alerts.push({
        id: `insurance-expiry-batch`,
        type: 'expiry',
        priority: expiringInsuranceVehicles.length >= 5 ? 'high' : 'medium',
        title: `××××× ×¢××× ××¤×× - ${expiringInsuranceVehicles.length} ×¨××××`,
        message: `${expiringInsuranceVehicles.length} ×¨×××× ×¢× ××××× ×©×¤× ×ª××§×£ ××©×××¢ ××§×¨××`,
        time: now.toISOString(),
        read: false,
        link: '/admin/documents',
      });
    }

    // Pending applications
    pendingApplications.forEach((app: any) => {
      alerts.push({
        id: `app-${app.id}`,
        type: 'application',
        priority: 'medium',
        title: `××§×©×ª ××¦××¨×¤××ª ×××©× - ${app.garageName}`,
        message: `${app.ownerName} ××××© ××§×©× ××¦××¨××£ ×××¡×`,
        time: app.createdAt.toISOString(),
        read: false,
        link: '/admin/applications',
      });
    });

    // Recent inspections
    recentInspections.forEach((insp: any) => {
      alerts.push({
        id: `insp-${insp.id}`,
        type: 'inspection',
        priority: 'low',
        title: `××××§× ×××©×××`,
        message: `${insp.garage?.name || '×××¡×'} ×¡××× ××××§× ×-${insp.vehicle?.manufacturer} ${insp.vehicle?.model} (${insp.vehicle?.licensePlate})`,
        time: insp.date.toISOString(),
        read: true,
        link: `/admin/inspections/${insp.id}`,
      });
    });

    // New users
    recentUsers.forEach((user: any) => {
      const roleMap: Record<string, string> = { user: '××©×ª××©', admin: '×× ××', garage_owner: '××¢× ×××¡×' };
      alerts.push({
        id: `user-${user.id}`,
        type: 'user',
        priority: 'low',
        title: `${roleMap[user.role] || '××©×ª××©'} ×××© × ×¨×©×`,
        message: `${user.fullName} × ×¨×©×/× ×××¢×¨××ª`,
        time: user.createdAt.toISOString(),
        read: true,
        link: '/admin/users',
      });
    });

    // Pending appointments
    if (pendingAppointments.length > 0) {
      alerts.push({
        id: `pending-appt-batch`,
        type: 'appointment',
        priority: 'medium',
        title: `${pendingAppointments.length} ×ª××¨×× ×××ª×× ×× ××××©××¨`,
        message: `××©× × ${pendingAppointments.length} ×ª××¨×× ×©×¢×××× ×× ×××©×¨×`,
        time: now.toISOString(),
        read: false,
        link: '/admin/appointments',
      });
    }

    // Sort by priority and time
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    const unreadCount = alerts.filter(a => !a.read).length;

    return jsonResponse({ alerts, total: alerts.length, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
