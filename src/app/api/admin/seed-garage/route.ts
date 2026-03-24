import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';

// GET /api/admin/seed-garage - Create/update demo garages with full data
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const garageOwner = await prisma.user.findFirst({
      where: { email: 'garage@autolog.co.il' },
    });
    if (!garageOwner) {
      return jsonResponse({ error: 'משתמש מוסך לא נמצא' }, 404);
    }

    // Update or create main garage
    const garage = await prisma.garage.upsert({
      where: { ownerId: garageOwner.id },
      update: {
        name: 'פרונט ראשון - מוסך מורשה',
        address: 'רחוב הרצל 45',
        city: 'תל אביב',
        phone: '03-555-1234',
        email: 'front1@garage.co.il',
        description: 'מוסך מורשה לכל סוגי הרכבים. מתמחים בטיפולים שוטפים, תיקוני מנוע, בדיקות טכניות, חשמל רכב, פחחות וצבע. ניסיון של מעל 15 שנה.',
        rating: 4.7,
        reviewCount: 5,
        services: JSON.stringify(['טיפול שוטף','בדיקה שנתית (טסט)','תיקון מנוע','בלמים','מתלים','חשמל רכב','מיזוג אוויר','פחחות וצבע','צמיגים']),
        workingHours: JSON.stringify({sunday:'08:00-18:00',monday:'08:00-18:00',tuesday:'08:00-18:00',wednesday:'08:00-18:00',thursday:'08:00-18:00',friday:'08:00-13:00',saturday:'סגור'}),
        isActive: true,
        isPartner: true,
      },
      create: {
        ownerId: garageOwner.id,
        name: 'פרונט ראשון - מוסך מורשה',
        address: 'רחוב הרצל 45',
        city: 'תל אביב',
        phone: '03-555-1234',
        email: 'front1@garage.co.il',
        description: 'מוסך מורשה לכל סוגי הרכבים. מתמחים בטיפולים שוטפים, תיקוני מנוע, בדיקות טכניות, חשמל רכב, פחחות וצבע. ניסיון של מעל 15 שנה.',
        rating: 4.7,
        reviewCount: 5,
        services: JSON.stringify(['טיפול שוטף','בדיקה שנתית (טסט)','תיקון מנוע','בלמים','מתלים','חשמל רכב','מיזוג אוויר','פחחות וצבע','צמיגים']),
        workingHours: JSON.stringify({sunday:'08:00-18:00',monday:'08:00-18:00',tuesday:'08:00-18:00',wednesday:'08:00-18:00',thursday:'08:00-18:00',friday:'08:00-13:00',saturday:'סגור'}),
        isActive: true,
        isPartner: true,
      },
    });

    // Create additional garages if they don't exist
    const garageCount = await prisma.garage.count();
    let g2id = '', g3id = '';

    if (garageCount < 3) {
      const g2 = await prisma.garage.create({
        data: {
          name: 'אוטו פלוס - מרכז שירות',
          address: 'שדרות רוטשילד 12',
          city: 'ראשון לציון',
          phone: '03-666-5678',
          email: 'autoplus@garage.co.il',
          description: 'מרכז שירות מתקדם לכל סוגי הרכבים. דיאגנוסטיקה ממוחשבת.',
          rating: 4.3,
          reviewCount: 3,
          services: JSON.stringify(['טיפול שוטף','בדיקה שנתית (טסט)','דיאגנוסטיקה','תיקון מנוע','בלמים']),
          workingHours: JSON.stringify({sunday:'07:30-17:30',monday:'07:30-17:30',tuesday:'07:30-17:30',wednesday:'07:30-17:30',thursday:'07:30-17:30',friday:'07:30-12:00',saturday:'סגור'}),
          isActive: true,
          isPartner: false,
        },
      });
      g2id = g2.id;

      const g3 = await prisma.garage.create({
        data: {
          name: 'טופ מוטורס',
          address: "רחוב ז'בוטינסקי 88",
          city: 'חיפה',
          phone: '04-777-9012',
          email: 'top@motors.co.il',
          description: 'מוסך מומחה לרכבי יבוא. BMW, Mercedes, Audi.',
          rating: 4.5,
          reviewCount: 2,
          services: JSON.stringify(['טיפול שוטף','בדיקה שנתית (טסט)','מנוע','גיר','חשמל','מתלים','פחחות']),
          workingHours: JSON.stringify({sunday:'08:00-17:00',monday:'08:00-17:00',tuesday:'08:00-17:00',wednesday:'08:00-17:00',thursday:'08:00-17:00',friday:'08:00-12:30',saturday:'סגור'}),
          isActive: true,
          isPartner: true,
        },
      });
      g3id = g3.id;
    }

    // Add reviews if none exist for main garage
    const existingReviews = await prisma.garageReview.count({ where: { garageId: garage.id } });
    if (existingReviews === 0) {
      const reviewsData = [
        { garageId: garage.id, userName: 'רועי כהן', rating: 5, comment: 'שירות מעולה! מחירים הוגנים ועבודה מקצועית. ממליץ בחום!' },
        { garageId: garage.id, userName: 'מיכל לוי', rating: 5, comment: 'המוסך הכי אמין שהייתי בו. לא דוחפים עבודות מיותרות.' },
        { garageId: garage.id, userName: 'דוד אברהם', rating: 4, comment: 'עבודה טובה מאוד, קצת המתנה אבל שווה.' },
        { garageId: garage.id, userName: 'שרה מזרחי', rating: 5, comment: 'עשו לי טסט תוך שעה! שירות מהיר ויעיל.' },
        { garageId: garage.id, userName: 'יוסי גולד', rating: 4, comment: 'מקצועי עם ציוד מתקדם. איכות מעולה.' },
      ];
      for (const r of reviewsData) {
        await prisma.garageReview.create({ data: r });
      }
    }

    // Add demo appointments
    const user = await prisma.user.findFirst({ where: { email: 'philip@autolog.co.il' } });
    let appointmentsCreated = 0;
    if (user) {
      const existingAppts = await prisma.appointment.count({ where: { userId: user.id } });
      if (existingAppts === 0) {
        const vehicle = await prisma.vehicle.findFirst({ where: { userId: user.id }, orderBy: { isPrimary: 'desc' } });
        if (vehicle) {
          await prisma.appointment.create({
            data: {
              userId: user.id, garageId: garage.id, vehicleId: vehicle.id,
              serviceType: 'טיפול 30,000', date: new Date('2026-02-15T09:00:00'), time: '09:00',
              status: 'completed', notes: 'טיפול שוטף + החלפת שמן ופילטרים',
            },
          });
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 5);
          nextWeek.setHours(10, 0, 0, 0);
          await prisma.appointment.create({
            data: {
              userId: user.id, garageId: garage.id, vehicleId: vehicle.id,
              serviceType: 'בדיקה שנתית (טסט)', date: nextWeek, time: '10:00',
              status: 'confirmed', notes: 'הכנה לטסט שנתי',
            },
          });
          appointmentsCreated = 2;
        }
      }
    }

    return jsonResponse({
      message: 'מוסכים דמה נוצרו/עודכנו בהצלחה!',
      mainGarage: { id: garage.id, name: garage.name },
      appointmentsCreated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Keep POST for backward compatibility
export { GET as POST };
