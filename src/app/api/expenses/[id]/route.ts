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
  requireOwnership,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { updateExpenseSchema } from '@/lib/validations';
import { NOT_FOUND } from '@/lib/messages';

// GET /api/expenses/[id] - Get single expense
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Rate limit API calls
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

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
      return errorResponse(NOT_FOUND.EXPENSE, 404);
    }

    requireOwnership(payload.userId, expense.vehicle.userId);

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
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

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
      return errorResponse(NOT_FOUND.EXPENSE, 404);
    }

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: expense.vehicleId },
      select: { userId: true },
    });

    if (!vehicle) {
      throw new AuthError(NOT_FOUND.VEHICLE, 404);
    }
    requireOwnership(payload.userId, vehicle.userId);

    // Build update data
    const updateData: Prisma.ExpenseUpdateInput = {};
    const data = validation.data;

    if (data.vehicleId !== undefined) {
      // If changing vehicle, verify new vehicle ownership
      const newVehicle = await prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
        select: { userId: true },
      });

      if (!newVehicle) {
        throw new AuthError(NOT_FOUND.VEHICLE, 404);
      }
      requireOwnership(payload.userId, newVehicle.userId);

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
        return errorResponse('×ª××¨×× ×× ×ª×§××', 400);
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
      message: '×××¦×× ×¢×××× × ×××¦×××',
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
    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    // Verify expense exists and belongs to user
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { vehicleId: true },
    });

    if (!expense) {
      return errorResponse(NOT_FOUND.EXPENSE, 404);
    }

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: expense.vehicleId },
      select: { userId: true },
    });

    if (!vehicle) {
      throw new AuthError(NOT_FOUND.VEHICLE, 404);
    }
    requireOwnership(payload.userId, vehicle.userId);

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return jsonResponse({ message: '×××¦×× × ×××§× ×××¦×××' });
  } catch (error) {
    return handleApiError(error);
  }
}
