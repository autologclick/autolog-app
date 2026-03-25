import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

// GET /api/admin/users/[id] - Get single user with vehicles, appointments, and SOS events
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(req);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        vehicles: {
          select: {
            id: true,
            nickname: true,
            manufacturer: true,
            model: true,
            year: true,
            licensePlate: true,
            testStatus: true,
            insuranceStatus: true,
          },
        },
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            serviceType: true,
            vehicle: {
              select: {
                nickname: true,
                licensePlate: true,
              },
            },
            garage: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        sosEvents: {
          select: {
            id: true,
            eventType: true,
            status: true,
            priority: true,
            createdAt: true,
            vehicle: {
              select: {
                nickname: true,
                licensePlate: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return jsonResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(req);

    const body = await req.json();
    const schema = z.object({
      fullName: z.string().min(2).max(100).optional(),
      phone: z.string().regex(/^[0-9\-+()\s]*$/).max(20).optional(),
      role: z.enum(['user', 'admin', 'garage_owner']).optional(),
      isActive: z.boolean().optional(),
    });
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return errorResponse('נתונים לא תקינים', 400);
    }
    const { fullName, phone, role, isActive } = validation.data;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return jsonResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
