import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
  AuthError,
} from '@/lib/api-helpers';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { updateExpenseSchema } from '@/lib/validations';

// GET /api/expenses/[id] - Get single expense
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Rate limit API calls
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            userId: true,
            nickname: true,
            licensePlate: true,
          },
        },
      },
    });

    if (!expense) {
      return errorResponse('הוצאה לא נמצאה', 404);
    }

    // Verify ownership through vehicle
    if (expense.vehicle.userId !== payload.userId) {
      throw new AuthError('אין לך הרשאה לגשת להוצאה זו', 403);
    }

    return jsonResponse({ expense });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Rate limit API calls
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    const body = await req.json();

    // Validate input with Zod - allow partial updates
    const validation = updateExpenseSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    // Verify expense exists and belongs to user
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { vehicleId: true },
    });

    if (!expense) {
      return errorResponse('הוצאה לא נמצאה', 404);
    }

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: expense.vehicleId },
      select: { userId: true },
    });

    if (!vehicle || vehicle.userId !== payload.userId) {
      throw new AuthError('אין לך הרשאה לערוך הוצאה זו', 403);
    }

    // Build update data
    const updateData: any = {};
    const data = validation.data;

    if (data.vehicleId !== undefined) {
      // If changing vehicle, verify new vehicle ownership
      const newVehicle = await prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
        select: { userId: true },
      });

      if (!newVehicle || newVehicle.userId !== payload.userId) {
        throw new AuthError('אין לך הרשאה להשתמש בכלי רכב זה', 403);
      }

      updateData.vehicleId = data.vehicleId;
    }

    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.receiptUrl !== undefined)
      updateData.receiptUrl = data.receiptUrl || null;

    if (data.date !== undefined) {
      const expenseDate = new Date(data.date);
      if (isNaN(expenseDate.getTime())) {
        return errorResponse('תאריך לא תקין', 400);
      }
      updateData.date = expenseDate;
    }

    // Update expense
    const updated = await prisma.expense.update({
      where: { id },
      data: updateData,
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

    return jsonResponse({
      expense: updated,
      message: 'הוצאה עודכנה בהצלחה',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Rate limit API calls
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    // Verify expense exists and belongs to user
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { vehicleId: true },
    });

    if (!expense) {
      return errorResponse('הוצאה לא נמצאה', 404);
    }

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: expense.vehicleId },
      select: { userId: true },
    });

    if (!vehicle || vehicle.userId !== payload.userId) {
      throw new AuthError('אין לך הרשאה למחוק הוצאה זו', 403);
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return jsonResponse({ message: 'הוצאה נמחקה בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
