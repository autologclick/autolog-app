import { NextRequest } from 'next/server';
import { requireAdmin, jsonResponse, handleApiError, getPaginationParams, paginationMeta } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    const category = searchParams.get('category');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const { page, skip, limit } = getPaginationParams(req);

    const where: Prisma.ExpenseWhereInput = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (category) {
      where.category = category;
    }

    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(from);
      }
      if (to) {
        where.date.lte = new Date(to);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            nickname: true,
            licensePlate: true,
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await prisma.expense.count({ where });

    const allExpenses = await prisma.expense.findMany({
      where,
      select: { amount: true, category: true },
    });

    const totalAmount = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const categoryBreakdown = allExpenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return jsonResponse({
      expenses,
      totalAmount,
      categoryBreakdown,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
