import { NextRequest } from 'next/server';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: any = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.title = {
        contains: search,
      };
    }

    const documents = await prisma.document.findMany({
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
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.document.count({ where });

    return jsonResponse({
      documents,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
