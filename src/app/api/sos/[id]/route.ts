import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { sosEventUpdateSchema } from '@/lib/validations';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const event = await prisma.sosEvent.findUnique({
      where: { id: params.id },
      include: {
        vehicle: { select: { id: true, nickname: true, licensePlate: true, manufacturer: true, model: true, year: true } },
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });
    if (!event) return errorResponse('אירוע לא נמצא', 404);
    if (payload.role === 'user' && event.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }
    return jsonResponse({ event });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const validatedData = sosEventUpdateSchema.parse(body);
    const event = await prisma.sosEvent.findUnique({ where: { id: params.id } });
    if (!event) return errorResponse('אירוע לא נמצא', 404);
    if (payload.role === 'user' && event.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }
    const updateData: Prisma.SosEventUpdateInput = {};
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.priority) updateData.priority = validatedData.priority;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.status === 'resolved') updateData.resolvedAt = new Date();
    const updated = await prisma.sosEvent.update({
      where: { id: params.id },
      data: updateData,
      include: {
        vehicle: { select: { nickname: true, licensePlate: true, model: true } },
        user: { select: { fullName: true, phone: true } },
      },
    });
    return jsonResponse({ event: updated, message: 'אירוע עודכן בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
