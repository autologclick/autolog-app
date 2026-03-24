import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';

// GET /api/admin - Dashboard stats
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const [
      totalUsers,
      activeUsers,
      totalVehicles,
      totalGarages,
      activeGarages,
      totalInspections,
      inspectionsThisMonth,
      openSosEvents,
      totalSosEvents,
      pendingAppointments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.vehicle.count(),
      prisma.garage.count(),
      prisma.garage.count({ where: { isActive: true } }),
      prisma.inspection.count(),
      prisma.inspection.count({
        where: {
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.sosEvent.count({ where: { status: { in: ['open', 'assigned', 'in_progress'] } } }),
      prisma.sosEvent.count(),
      prisma.appointment.count({ where: { status: 'pending' } }),
    ]);

    // Expired documents count
    const expiredTests = await prisma.vehicle.count({ where: { testStatus: 'expired' } });
    const expiringTests = await prisma.vehicle.count({ where: { testStatus: 'expiring' } });

    return jsonResponse({
      stats: {
        totalUsers,
        activeUsers,
        totalVehicles,
        totalGarages,
        activeGarages,
        totalInspections,
        inspectionsThisMonth,
        openSosEvents,
        totalSosEvents,
        pendingAppointments,
        expiredTests,
        expiringTests,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
