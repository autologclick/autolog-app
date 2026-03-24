import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';

// GET /api/admin/users - List all users with vehicle count
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jsonResponse({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone || '',
        role: u.role,
        isActive: u.isActive,
        vehicleCount: u._count.vehicles,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
