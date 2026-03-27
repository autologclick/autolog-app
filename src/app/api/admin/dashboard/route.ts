import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';
import {
  TopGarageRow,
  RecentUserRow,
  RecentInspectionRow,
  RecentAppointmentRow,
  RecentSosEventRow,
  calculateTrend,
  mapTopGarages,
  mapRecentUsers,
  mapRecentInspections,
  buildRecentActivity,
} from '@/lib/services/dashboard-service';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const [
      totalUsers,
      totalVehicles,
      monthlyInspections,
      lastMonthInspections,
      openSos,
      pendingAppointments,
      recentUsers,
      recentInspections,
      recentAppointments,
      recentSosEvents,
      topGarages,
      monthlyRevenue,
      lastMonthRevenue,
      expiredDocuments,
      activeGarages,
      inactiveGarages,
      todayAppointments,
      weekAppointments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.inspection.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.inspection.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } }),
      prisma.sosEvent.count({ where: { status: { in: ['open', 'assigned'] } } }),
      prisma.appointment.count({ where: { status: 'pending' } }),
      prisma.user.findMany({
        select: { id: true, fullName: true, email: true, createdAt: true, _count: { select: { vehicles: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.inspection.findMany({
        include: { vehicle: { select: { nickname: true, licensePlate: true } }, garage: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.appointment.findMany({
        include: { user: { select: { fullName: true } }, garage: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.sosEvent.findMany({
        include: { user: { select: { fullName: true } }, vehicle: { select: { nickname: true, licensePlate: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.garage.findMany({
        select: {
          id: true, name: true, city: true, isActive: true,
          _count: { select: { inspections: true, reviews: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { inspections: { _count: 'desc' } },
        take: 5,
      }),
      prisma.inspection.aggregate({
        where: { createdAt: { gte: monthStart }, cost: { not: null } },
        _sum: { cost: true },
      }),
      prisma.inspection.aggregate({
        where: { createdAt: { gte: lastMonthStart, lt: monthStart }, cost: { not: null } },
        _sum: { cost: true },
      }),
      prisma.vehicle.count({
        where: {
          OR: [
            { testExpiryDate: { lt: now } },
            { insuranceExpiry: { lt: now } },
          ],
        },
      }),
      prisma.garage.count({ where: { isActive: true } }),
      prisma.garage.count({ where: { isActive: false } }),
      prisma.appointment.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { date: { gte: weekStart, lte: todayEnd } } }),
    ]);

    // GarageApplication model may not exist yet
    let garageApplications = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      garageApplications = await (prisma as Record<string, any>).garageApplication?.count({ where: { status: 'pending' } }) ?? 0;
    } catch (_) {
      // Model not in schema yet
    }

    // Use service layer for calculations and transformations
    const currentMonthRevenue = monthlyRevenue._sum.cost || 0;
    const previousMonthRevenue = lastMonthRevenue._sum.cost || 0;

    const typedUsers = recentUsers as RecentUserRow[];
    const typedInspections = recentInspections as RecentInspectionRow[];
    const typedAppointments = recentAppointments as RecentAppointmentRow[];
    const typedSosEvents = recentSosEvents as RecentSosEventRow[];

    return jsonResponse({
      stats: {
        totalUsers,
        totalVehicles,
        monthlyInspections,
        inspectionTrend: calculateTrend(monthlyInspections, lastMonthInspections),
        openSos,
        pendingAppointments,
        monthlyRevenue: currentMonthRevenue,
        revenueTrend: calculateTrend(currentMonthRevenue, previousMonthRevenue),
        expiredDocuments,
        activeGarages,
        inactiveGarages,
        todayAppointments,
        weekAppointments,
        garageApplications,
      },
      recentUsers: mapRecentUsers(typedUsers),
      recentInspections: mapRecentInspections(typedInspections),
      recentActivity: buildRecentActivity(typedUsers, typedInspections, typedAppointments, typedSosEvents),
      topGarages: mapTopGarages(topGarages as TopGarageRow[]),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
