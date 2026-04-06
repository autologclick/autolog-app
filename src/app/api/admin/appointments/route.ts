import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError, getPaginationParams, paginationMeta } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const url = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(req);

    // Filters
    const status = url.searchParams.get('status') || undefined;
    const garageId = url.searchParams.get('garageId') || undefined;
    const serviceType = url.searchParams.get('serviceType') || undefined;
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search') || undefined;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (garageId) where.garageId = garageId;
    if (serviceType) where.serviceType = serviceType;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { garage: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { licensePlate: { contains: search } } },
      ];
    }

    // Fetch appointments with relations
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          garage: { select: { id: true, name: true, city: true, phone: true } },
          vehicle: { select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true, year: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    // Aggregate stats for the dashboard cards
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAll,
      pendingCount,
      confirmedCount,
      completedCount,
      rejectedCount,
      cancelledCount,
      inProgressCount,
      thisMonthCount,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'pending' } }),
      prisma.appointment.count({ where: { status: 'confirmed' } }),
      prisma.appointment.count({ where: { status: 'completed' } }),
      prisma.appointment.count({ where: { status: 'rejected' } }),
      prisma.appointment.count({ where: { status: 'cancelled' } }),
      prisma.appointment.count({ where: { status: 'in_progress' } }),
      prisma.appointment.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    // Garage performance stats
    const garageStats = await prisma.appointment.groupBy({
      by: ['garageId'],
      _count: { id: true },
      where: { createdAt: { gte: monthStart } },
    });

    // Fetch garage names for performance data
    const garageIds = garageStats.map(g => g.garageId);
    const garages = garageIds.length > 0
      ? await prisma.garage.findMany({
          where: { id: { in: garageIds } },
          select: { id: true, name: true, city: true },
        })
      : [];

    // Per-garage breakdown with status counts
    const garagePerformance = garageIds.length > 0
      ? await prisma.appointment.groupBy({
          by: ['garageId', 'status'],
          _count: { id: true },
        })
      : [];

    // Build garage performance map
    const garageMap = new Map(garages.map(g => [g.id, g]));
    const perfMap = new Map<string, { total: number; confirmed: number; completed: number; rejected: number; pending: number }>();

    for (const row of garagePerformance) {
      if (!perfMap.has(row.garageId)) {
        perfMap.set(row.garageId, { total: 0, confirmed: 0, completed: 0, rejected: 0, pending: 0 });
      }
      const entry = perfMap.get(row.garageId)!;
      entry.total += row._count.id;
      if (row.status === 'confirmed') entry.confirmed += row._count.id;
      if (row.status === 'completed') entry.completed += row._count.id;
      if (row.status === 'rejected') entry.rejected += row._count.id;
      if (row.status === 'pending') entry.pending += row._count.id;
    }

    const garagePerformanceData = Array.from(perfMap.entries())
      .map(([gId, stats]) => {
        const garage = garageMap.get(gId);
        const responded = stats.confirmed + stats.completed + stats.rejected;
        return {
          garageId: gId,
          garageName: garage?.name || 'לא ידוע',
          garageCity: garage?.city || '',
          totalAppointments: stats.total,
          confirmed: stats.confirmed,
          completed: stats.completed,
          rejected: stats.rejected,
          pending: stats.pending,
          approvalRate: stats.total > 0 ? Math.round(((stats.confirmed + stats.completed) / stats.total) * 100) : 0,
          completionRate: responded > 0 ? Math.round((stats.completed / responded) * 100) : 0,
        };
      })
      .sort((a, b) => b.totalAppointments - a.totalAppointments);

    return jsonResponse({
      appointments,
      stats: {
        total: totalAll,
        pending: pendingCount,
        confirmed: confirmedCount,
        completed: completedCount,
        rejected: rejectedCount,
        cancelled: cancelledCount,
        inProgress: inProgressCount,
        thisMonth: thisMonthCount,
      },
      garagePerformance: garagePerformanceData,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
