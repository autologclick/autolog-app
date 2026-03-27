import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, jsonResponse, errorResponse, handleApiError, requireOwnershipOrAdmin,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { analyzeExpenses } from '@/lib/ai-analysis';
import { NOT_FOUND } from '@/lib/messages';

// GET /api/ai/expense-analysis?vehicleId=xxx (optional - if omitted, analyzes all user expenses)
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId');

    const where: Prisma.ExpenseWhereInput = {};

    if (vehicleId) {
      // Verify ownership
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { userId: true },
      });

      if (!vehicle) {
        return errorResponse(NOT_FOUND.VEHICLE, 404);
      }

      requireOwnershipOrAdmin(payload, vehicle.userId);

      where.vehicleId = vehicleId;
    } else {
      // Get all user's vehicle IDs
      const userVehicles = await prisma.vehicle.findMany({
        where: { userId: payload.userId },
        select: { id: true },
      });
      where.vehicleId = { in: userVehicles.map(v => v.id) };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 200,
    });

    const expenseData = expenses.map(e => ({
      amount: e.amount,
      category: e.category,
      date: e.date.toISOString(),
      description: e.description || undefined,
    }));

    const analysis = analyzeExpenses(expenseData);

    return jsonResponse({ analysis });
  } catch (error) {
    return handleApiError(error);
  }
}
