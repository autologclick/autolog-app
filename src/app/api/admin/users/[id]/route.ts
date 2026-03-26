import { NextRequest } from 'next/server';
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
      return errorResponse('משתמש לא נמצא', 404);
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

    const data = await req.json();
    const { fullName, phone, role, isActive } = data;

    // Validate role
    if (role && !['user', 'admin', 'garage_owner'].includes(role)) {
      return errorResponse('תפקיד לא תקין', 400);
    }

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
