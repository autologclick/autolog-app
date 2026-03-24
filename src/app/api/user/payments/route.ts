import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { checkApiRateLimit } from '@/lib/rate-limit';

interface Payment {
  id: string;
  date: string;
  garageName: string;
  serviceType: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  source: 'inspection' | 'appointment' | 'expense';
  vehicleNickname?: string;
  description?: string;
}

// GET /api/user/payments - Aggregate payment data from inspections, appointments, and expenses
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    // Get all user vehicles
    const userVehicles = await prisma.vehicle.findMany({
      where: { userId: payload.userId },
      select: { id: true, nickname: true },
    });

    if (userVehicles.length === 0) {
      return jsonResponse({
        totalThisMonth: 0,
        totalThisYear: 0,
        averageMonthlySpend: 0,
        payments: [],
      });
    }

    const vehicleIds = userVehicles.map(v => v.id);
    const vehicleNicknameMap = Object.fromEntries(userVehicles.map(v => [v.id, v.nickname]));
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Fetch all data sources in parallel
    const [inspections, appointments, expenses] = await Promise.all([
      // Get inspections with costs
      prisma.inspection.findMany({
        where: {
          vehicleId: { in: vehicleIds },
          cost: { not: null },
        },
        select: {
          id: true,
          date: true,
          cost: true,
          vehicleId: true,
          garage: {
            select: { name: true },
          },
          inspectionType: true,
        },
      }),

      // Get completed appointments with implicit costs (only completed ones)
      prisma.appointment.findMany({
        where: {
          userId: payload.userId,
          vehicleId: { in: vehicleIds },
          status: { in: ['completed', 'in_progress'] } as const,
        },
        select: {
          id: true,
          date: true,
          vehicleId: true,
          serviceType: true,
          status: true,
          notes: true,
          completionNotes: true,
          completedAt: true,
          garage: {
            select: { name: true },
          },
        },
      }),

      // Get expenses
      prisma.expense.findMany({
        where: {
          vehicleId: { in: vehicleIds },
        },
        select: {
          id: true,
          date: true,
          amount: true,
          category: true,
          description: true,
          vehicleId: true,
        },
      }),
    ]);

    const payments: Payment[] = [];

    // Process inspections
    inspections.forEach(inspection => {
      if (inspection.cost) {
        payments.push({
          id: `inspection-${inspection.id}`,
          date: inspection.date.toISOString().split('T')[0],
          garageName: inspection.garage.name,
          serviceType: inspection.inspectionType || 'inspection',
          amount: inspection.cost,
          currency: '₪',
          status: 'paid', // Inspections are typically paid
          source: 'inspection',
          vehicleNickname: vehicleNicknameMap[inspection.vehicleId],
          description: `בדיקה ${inspection.inspectionType || 'מלאה'}`,
        });
      }
    });

    // Process appointments
    // For appointments, we'll estimate a default cost or mark as pending
    appointments.forEach(appointment => {
      const estimatedCost = estimateAppointmentCost(appointment.serviceType);
      payments.push({
        id: `appointment-${appointment.id}`,
        date: (appointment.completedAt || appointment.date).toISOString().split('T')[0],
        garageName: appointment.garage.name,
        serviceType: appointment.serviceType,
        amount: estimatedCost,
        currency: '₪',
        status: appointment.status === 'completed' ? 'paid' : 'pending',
        source: 'appointment',
        vehicleNickname: vehicleNicknameMap[appointment.vehicleId],
        description: appointment.completionNotes || appointment.notes || 'שירות מוסך',
      });
    });

    // Process expenses
    expenses.forEach(expense => {
      payments.push({
        id: `expense-${expense.id}`,
        date: expense.date.toISOString().split('T')[0],
        garageName: 'הוצאה כללית',
        serviceType: expense.category,
        amount: expense.amount,
        currency: '₪',
        status: 'paid', // Expenses are already paid
        source: 'expense',
        vehicleNickname: vehicleNicknameMap[expense.vehicleId],
        description: expense.description || undefined,
      });
    });

    // Calculate summaries
    const totalThisMonth = payments
      .filter(p => {
        const paymentDate = new Date(p.date);
        return (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const totalThisYear = payments
      .filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate average monthly spend (last 12 months)
    const monthlySpends: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlySpends[monthKey] = payments
        .filter(p => p.date.startsWith(monthKey))
        .reduce((sum, payment) => sum + payment.amount, 0);
    }

    const monthsWithData = Object.values(monthlySpends).filter(v => v > 0).length || 1;
    const averageMonthlySpend = Object.values(monthlySpends).reduce((a, b) => a + b, 0) / Math.max(monthsWithData, 1);

    // Sort payments by date descending
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return jsonResponse({
      totalThisMonth,
      totalThisYear,
      averageMonthlySpend,
      payments,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to estimate appointment costs based on service type
function estimateAppointmentCost(serviceType: string): number {
  const costMap: Record<string, number> = {
    inspection: 350,
    maintenance: 450,
    repair: 600,
    test_prep: 280,
  };
  return costMap[serviceType] || 400; // Default 400₪ if unknown
}
