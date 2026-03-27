import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
  getPaginationParams,
  paginationMeta,
  requireOwnership,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { expenseSchema } from '@/lib/validations';
import { NOT_FOUND } from '@/lib/messages';
import { isValidExpenseCategory, aggregateExpenses } from '@/lib/services/expense-service';

// GET /api/expenses - List expenses for user's vehicles
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit general API calls
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId');
    const category = url.searchParams.get('category');
    const { page, skip, limit } = getPaginationParams(req);

    // Build query filters
    const whereFilters: Prisma.ExpenseWhereInput = {};

    // If vehicleId is provided, verify ownership
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { userId: true },
      });

      if (!vehicle) {
        return errorResponse(NOT_FOUND.VEHICLE, 404);
      }

      requireOwnership(payload.userId, vehicle.userId);

      whereFilters.vehicleId = vehicleId;
    } else {
      // Get all vehicles belonging to this user
      const userVehicles = await prisma.vehicle.findMany({
        where: { userId: payload.userId },
        select: { id: true },
      });

      if (userVehicles.length === 0) {
        return jsonResponse({
          expenses: [],
          total: 0,
          monthlySummary: [],
          categoryTotals: {},
        });
      }

      whereFilters.vehicleId = {
        in: userVehicles.map((v) => v.id),
      };
    }

    // Add category filter if provided
    if (category) {
      if (!isValidExpenseCategory(category)) {
        return errorResponse('ÃÂ§ÃÂÃÂÃÂÃÂ¨ÃÂÃÂ ÃÂÃÂ ÃÂªÃÂ§ÃÂÃÂ ÃÂ', 400);
      }
      whereFilters.category = category;
    }

    // Fetch expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: whereFilters,
        include: {
          vehicle: {
            select: {
              id: true,
              nickname: true,
              licensePlate: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where: whereFilters }),
    ]);

    // Aggregate monthly summary and category totals
    const allExpenses = await prisma.expense.findMany({
      where: whereFilters,
      select: { amount: true, date: true, category: true },
    });

    const { monthlySummary, categoryTotals } = aggregateExpenses(allExpenses);

    return jsonResponse({
      expenses,
      monthlySummary,
      categoryTotals,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/expenses - Create a new expense
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit API calls
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();

    // Validate input with Zod
    const validation = expenseSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { vehicleId, category, amount, description, date, receiptUrl } =
      validation.data;

    // Verify vehicle exists and belongs to user
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { userId: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    // Parse date
    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return errorResponse('ÃÂªÃÂÃÂ¨ÃÂÃÂ ÃÂÃÂ ÃÂªÃÂ§ÃÂÃÂ', 400);
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        category,
        amount,
        description: description || null,
        date: expenseDate,
        receiptUrl: receiptUrl || null,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            nickname: true,
            licensePlate: true,
          },
        },
      },
    });

    return jsonResponse(
      { expense, message: 'ÃÂÃÂÃÂ¦ÃÂÃÂ ÃÂ ÃÂÃÂ¡ÃÂ¤ÃÂ ÃÂÃÂÃÂ¦ÃÂÃÂÃÂ' },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
