import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, requireAdmin, jsonResponse, errorResponse, handleApiError, getPaginationParams, validationErrorResponse } from '@/lib/api-helpers';
import { z } from 'zod';

// GET /api/notifications - List user's notifications
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { skip, limit } = getPaginationParams(req);
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const isRead = url.searchParams.get('isRead');

    const where: Prisma.NotificationWhereInput = { userId: payload.userId };

    if (type) where.type = type;
    if (isRead !== null) where.isRead = isRead === 'true';

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: payload.userId, isRead: false },
    });

    return jsonResponse({ notifications, total, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notifications - Create notification (admin/system use)
export async function POST(req: NextRequest) {
  try {
    const payload = requireAdmin(req);
    const body = await req.json();

    const schema = z.object({
      userId: z.string().min(1, 'userId נדרש'),
      type: z.enum(['test_expiry', 'insurance_expiry', 'appointment', 'sos', 'benefit', 'system']),
      title: z.string().min(1, 'כותרת נדרשת'),
      message: z.string().min(1, 'הודעה נדרשת'),
      link: z.string().optional(),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { userId, type, title, message, link } = validation.data;

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return errorResponse('משתמש לא נמצא', 404);

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    });

    return jsonResponse({ notification }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/notifications - Mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const schema = z.object({
      markAllRead: z.boolean().optional(),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { markAllRead } = validation.data;

    if (markAllRead) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return jsonResponse({ message: 'כל ההודעות סומנו כנקראו' });
    }

    return errorResponse('markAllRead נדרש', 400);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/notifications - Mark as read (deprecated, use PATCH /api/notifications/[id])
export async function PUT(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const schema = z.object({
      id: z.string().optional(),
      markAllRead: z.boolean().optional(),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { id, markAllRead } = validation.data;

    if (markAllRead) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return jsonResponse({ message: 'כל ההודעות סומנו כנקראו' });
    }

    if (id) {
      // Mark specific as read
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification) return errorResponse('הודעה לא נמצאה', 404);
      if (notification.userId !== payload.userId) {
        return errorResponse('אין הרשאה', 403);
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return jsonResponse(updated);
    }

    return errorResponse('id או markAllRead נדרשים', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
