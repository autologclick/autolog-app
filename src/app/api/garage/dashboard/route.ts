import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';
import {
  TodayAppointmentRow,
  RecentInspectionRow,
  calculateTrend,
  sumRevenue,
  averageInspectionScore,
  mapGarageInfo,
  mapTodayAppointments,
  mapRecentInspections,
} from '@/lib/services/garage-dashboard-service';

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
      prisma.inspection.count({
        where: { garageId: garage.id, date: { gte: startOfMonth } },
      }),
      prisma.inspection.count({
        where: { garageId: garage.id, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      prisma.appointment.count({
        where: { garageId: garage.id, status: { in: ['pending', 'confirmed'] } },
      }),
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
      prisma.garageReview.aggregate({
        where: { garageId: garage.id },
        _avg: { rating: true },
        _count: true,
      }),
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
      prisma.inspection.count({
        where: { garageId: garage.id },
      }),
      prisma.inspection.findMany({
        where: { garageId: garage.id, date: { gte: startOfMonth }, overallScore: { not: null } },
        select: { overallScore: true },
      }),
      prisma.inspection.findMany({
        where: { garageId: garage.id, date: { gte: startOfMonth }, cost: { not: null } },
        select: { cost: true },
      }),
    ]);

    return jsonResponse({
      garage: mapGarageInfo(garage),
      stats: {
        inspectionsThisMonth,
        inspectionsLastMonth,
        trend: calculateTrend(inspectionsThisMonth, inspectionsLastMonth),
        pendingAppointments,
        averageRating: reviews._avg.rating ? Number(reviews._avg.rating.toFixed(1)) : null,
        totalReviews: reviews._count,
        totalInspections,
        revenueThisMonth: sumRevenue(inspectionsWithCostThisMonth),
        averageScore: averageInspectionScore(inspectionsWithScoreThisMonth),
      },
      todayAppointments: mapTodayAppointments(todayAppointments as TodayAppointmentRow[]),
      recentInspections: mapRecentInspections(recentInspections as RecentInspectionRow[]),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
