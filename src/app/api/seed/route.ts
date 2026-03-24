import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const ec = await prisma.user.count();
    if (ec > 0) return NextResponse.json({ message: 'Already seeded', userCount: ec });
    const hash = await bcrypt.hash('123456', 12);
    const admin = await prisma.user.create({
      data: { email: 'admin@autolog.co.il', passwordHash: hash, fullName: 'מנהל מערכת', role: 'admin', phone: '050-000-0000' },
    });
    const user1 = await prisma.user.create({
      data: { email: 'philip@autolog.co.il', passwordHash: hash, fullName: 'פיליפ בדיקה', role: 'user', phone: '054-316-1610', licenseNumber: 'D9876543' },
    });
    const gOwner = await prisma.user.create({
      data: { email: 'garage@autolog.co.il', passwordHash: hash, fullName: 'יוסי מכניק', role: 'garage_owner', phone: '02-555-1234' },
    });
    const g1 = await prisma.garage.create({
      data: { name: 'מוסך אלטמן', city: 'תל אביב', phone: '03-555-1234', rating: 4.8, reviewCount: 234, isPartner: true, isActive: true, services: '["ROT","טיפול","צמיגים"]' },
    });
    const g2 = await prisma.garage.create({
      data: { name: 'מוסך כרמל', city: 'חיפה', phone: '04-555-5678', rating: 4.6, reviewCount: 189, isPartner: true, isActive: true, services: '["מנועים","חשמל"]' },
    });
    const g3 = await prisma.garage.create({
      data: { ownerId: gOwner.id, name: 'פרונט ראשון', city: 'ירושלים', phone: '02-555-9012', rating: 4.9, reviewCount: 312, isPartner: true, isActive: true, services: '["כל השירותים"]' },
    });
    const v1 = await prisma.vehicle.create({
      data: {
        userId: user1.id, nickname: "ספורטז' לבנה", manufacturer: 'KIA', model: 'SPORTAGE',
        year: 2019, licensePlate: '7198738', color: 'לבן', mileage: 45000, fuelType: 'בנזין',
        isPrimary: true, testStatus: 'valid', testExpiryDate: new Date('2026-12-15'),
        insuranceStatus: 'valid', insuranceExpiry: new Date('2026-06-20'),
      },
    });
    const v2 = await prisma.vehicle.create({
      data: {
        userId: user1.id, nickname: 'פורד פוקוס', manufacturer: 'FORD', model: 'FOCUS',
        year: 2020, licensePlate: '8746868', color: 'שחור', mileage: 32000, fuelType: 'דיזל',
        isPrimary: false, testStatus: 'expired', testExpiryDate: new Date('2026-01-20'),
        insuranceStatus: 'valid', insuranceExpiry: new Date('2026-08-10'),
      },
    });
    await prisma.inspection.create({
      data: {
        vehicleId: v1.id, garageId: g1.id, mechanicName: 'דוד כהן',
        inspectionType: 'full', date: new Date('2026-03-10'), status: 'completed',
        overallScore: 85, summary: 'הרכב במצב טוב.',
        items: { create: [
          { category: 'engine', itemName: 'מצב כללי', status: 'ok', score: 88 },
          { category: 'brakes', itemName: 'רפידות', status: 'warning', score: 65, notes: 'מומלץ להחליף' },
          { category: 'tires', itemName: 'עומק סוליה', status: 'ok', score: 90 },
          { category: 'electrical', itemName: 'סוללה', status: 'ok', score: 82 },
        ]},
      },
    });
    await prisma.sosEvent.create({
      data: {
        userId: user1.id, vehicleId: v1.id, eventType: 'flat_tire',
        location: 'תל אביב', status: 'resolved',
        description: 'צמיג פרוץ', resolvedAt: new Date('2026-03-10'),
      },
    });
    const benefits = [
      { name: 'הנחה בבדיקה', category: 'מוסכים', discount: '100 NIS', description: 'הנחה על בדיקה', icon: 'wrench', expiryDate: new Date('2026-06-30') },
      { name: 'הנחה על ביטוח', category: 'ביטוח', discount: '5%', description: 'הנחה על פוליסה', icon: 'shield', expiryDate: new Date('2026-12-31') },
      { name: 'הנחה על צמיגים', category: 'צמיגים', discount: '10%', description: 'הנחה על צמיגים', icon: 'tire', expiryDate: new Date('2026-05-15') },
      { name: 'הנחה על דלק', category: 'דלק', discount: '0.30/L', description: 'הנחה לליטר', icon: 'fuel', expiryDate: new Date('2026-04-30') },
      { name: 'אביזרים', category: 'אביזרים', discount: '15%', description: 'הנחה על אביזרים', icon: 'gift', expiryDate: new Date('2026-07-20') },
    ];
    for (const b of benefits) { await prisma.clubBenefit.create({ data: b }); }
    const reviews = [
      { garageId: g3.id, userName: 'רועי כהן', rating: 5, comment: 'שירות מעולה!' },
      { garageId: g3.id, userName: 'מיכל יוסף', rating: 4, comment: 'טוב מאוד' },
      { garageId: g3.id, userName: 'דוד לוי', rating: 5, comment: 'מקצועי מאוד' },
    ];
    for (const r of reviews) { await prisma.garageReview.create({ data: r }); }
    await prisma.expense.createMany({ data: [
      { vehicleId: v1.id, category: 'fuel', amount: 350, description: 'תדלוק', date: new Date('2026-03-15') },
      { vehicleId: v1.id, category: 'maintenance', amount: 1200, description: 'טיפול 45000', date: new Date('2026-02-20') },
      { vehicleId: v2.id, category: 'insurance', amount: 2800, description: 'ביטוח מקיף', date: new Date('2026-01-05') },
    ]});
    await prisma.notification.createMany({ data: [
      { userId: user1.id, type: 'test_expiry', title: 'טסט פג תוקף', message: 'הטסט של פורד פוקוס פג תוקף.', isRead: false },
      { userId: user1.id, type: 'system', title: 'ברוך הבא ל-AutoLog!', message: 'תודה שהצטרפת.', isRead: true },
    ]});
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: { users: 3, garages: 3, vehicles: 2, inspections: 1, benefits: 5, reviews: 3, expenses: 3, notifications: 2 },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
