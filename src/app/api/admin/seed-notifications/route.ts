import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { assertSeedAllowed } from '@/lib/seed-guard';

// POST /api/admin/seed-notifications - Create sample notifications for demo user
export async function POST(req: NextRequest) {
  try {
    const blocked = assertSeedAllowed();
    if (blocked) return blocked;
    const payload = requireAdmin(req);

    // Get all users for seeding
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    if (users.length === 0) {
      return errorResponse('לא נמצאו משתמשים', 404);
    }

    const sampleNotifications = [
      {
        type: 'test_expiry' as const,
        title: 'טסט עומד לפוג',
        message: 'בדיקת ההמצאות של הרכב שלך תפוג בעוד 30 ימים. רצוי להזמין בדיקה מראש.',
      },
      {
        type: 'insurance_expiry' as const,
        title: 'ביטוח עומד לפוג',
        message: 'פוליסת הביטוח שלך תפוג בעוד 15 ימים. יש צורך לחדש את הביטוח כדי להישאר מכוסה.',
      },
      {
        type: 'appointment' as const,
        title: 'תור חדש',
        message: 'הזמנת תור בוצעה בהצלחה. התור שלך קבוע ליום ב\' בשעה 10:00 במוסך פרונט ראשון.',
      },
      {
        type: 'benefit' as const,
        title: 'הטבה חדשה זמינה',
        message: 'הטבה חדשה התווספה למקום שלך - הנחה של 20% על צמיגים אצל שותפי AutoLog.',
      },
      {
        type: 'system' as const,
        title: 'עדכון מערכת',
        message: 'AutoLog עודכנה לגרסה החדשה עם תכונות נוספות ותיקונים. בדוק את הגרסה החדשה!',
      },
      {
        type: 'sos' as const,
        title: 'SOS נשלח בהצלחה',
        message: 'קריאת ה-SOS שלך התקבלה. צוות השירות שלנו בדרך אליך. זמן הגעה משוער: 25 דקות.',
      },
    ];

    const notifications: any[] = [];

    // Create notifications for each user
    for (const user of users) {
      for (let i = 0; i < sampleNotifications.length; i++) {
        const sample = sampleNotifications[i];
        notifications.push({
          userId: user.id,
          type: sample.type,
          title: sample.title,
          message: sample.message,
          isRead: i > 2, // Mark some as read
          link: sample.type === 'appointment' ? '/user/book-garage' : undefined,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Stagger dates
        });
      }
    }

    // Create all notifications
    const created = await prisma.notification.createMany({
      data: notifications,
    });

    return jsonResponse({
      message: `${created.count} התראות לדוגמה נוצרו בהצלחה`,
      count: created.count,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
