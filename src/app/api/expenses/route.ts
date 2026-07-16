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
  enforceRateLimit,
} from '@/lib/api-helpers';
import { assertVehicleRecordAccess, getAccessibleVehicleIds } from '@/lib/vehicle-access';
import { expenseSchema } from '@/lib/validations';
import { isValidExpenseCategory, aggregateExpenses } from '@/lib/services/expense-service';
import { createDocumentFromExpense } from '@/lib/services/expense-document-sync';

// GET /api/expenses - List expenses for user's vehicles
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit general API calls
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId');
    const category = url.searchParams.get('category');
    const { page, skip, limit } = getPaginationParams(req);

    // Build query filters
    const whereFilters: Prisma.ExpenseWhereInput = {};

    // Owner and approved-share users are equal for a vehicle's records
    if (vehicleId) {
      await assertVehicleRecordAccess(payload.userId, vehicleId);
      whereFilters.vehicleId = vehicleId;
    } else {
      // Every vehicle the user can manage: owned + shared with them
      const accessibleIds = await getAccessibleVehicleIds(payload.userId);

      if (accessibleIds.length === 0) {
        return jsonResponse({
          expenses: [],
          total: 0,
          monthlySummary: [],
          categoryTotals: {},
        });
      }

      whereFilters.vehicleId = { in: accessibleIds };
    }

    // Add category filter if provided
    if (category) {
      if (!isValidExpenseCategory(category)) {
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
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();

    // Validate input with Zod
    const validation = expenseSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { vehicleId, category, amount, description, date, receiptUrl } =
      validation.data;

    // Owner or approved-share user may add records to this vehicle
    await assertVehicleRecordAccess(payload.userId, vehicleId);

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

    // Auto-create a linked Document if expense has a receipt image
    if (receiptUrl && receiptUrl.startsWith('data:image/')) {
      createDocumentFromExpense({
        expenseId: expense.id,
        vehicleId,
        category,
        amount,
        description,
        date: expenseDate,
        receiptUrl,
      }).catch(err => console.error('Expense→Document sync failed:', err));
    }

    return jsonResponse(
      { expense, message: 'הוצאה נוספה בהצלחה' },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
