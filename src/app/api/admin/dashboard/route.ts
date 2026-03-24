import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';

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
      garageApplications = await (prisma as any).garageApplication.count({ where: { status: 'pending' } });
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
    const garagesWithRating = topGarages.map((g: any) => ({
      id: g.id,
      name: g.name,
      city: g.city || '',
      isActive: g.isActive,
      inspectionCount: g._count.inspections,
      reviewCount: g._count.reviews,
      avgRating: g.reviews.length > 0
        ? Number((g.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / g.reviews.length).toFixed(1))
        : 0,
    }));

    // Build unified recent activity feed (last 10 items)
    const recentActivity = [
      ...recentUsers.map((u: any) => ({
        id: u.id,
        type: 'user',
        title: u.fullName,
        description: 'משתמש חדש',
        timestamp: u.createdAt,
        meta: { email: u.email, vehicles: u._count.vehicles },
      })),
      ...recentInspections.map((i: any) => ({
        id: i.id,
        type: 'inspection',
        title: i.vehicle?.nickname || i.vehicle?.licensePlate || 'רכב',
        description: 'בדיקה חדשה',
        timestamp: i.createdAt,
        meta: { garage: i.garage?.name, score: i.overallScore, status: i.status },
      })),
      ...recentAppointments.map((a: any) => ({
        id: a.id,
        type: 'appointment',
        title: a.user?.fullName || 'משתמש',
        description: 'תור חדש',
        timestamp: a.createdAt,
        meta: { garage: a.garage?.name, date: a.date, status: a.status },
      })),
      ...recentSosEvents.map((s: any) => ({
        id: s.id,
        type: 'sos',
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
      recentUsers: recentUsers.map((u: any) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        vehicleCount: u._count.vehicles,
        createdAt: u.createdAt,
      })),
      recentInspections: recentInspections.map((i: any) => ({
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
