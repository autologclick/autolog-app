import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAdmin, jsonResponse, handleApiError, getPaginationParams, paginationMeta, errorResponse } from '@/lib/api-helpers';
import { garageSchema } from '@/lib/validations';

// GET /api/admin/garages - List all garages (admin only)
export async function GET(req: NextRequest) {
  try {
    const payload = requireAdmin(req);
    const { page, skip, limit } = getPaginationParams(req);
    const url = new URL(req.url);
    const search = url.searchParams.get('search');

    const where: Prisma.GarageWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [garages, total] = await Promise.all([
      prisma.garage.findMany({
        where,
        include: {
          _count: { select: { appointments: true, inspections: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.garage.count({ where }),
    ]);

    return jsonResponse({ garages, ...paginationMeta(total, page, limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/admin/garages - Create a new garage (admin only)
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const body = await req.json();

    // Validate request body with Zod
    const validatedData = garageSchema.parse(body);
    const { name, city, address, phone, email, description } = validatedData;

    const garage = await prisma.garage.create({
      data: {
        name,
        city,
        address: address || null,
        phone: phone || null,
        email: email || null,
        description: description || null,
        isPartner: false,
        isActive: true,
      },
    });

    return jsonResponse({ garage }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
