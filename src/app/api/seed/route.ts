import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('seed');

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Security: require a secret key to prevent unauthorized seeding
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if already seeded
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Database already seeded',
        userCount: existingUsers
      });
    }

    logger.info('Seeding database...');

    const hash = await bcrypt.hash('123456', 12);

    // Create users
    const admin = await prisma.user.create({
      data: { email: 'admin@autolog.co.il', passwordHash: hash, fullName: 'מנהל מערכת', role: 'admin', phone: '050-000-0000' },
    });

    const user1 = await prisma.user.create({
      data: { email: 'philip@autolog.co.il', passwordHash: hash, fullName: 'פיליפ בדיקה', role: 'user', phone: '054-316-1610', licenseNumber: 'D9876543' },
    });

    const garageOwner = await prisma.user.create({
      data: { email: 'garage@autolog.co.il', passwordHash: hash, fullName: 'יוסי מכניק', role: 'garage_owner', phone: '02-555-1234' },
    });

    // Create garages
    const garage1 = await prisma.garage.create({
      data: { name: 'מוסך אלטמן', city: 'תל אביב', phone: '03-555-1234', rating: 4.8, reviewCount: 234, isPartner: true, isActive: true, services: '["ROP","טיפול","צמיגיצ"]' },
    });

    const garage2 = await prisma.garage.create({
      data: { name: 'מוסך כרמל', city: 'חיפה', phone: '04-555-5678', rating: 4.6, reviewCount: 189, isPartner: true, isActive: true, services: '["מנועים","חשמל"]' },
    });

    const garage3 = await prisma.garage.create({
      data: { ownerId: garageOwner.id, name: 'פרונט ראשון', city: 'ירושלים', phone: '02-555-9012', rating: 4.9, reviewCount: 312, isPartner: true, isActive: true, services: '["כל השירותים"]' },
    });

    // Create vehicles
    const vehicle1 = await prisma.vehicle.create({
      data: {
        userId: user1.id, nickname: "ספורטז' לבנה", manufacturer: 'KIA', model: 'SPORTAGE',
        year: 2019, licensePlate: '7198738', color: 'לבן', mileage: 45000, fuelType: 'בנזין',
        isPrimary: true, testStatus: 'valid', testExpiryDate: new Date('2026-12-15'),
        insuranceStatus: 'valid', insuranceExpiry: new Date('2026-06-20'),
      },
    });

    const vehicle2 = await prisma.vehicle.create({
      data: {
        userId: user1.id, nickname: 'פורד פוקוס', manufacturer: 'FORD', model: 'FOCUS',
        year: 2020, licensePlate: '8746868', color: 'שחור', mileage: 32000, fuelType: 'דיזל',
        isPrimary: false, testStatus: 'expired', testExpiryDate: new Date('2026-01-20'),
        insuranceStatus: 'valid', insuranceExpiry: new Date('2026-08-10'),
      },
    });

    // Create inspections
    await prisma.inspection.create({
      data: {
        vehicleId: vehicle1.id, garageId: garage1.id, mechanicName: 'דוג כהן',
        inspectionType: 'full', date: new Date('2026-03-10'), status: 'completed',
        overallScore: 85, summary: 'הרכב במצב טוב. כמה המלצות לשיפור.',
        items: {
          create: [
            { category: 'engine', itemName: 'מצב כללי', status: 'ok', score: 88 },
            { category: 'brakes', itemName: 'רפידות', status: 'warning', score: 65, notes: 'מומלץ להחליף בקרוב' },
            { category: 'tires', itemName: 'עומק סוליה', status: 'ok', score: 90 },
            { category: 'electrical', itemName: 'סוללה', status: 'ok', score: 82 },
          ],
        },
      },
    });

    // Create SOS events
    await prisma.sosEvent.create({
      data: {
        userId: user1.id, vehicleId: vehicle1.id, eventType: 'flat_tire',
        location: 'תל אביב, צומת דרך בן גוריון', status: 'resolved',
        description: 'צמיג פרוץ בצד ימין קדמי', resolvedAt: new Date('2026-03-10'),
      },
    });

    // Create benefits
    const benefits = [
      { name: 'הנחה בבדיקת AutoLog', category: 'מוסכים', discount: '₪100', description: 'הנחה על בדיקת AutoLog מלאה', icon: '🔧', expiryDate: new Date('2026-06-30') },
      { name: 'הנחה על ביטוח', category: 'ביטוח', discount: '5%', description: 'הנחה על פוליסת ביטוח שנתית', icon: '🛡️', expiryDate: new Date('2026-12-31') },
      { name: 'הנחה על צמיגים', category: 'צמיגים', discount: '10%', description: 'הנחה על קנייה של צמיגים', icon: '🛞', expiryDate: new Date('2026-05-15') },
      { name: 'הנחה על דלק', category: 'דלק', discount: '₪0.30/ליטר', description: 'הנחה לליטר דלק', icon: '⛽', expiryDate: new Date('2026-04-30') },
      { name: 'אביזרים לרכב', category: 'אביזרים', discount: 'עד 15%', description: 'הנחה על אביזרים שונים', icon: '🎁', expiryDate: new Date('2026-07-20') },
    ];

    for (const b of benefits) {
      await prisma.clubBenefit.create({ data: b });
    }

    // Create reviews
    const reviewsData = [
      { garageId: garage3.id, userName: 'רועי כהן', rating: 5, comment: 'שירות מעולה, מלא תמיכה!' },
      { garageId: garage3.id, userName: 'מיכל יוסף', rating: 4, comment: 'טוב מאוד, קצת איטי בתשובות' },
      { garageId: garage3.id, userName: 'דוד לוי', rating: 5, comment: 'המכניק היה מקצועי מאוד' },
    ];

    for (const r of reviewsData) {
      await prisma.garageReview.create({ data: r });
    }

    // Create sample expenses
    await prisma.expense.create({
      data: {
        vehicleId: vehicle1.id, category: 'fuel', amount: 350,
        description: 'תדלוק מלא', date: new Date('2026-03-15'),
      },
    });

    await prisma.expense.create({
      data: {
        vehicleId: vehicle1.id, category: 'maintenance', amount: 1200,
        description: 'טיפול 45,000 ק"מ', date: new Date('2026-02-20'),
      },
    });

    await prisma.expense.create({
      data: {
        vehicleId: vehicle2.id, category: 'insurance', amount: 2800,
        description: 'ביטוח מקיף שנתי', date: new Date('2026-01-05'),
      },
    });

    // Create sample notifications
    await prisma.notification.create({
      data: {
        userId: user1.id, type: 'test_expiry', title: 'טסט פג תוקף',
        message: 'הטסט של פורד פוקוס (8746868) פג תוקף. יש לחדש בהקדם.',
        isRead: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user1.id, type: 'system', title: 'ברוך הבא ל-AutoLog!',
        message: 'תודה שהצטרפת. כאן תוכל לנהל את כל הרכבים שלך במקום אחד.',
        isRead: true,
      },
    });

    logger.info('Seed complete!');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        users: 3,
        garages: 3,
        vehicles: 2,
        inspections: 1,
        sosEvents: 1,
        benefits: 5,
        reviews: 3,
        expenses: 3,
        notifications: 2,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    logger.error('Seed error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
