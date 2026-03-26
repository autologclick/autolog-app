import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';

// GET /api/garage/dashboard - Get garage dashboard stats
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
    });

    if (!garage) {
      return jsonResponse({ error: NOT_FOUND.GARAGE }, 404);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Parallel queries for stats
    const [
      inspectionsThisMonth,
      inspectionsLastMonth,
      pendingAppointments,
      todayAppointments,
      reviews,
      recentInspections,
      totalInspections,
      inspectionsWithScoreThisMonth,
      inspectionsWithCostThisMonth,
    ] = await Promise.all([
      // Inspections this month
      prisma.inspection.count({
        where: { garageId: garage.id, date: { gte: startOfMonth } },
      }),
      // Inspections last month
      prisma.inspection.count({
        where: { garageId: garage.id, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      // Pending appointments
      prisma.appointment.count({
        where: { garageId: garage.id, status: { in: ['pending', 'confirmed'] } },
      }),
      // Today's appointments
      prisma.appointment.findMany({
        where: {
          garageId: garage.id,
          date: { gte: startOfDay, lt: endOfDay },
        },
        include: {
          vehicle: { select: { nickname: true, licensePlate: true, manufacturer: true, model: true } },
          user: { select: { fullName: true, phone: true } },
        },
        orderBy: { date: 'asc' },
        take: 10,
      }),
      // Reviews stats
      prisma.garageReview.aggregate({
        where: { garageId: garage.id },
        _avg: { rating: true },
        _count: true,
      }),
      // Recent inspections
      prisma.inspection.findMany({
        where: { garageId: garage.id },
        include: {
          vehicle: {
            select: {
              nickname: true, licensePlate: true, manufacturer: true, model: true,
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 8,
      }),
      // Total inspections all time
      prisma.inspection.count({
        where: { garageId: garage.id },
      }),
      // Inspections with scores this month (for average calculation)
      prisma.inspection.findMany({
        where: { garageId: garage.id, date: { gte: startOfMonth }, overallScore: { not: null } },
        select: { overallScore: true },
      }),
      // Inspections with costs this month (for revenue calculation)
      prisma.inspection.findMany({
        where: { garageId: garage.id, date: { gte: startOfMonth }, cost: { not: null } },
        select: { cost: true },
      }),
    ]);

    // Calculate trend percentage
    const trend = inspectionsLastMonth > 0
      ? Math.round(((inspectionsThisMonth - inspectionsLastMonth) / inspectionsLastMonth) * 100)
      : inspectionsThisMonth > 0 ? 100 : 0;

    // Calculate revenue this month
    const revenueThisMonth = inspectionsWithCostThisMonth.reduce((sum, inspection) => {
      return sum + (inspection.cost || 0);
    }, 0);

    // Calculate average score this month
    const averageScore = inspectionsWithScoreThisMonth.length > 0
      ? Number((inspectionsWithScoreThisMonth.reduce((sum, inspection) => sum + (inspection.overallScore || 0), 0) / inspectionsWithScoreThisMonth.length).toFixed(1))
      : null;

    return jsonResponse({
      garage: {
        name: garage.name,
        city: garage.city,
        status: garage.isActive ? 'פעיל' : 'לא פעיל',
      },
      stats: {
        inspectionsThisMonth,
        inspectionsLastMonth,
        trend,
        pendingAppointments,
        averageRating: reviews._avg.rating ? Number(reviews._avg.rating.toFixed(1)) : null,
        totalReviews: reviews._count,
        totalInspections,
        revenueThisMonth,
        averageScore,
      },
      todayAppointments: todayAppointments.map(a => ({
        id: a.id,
        time: a.date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        customer: a.user.fullName,
        phone: a.user.phone,
        vehicle: a.vehicle
          ? `${a.vehicle.nickname || a.vehicle.manufacturer + ' ' + a.vehicle.model} (${a.vehicle.licensePlate})`
          : 'לא ידוע',
        service: a.serviceType,
        status: a.status,
      })),
      recentInspections: recentInspections.map(i => ({
        id: i.id,
        vehicle: i.vehicle
          ? `${i.vehicle.nickname || i.vehicle.manufacturer + ' ' + i.vehicle.model} (${i.vehicle.licensePlate})`
          : 'לא ידוע',
        customer: (i.vehicle as any)?.user?.fullName || i.customerName || 'לא ידוע',
        date: i.date.toISOString().split('T')[0],
        score: i.overallScore,
        status: i.status,
        type: i.inspectionType,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
