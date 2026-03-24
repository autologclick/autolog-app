import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  const garageOwner = await prisma.user.findFirst({ where: { email: 'garage@autolog.co.il' } });
  if (!garageOwner) { console.log('No garage owner found'); process.exit(1); }

  const existing = await prisma.garage.findUnique({ where: { ownerId: garageOwner.id } });
  if (existing) { console.log('Garage already exists:', existing.name, existing.id); await prisma.$disconnect(); return; }

  const garage = await prisma.garage.create({
    data: {
      ownerId: garageOwner.id,
      name: 'פרונט ראשון - מוסך מורשה',
      address: 'רחוב הרצל 45',
      city: 'תל אביב',
      phone: '03-555-1234',
      email: 'front1@garage.co.il',
      description: 'מוסך מורשה לכל סוגי הרכבים. מתמחים בטיפולים שוטפים, תיקוני מנוע, בדיקות טכניות.',
      rating: 4.7,
      reviewCount: 5,
      services: JSON.stringify(['טיפול שוטף','בדיקה שנתית (טסט)','תיקון מנוע','בלמים','מתלים','חשמל רכב','מיזוג אוויר','פחחות וצבע','צמיגים']),
      workingHours: JSON.stringify({sunday:'08:00-18:00',monday:'08:00-18:00',tuesday:'08:00-18:00',wednesday:'08:00-18:00',thursday:'08:00-18:00',friday:'08:00-13:00',saturday:'סגור'}),
      isActive: true,
      isPartner: true,
    },
  });
  console.log('Created garage:', garage.id, garage.name);

  const g2 = await prisma.garage.create({
    data: {
      name: 'אוטו פלוס - מרכז שירות',
      address: 'שדרות רוטשילד 12',
      city: 'ראשון לציון',
      phone: '03-666-5678',
      description: 'מרכז שירות מתקדם לכל סוגי הרכבים.',
      rating: 4.3,
      reviewCount: 3,
      services: JSON.stringify(['טיפול שוטף','בדיקה שנתית (טסט)','דיאגנוסטיקה','תיקון מנוע','בלמים']),
      workingHours: JSON.stringify({sunday:'07:30-17:30',monday:'07:30-17:30',tuesday:'07:30-17:30',wednesday:'07:30-17:30',thursday:'07:30-17:30',friday:'07:30-12:00',saturday:'סגור'}),
      isActive: true,
      isPartner: false,
    },
  });
  console.log('Created garage:', g2.id, g2.name);

  const g3 = await prisma.garage.create({
    data: {
      name: 'טופ מוטורס',
      address: "רחוב ז'בוטינסקי 88",
      city: 'חיפה',
      phone: '04-777-9012',
      description: 'מוסך מומחה לרכבי יבוא.',
      rating: 4.5,
      reviewCount: 2,
      services: JSON.stringify(['טיפול שוטף','בדיקה שנתית (טסט)','מנוע','גיר','חשמל','מתלים']),
      workingHours: JSON.stringify({sunday:'08:00-17:00',monday:'08:00-17:00',tuesday:'08:00-17:00',wednesday:'08:00-17:00',thursday:'08:00-17:00',friday:'08:00-12:30',saturday:'סגור'}),
      isActive: true,
      isPartner: true,
    },
  });
  console.log('Created garage:', g3.id, g3.name);

  // Reviews
  const reviewsData = [
    { garageId: garage.id, userName: 'רועי כהן', rating: 5, comment: 'שירות מעולה! מחירים הוגנים ועבודה מקצועית.' },
    { garageId: garage.id, userName: 'מיכל לוי', rating: 5, comment: 'המוסך הכי אמין. לא דוחפים עבודות מיותרות.' },
    { garageId: garage.id, userName: 'דוד אברהם', rating: 4, comment: 'עבודה טובה, קצת המתנה אבל שווה.' },
    { garageId: garage.id, userName: 'שרה מזרחי', rating: 5, comment: 'טסט תוך שעה! שירות מהיר ויעיל.' },
    { garageId: garage.id, userName: 'יוסי גולד', rating: 4, comment: 'מקצועי עם ציוד מתקדם.' },
    { garageId: g2.id, userName: 'אבי ישראלי', rating: 4, comment: 'מוסך טוב, שירות סביר.' },
    { garageId: g2.id, userName: 'נועה שמש', rating: 5, comment: 'דיאגנוסטיקה מצוינת!' },
    { garageId: g2.id, userName: 'חן גולדברג', rating: 4, comment: 'מהירים ואמינים.' },
    { garageId: g3.id, userName: 'משה בן דוד', rating: 5, comment: 'מומחים אמיתיים לרכבי יבוא.' },
    { garageId: g3.id, userName: 'ליאת פרידמן', rating: 4, comment: 'יודעים לטפל ב-BMW בעיניים עצומות.' },
  ];
  for (const r of reviewsData) {
    await prisma.garageReview.create({ data: r });
  }
  console.log('Created', reviewsData.length, 'reviews');

  // Appointments for demo user
  const user = await prisma.user.findFirst({ where: { email: 'philip@autolog.co.il' } });
  if (user) {
    const vehicle = await prisma.vehicle.findFirst({ where: { userId: user.id }, orderBy: { isPrimary: 'desc' } });
    if (vehicle) {
      await prisma.appointment.create({
        data: {
          userId: user.id, garageId: garage.id, vehicleId: vehicle.id,
          serviceType: 'טיפול 30,000 ק"מ', date: new Date('2026-02-15T09:00:00'), time: '09:00',
          status: 'completed', notes: 'טיפול שוטף + החלפת שמן ופילטרים',
        },
      });
      const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 5); nextWeek.setHours(10, 0, 0, 0);
      await prisma.appointment.create({
        data: {
          userId: user.id, garageId: garage.id, vehicleId: vehicle.id,
          serviceType: 'בדיקה שנתית (טסט)', date: nextWeek, time: '10:00',
          status: 'confirmed', notes: 'הכנה לטסט שנתי',
        },
      });
      console.log('Created 2 appointments');
    }
  }

  console.log('DONE!');
  await prisma.$disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
