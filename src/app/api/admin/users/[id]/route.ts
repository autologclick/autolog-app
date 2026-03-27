import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, errorResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';

const updateUserSchema = z.object({
  fullName: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100).optional(),
  phone: z.string().regex(/^[\d\-+() ]{7,20}$/, 'מספר טלפון לא תקין').optional(),
  role: z.enum(['user', 'admin', 'garage_owner'], { errorMap: () => ({ message: 'תפקיד לא תקין' }) }).optional(),
  isActive: z.boolean().optional(),
});

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
      return errorResponse(NOT_FOUND.USER, 404);
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

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: validation.data,
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
