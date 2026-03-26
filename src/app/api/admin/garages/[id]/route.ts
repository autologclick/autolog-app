import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError, errorResponse } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';

// GET /api/admin/garages/[id] - Get single garage details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req);

    const garage = await prisma.garage.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
        _count: { select: { inspections: true, appointments: true, reviews: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 10 },
        appointments: { orderBy: { date: 'desc' }, take: 10, include: { vehicle: true, user: { select: { fullName: true } } } },
      },
    });

    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    return jsonResponse({ garage });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/admin/garages/[id] - Update garage
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req);
    const body = await req.json();

    const existing = await prisma.garage.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse(NOT_FOUND.GARAGE, 404);

    const { name, city, address, phone, email, description, isPartner, isActive } = body;

    const garage = await prisma.garage.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address: address || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(description !== undefined && { description: description || null }),
        ...(isPartner !== undefined && { isPartner }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return jsonResponse({ garage });
  } catch (error) {
    return handleApiError(error);
  }
}
