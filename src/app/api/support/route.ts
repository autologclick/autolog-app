import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { notifyAdmins } from '@/lib/services/notification-service';
import { z } from 'zod';

const supportSchema = z.object({
  topic: z.string().min(1, 'נושא חובה'),
  message: z.string().min(1, 'הודעה חובה').max(5000),
});

/**
 * POST /api/support — Submit a support ticket.
 * Creates a notification for all admins with the user's message.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const validation = supportSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || 'נתונים לא תקינים', 400);
    }

    const { topic, message } = validation.data;

    // Get user info for the notification
    const prisma = (await import('@/lib/db')).default;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { fullName: true, email: true, phone: true },
    });

    const userName = user?.fullName || 'משתמש';
    const userContact = user?.email || user?.phone || '';

    // Generate a simple ticket number
    const ticketNumber = Date.now().toString(36).toUpperCase().slice(-6);

    // Notify all admins
    await notifyAdmins(
      'system',
      `פנייה חדשה: ${topic}`,
      `מאת: ${userName} (${userContact})\n\n${message}\n\nמספר פנייה: #${ticketNumber}`,
      '/admin/users'
    );

    return jsonResponse({
      success: true,
      ticketNumber,
      message: 'הפנייה נשלחה בהצלחה! נחזור אליך בהקדם.',
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
