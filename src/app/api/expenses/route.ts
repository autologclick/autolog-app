import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
  AuthError,
  getPaginationParams,
  paginationMeta,
  requireOwnership,
} from '@/lib/api-helpers';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { expenseSchema } from '@/lib/validations';
import { NOT_FOUND } from '@/lib/messages';

// GET /api/expenses - List expenses for user's vehicles
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit general API calls
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוג מאוחר יותר.', 429);
    }

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
      const validCategories = [
        'fuel',
        'maintenance',
        'insurance',
        'test',
        'parking',
        'fines',
        'other',
      ];
      if (!validCategories.includes(category)) {
        return errorResponse('קטגוריה לא תקינה', 400);
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

    // Calculate monthly summary
    const allExpenses = await prisma.expense.findMany({
      where: whereFilters,
      select: {
        amount: true,
        date: true,
        category: true,
      },
    });

    const monthlySummary: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};

    allExpenses.forEach((exp) => {
      // Monthly summary
      const monthKey = new Date(exp.date).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlySummary[monthKey]) {
        monthlySummary[monthKey] = 0;
      }
      monthlySummary[monthKey] += exp.amount;

      // Category totals
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = 0;
      }
      categoryTotals[exp.category] += exp.amount;
    });

    // Convert to sorted array for monthly summary
    const monthlySummaryArray = Object.entries(monthlySummary)
      .map(([month, total]) => ({
        month,
        total,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return jsonResponse({
      expenses,
      monthlySummary: monthlySummaryArray,
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
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

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
      return errorResponse('תאריך לא תקין', 400);
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
      { expense, message: 'הוצאה נוספה בהצלחה' },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
