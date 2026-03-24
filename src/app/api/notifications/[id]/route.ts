import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { z } from 'zod';

// PATCH /api/notifications/[id] - Mark single notification as read
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();

    const schema = z.object({
      isRead: z.boolean().optional(),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { isRead } = validation.data;

    // Verify notification exists and belongs to user
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return errorResponse('הודעה לא נמצאה', 404);
    if (notification.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: isRead !== undefined ? { isRead } : { isRead: true },
    });

    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Verify notification exists and belongs to user
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return errorResponse('הודעה לא נמצאה', 404);
    if (notification.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    // Delete notification
    await prisma.notification.delete({ where: { id } });

    return jsonResponse({ message: 'ההודעה נמחקה בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
