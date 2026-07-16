import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, handleApiError, errorResponse } from '@/lib/api-helpers';

// GET  /api/saved-garages          → current user's saved directory garages (with details)
// POST /api/saved-garages          → save a garage  { garageDirectoryId }
// (DELETE lives in ./[garageDirectoryId]/route.ts)

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);

    const saved = await prisma.savedGarage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        garage: {
          select: {
            id: true,
            licenseNum: true,
            name: true,
            type: true,
            address: true,
            city: true,
            phone: true,
            categories: true,
          },
        },
      },
    });

    // flatten for the client
    const items = saved.map((s) => ({ ...s.garage, savedAt: s.createdAt }));
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);

    const body = await req.json().catch(() => null);
    const garageDirectoryId = Number(body?.garageDirectoryId);
    if (!garageDirectoryId || !Number.isInteger(garageDirectoryId)) {
      return errorResponse('garageDirectoryId חסר או לא תקין', 400);
    }

    // ensure the garage exists (avoids dangling FK errors surfacing as 500)
    const exists = await prisma.garageDirectory.findUnique({
      where: { id: garageDirectoryId },
      select: { id: true },
    });
    if (!exists) return errorResponse('מוסך לא נמצא', 404);

    // idempotent: unique on (userId, garageDirectoryId)
    const saved = await prisma.savedGarage.upsert({
      where: { userId_garageDirectoryId: { userId, garageDirectoryId } },
      create: { userId, garageDirectoryId },
      update: {},
      select: { id: true, garageDirectoryId: true, createdAt: true },
    });

    return NextResponse.json({ saved }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
