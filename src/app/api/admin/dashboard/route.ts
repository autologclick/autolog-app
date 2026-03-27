import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';

// =============================================
// Dashboard data types (replacing `any` usage)
// =============================================

interface TopGarageRow {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
  _count: { inspections: number; reviews: number };
  reviews: { rating: number }[];
}

interface RecentUserRow {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  _count: { vehicles: number };
}

interface RecentInspectionRow {
  id: string;
  createdAt: Date;
  overallScore: number | null;
  status: string;
  vehicle: { nickname: string; licensePlate: string } | null;
  garage: { name: string } | null;
}

interface RecentAppointmentRow {
  id: string;
  createdAt: Date;
  date: Date;
  status: string;
  user: { fullName: string } | null;
  garage: { name: string } | null;
}

interface RecentSosEventRow {
  id: string;
  createdAt: Date;
  status: string;
  user: { fullName: string } | null;
  vehicle: { nickname: string; licensePlate: string } | null;
}

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

    // GarageApplication model may not exist yet - safely default to 0
    let garageApplications = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- model may not exist in schema yet
      garageApplications = await (prisma as Record<string, any>).garageApplication?.count({ where: { status: 'pending' } }) ?? 0;
    } catch (_) {
      // Model not in schema yet
    }

    // Calculate trends
    const inspectionTrend = lastMonthInspections > 0
      ? Math.round(((monthlyInspections - lastMonthInspections) / lastMonthInspections) * 100)
      : 100;

    // Calculate revenue trend
    const currentMonthRevenue = monthlyRevenue._sum.cost || 0;
    const previousMonthRevenue = lastMonthRevenue._sum.cost || 0;
    const revenueTrend = previousMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : 100;

    // Calculate average rating for each garage
    const garagesWithRating = (topGarages as TopGarageRow[]).map((g) => ({
      id: g.id,
      name: g.name,
      city: g.city || '',
      isActive: g.isActive,
      inspectionCount: g._count.inspections,
      reviewCount: g._count.reviews,
      avgRating: g.reviews.length > 0
        ? Number((g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length).toFixed(1))
        : 0,
    }));

    // Build unified recent activity feed (last 10 items)
    const recentActivity = [
      ...(recentUsers as RecentUserRow[]).map((u) => ({
        id: u.id,
        type: 'user' as const,
        title: u.fullName,
        description: 'משתמש חדש',
        timestamp: u.createdAt,
        meta: { email: u.email, vehicles: u._count.vehicles },
      })),
      ...(recentInspections as RecentInspectionRow[]).map((i) => ({
        id: i.id,
        type: 'inspection' as const,
        title: i.vehicle?.nickname || i.vehicle?.licensePlate || 'רכב',
        description: 'בדיקה חדשה',
        timestamp: i.createdAt,
        meta: { garage: i.garage?.name, score: i.overallScore, status: i.status },
      })),
      ...(recentAppointments as RecentAppointmentRow[]).map((a) => ({
        id: a.id,
        type: 'appointment' as const,
        title: a.user?.fullName || 'משתמש',
        description: 'תור חדש',
        timestamp: a.createdAt,
        meta: { garage: a.garage?.name, date: a.date, status: a.status },
      })),
      ...(recentSosEvents as RecentSosEventRow[]).map((s) => ({
        id: s.id,
        type: 'sos' as const,
        title: s.user?.fullName || 'משתמש',
        description: 'אירוע SOS',
        timestamp: s.createdAt,
        meta: { vehicle: `${s.vehicle?.nickname || ''} (${s.vehicle?.licensePlate || ''})`, status: s.status },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return jsonResponse({
      stats: {
        totalUsers,
        totalVehicles,
        monthlyInspections,
        inspectionTrend,
        openSos,
        pendingAppointments,
        monthlyRevenue: currentMonthRevenue,
        revenueTrend,
        expiredDocuments,
        activeGarages,
        inactiveGarages,
        todayAppointments,
        weekAppointments,
        garageApplications,
      },
      recentUsers: (recentUsers as RecentUserRow[]).map((u) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        vehicleCount: u._count.vehicles,
        createdAt: u.createdAt,
      })),
      recentInspections: (recentInspections as RecentInspectionRow[]).map((i) => ({
        id: i.id,
        vehicle: `${i.vehicle?.nickname || ''} (${i.vehicle?.licensePlate || ''})`,
        garage: i.garage?.name || '',
        score: i.overallScore,
        status: i.status,
        date: i.createdAt,
      })),
      recentActivity,
      topGarages: garagesWithRating,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
