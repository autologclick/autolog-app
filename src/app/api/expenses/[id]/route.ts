import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { assertVehicleRecordAccess } from '@/lib/vehicle-access';
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
    const rateLimitError = await enforceRateLimit(payload.userId);
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

    await assertVehicleRecordAccess(payload.userId, expense.vehicle.id);

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
    const rateLimitError = await enforceRateLimit(payload.userId);
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

    // Owner or approved-share user may edit this vehicle's records
    await assertVehicleRecordAccess(payload.userId, expense.vehicleId);

    // Build update data
    const updateData: Prisma.ExpenseUpdateInput = {};
    const data = validation.data;

    if (data.vehicleId !== undefined) {
      // Moving the expense to another vehicle requires access to that one too
      await assertVehicleRecordAccess(payload.userId, data.vehicleId);

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

    // Sync linked Treatment cost so there's no duplication between views
    if (data.amount !== undefined) {
      const linked = await prisma.expense.findUnique({
        where: { id },
        select: { treatmentId: true },
      });
      if (linked?.treatmentId) {
        await prisma.treatment.update({
          where: { id: linked.treatmentId },
          data: { cost: data.amount },
        });
      }
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
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    // Verify expense exists and belongs to user
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { vehicleId: true },
    });

    if (!expense) {
      return errorResponse(NOT_FOUND.EXPENSE, 404);
    }

    // Owner or approved-share user may delete this vehicle's records
    await assertVehicleRecordAccess(payload.userId, expense.vehicleId);

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return jsonResponse({ message: 'הוצאה נמחקה בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
