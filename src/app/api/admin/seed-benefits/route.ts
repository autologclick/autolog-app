import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { assertSeedAllowed } from '@/lib/seed-guard';

// POST /api/admin/seed-benefits - Create sample club benefits
export async function POST(req: NextRequest) {
  try {
    const blocked = assertSeedAllowed();
    if (blocked) return blocked;
    requireAdmin(req);

    const benefits = [
      {
        name: 'הנחה בבדיקת AutoLog',
        category: 'services',
        discount: '₪100 הנחה',
        description: 'הנחה על בדיקת AutoLog מלאה בכל המוסכים השותפים',
        partnerName: 'רשת AutoLog',
        icon: 'wrench',
        expiryDate: new Date('2026-06-30'),
        isActive: true,
      },
      {
        name: 'ביטוח צד ג\' במחיר מיוחד',
        category: 'insurance',
        discount: '5% הנחה',
        description: 'הנחה על פוליסת ביטוח צד ג\' שנתית',
        partnerName: 'הראל ביטוח',
        icon: 'shield',
        expiryDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        name: 'צמיגי מישלן בהנחה',
        category: 'tires',
        discount: '10% הנחה',
        description: 'הנחה על מגוון צמיגי מישלן בכל הסניפים',
        partnerName: 'פולגת צמיגים',
        icon: 'wrench_alt',
        expiryDate: new Date('2026-05-15'),
        isActive: true,
      },
      {
        name: 'הנחה על דלק',
        category: 'fuel',
        discount: '₪0.30/ליטר',
        description: 'הנחה לליטר דלק בכל תחנות הדלק של דור אלון',
        partnerName: 'דור אלון',
        icon: 'fuel',
        expiryDate: new Date('2026-04-30'),
        isActive: true,
      },
      {
        name: 'אביזרים לרכב',
        category: 'accessories',
        discount: 'עד 15% הנחה',
        description: 'הנחות מיוחדות על אביזרי רכב ומוצרי טיפוח',
        partnerName: 'אוטו דיפו',
        icon: 'gift',
        expiryDate: new Date('2026-07-20'),
        isActive: true,
      },
      {
        name: 'שטיפת רכב חינם',
        category: 'services',
        discount: 'חינם',
        description: 'שטיפה חיצונית חינם פעם בחודש',
        partnerName: 'קלין קאר',
        icon: 'wrench',
        expiryDate: new Date('2026-09-30'),
        isActive: true,
      },
      {
        name: 'בדיקת חורף מוזלת',
        category: 'services',
        discount: '₪50 הנחה',
        description: 'בדיקה מקיפה לקראת החורף הכוללת בלמים, צמיגים ומגבים',
        partnerName: 'רשת AutoLog',
        icon: 'wrench',
        expiryDate: new Date('2026-11-30'),
        isActive: true,
      },
    ];

    // Clear existing and create new
    await prisma.clubBenefit.deleteMany();
    const created = await prisma.clubBenefit.createMany({
      data: benefits,
    });

    return jsonResponse({
      message: `נוצרו ${created.count} הטבות מועדון`,
      count: created.count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
