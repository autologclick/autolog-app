import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, handleApiError, errorResponse } from '@/lib/api-helpers';

// DELETE /api/saved-garages/[garageDirectoryId] → unsave a garage for the current user

export async function DELETE(
  req: NextRequest,
  { params }: { params: { garageDirectoryId: string } }
) {
  try {
    const { userId } = requireAuth(req);

    const garageDirectoryId = Number(params.garageDirectoryId);
    if (!garageDirectoryId || !Number.isInteger(garageDirectoryId)) {
      return errorResponse('garageDirectoryId לא תקין', 400);
    }

    await prisma.savedGarage.deleteMany({
      where: { userId, garageDirectoryId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
