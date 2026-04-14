// seed-templates.mjs
// Run with: node seed-templates.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ISRAELI_MARKET_TEMPLATES = [
  { manufacturer: 'סקודה', model: '*', yearFrom: 2015, yearTo: 2030, fuelType: null, source: 'manual', items: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן VW Group תקן' },
    { category: 'שמן מנוע', item: 'החלפת שמן מנועי דיזל', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'שמן דיזל — VW Group' },
    { category: 'שמן מנוע', item: 'החלפת שמן קור גבוה', intervalKm: 15000, intervalMonths: 12, estimatedCost: '60-120 ₪', description: 'שמן חמצון' },
    { category: 'בלמים', item: 'בדיקת רפידות בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '400-800 ₪', description: 'בדיקת בלמי חפיסה עגולים' },
    { category: 'בלמים', item: 'החלפת דיסק בלמים', intervalKm: 60000, intervalMonths: 24, estimatedCost: '150-250 ₪', description: 'החלפה לפי הנחיות' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר', intervalKm: 120000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: 'מסנן אוויר G13' },
    { category: 'סינון דלק', item: 'פילטר דלק', intervalKm: 15000, intervalMonths: 12, estimatedCost: '50-100 ₪', description: 'פילטר בדיקת מסנן' },
    { category: 'רצועות שיניים', item: 'בדיקת רצועת תזמון גיר DSG', intervalKm: 90000, intervalMonths: 60, estimatedCost: '1,500-2,500 ₪', description: 'גיר DSG — רצועת תזמון = גדול' },
    { category: 'צמיגים', item: 'בדיקת שחיקה', intervalKm: 30000, intervalMonths: 24, estimatedCost: '350-550 ₪', description: 'בדיקת פרופיל הצמיג' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 60000, intervalMonths: 48, estimatedCost: '200-400 ₪', description: 'נוזל קירור' },
    { category: 'תיבת הילוכים', item: 'החלפת נוזל DSG', intervalKm: 60000, intervalMonths: 48, estimatedCost: '500-900 ₪', description: 'נוזל DSG — שמן גיר אוטומטי ממולץ' },
    { category: 'גלגלים', item: 'בדיקת לחץ צמיגים', intervalKm: 15000, intervalMonths: 12, estimatedCost: '100-200 ₪', description: 'בדיקת לחץ צמיגים' },
  ]},

  { manufacturer: 'יונדאי', model: '*', yearFrom: 2015, yearTo: 2030, fuelType: null, source: 'manual', items: [
    { category: 'שמן מנוע', item: 'החלפת שמן מנוע', intervalKm: 10000, intervalMonths: 12, estimatedCost: '200-350 ₪', description: 'שמן יונדאי מקורי' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'מסנן אוויר מנוע' },
    { category: 'בלמים', item: 'בדיקת בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '300-600 ₪', description: 'רפידות ודיסקים' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '100-200 ₪', description: 'סיבוב לאריכות חיים' },
    { category: 'נוזלים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'DOT4 — פגיעת מים בנוזל' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 50000, intervalMonths: 36, estimatedCost: '150-250 ₪', description: 'נוזל קירור יונדאי מקורי' },
    { category: 'חגורת הנעה', item: 'בדיקת חגורת הנעה', intervalKm: 60000, intervalMonths: 48, estimatedCost: '800-1,500 ₪', description: 'חגורת תזמון/שרשרת' },
  ]},

  { manufacturer: 'טויוטה', model: '*', yearFrom: 2015, yearTo: 2030, fuelType: null, source: 'manual', items: [
    { category: 'שמן מנוע', item: 'החלפת שמן 0W-20', intervalKm: 10000, intervalMonths: 12, estimatedCost: '250-450 ₪', description: 'שמן טויוטה 0W-20 מקורי' },
    { category: 'היברידי', item: 'בדיקת מערכת היברידית', intervalKm: 20000, intervalMonths: 12, estimatedCost: '150-300 ₪', description: 'בדיקת סוללה ומערכת היברידית' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר', intervalKm: 40000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'מסנן אוויר מנוע' },
    { category: 'בלמים', item: 'בדיקת בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '300-600 ₪', description: 'רפידות ודיסקים' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '100-200 ₪', description: 'סיבוב לאריכות חיים' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 80000, intervalMonths: 60, estimatedCost: '200-400 ₪', description: 'Super Long Life Coolant' },
    { category: 'נוזל הגה', item: 'בדיקת נוזל הגה חשמלי', intervalKm: 40000, intervalMonths: 24, estimatedCost: '50-100 ₪', description: 'הגה חשמלי — בדיקה' },
  ]},

  { manufacturer: 'קיה', model: '*', yearFrom: 2015, yearTo: 2030, fuelType: null, source: 'manual', items: [
    { category: 'שמן מנוע', item: 'החלפת שמן מנוע', intervalKm: 10000, intervalMonths: 12, estimatedCost: '200-350 ₪', description: 'שמן קיה מקורי' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'מסנן אוויר מנוע' },
    { category: 'בלמים', item: 'בדיקת בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '300-600 ₪', description: 'רפידות ודיסקים' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 60000, intervalMonths: 48, estimatedCost: '150-250 ₪', description: 'OAT Coolant' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DCT', intervalKm: 60000, intervalMonths: 48, estimatedCost: '400-700 ₪', description: 'DCT — גיר כפול' },
    { category: 'גלגלים', item: 'בדיקת לחץ צמיגים', intervalKm: 10000, intervalMonths: 6, estimatedCost: '50-80 ₪', description: 'TPMS בדיקה' },
  ]},

  { manufacturer: 'מאזדה', model: '*', yearFrom: 2015, yearTo: 2030, fuelType: null, source: 'manual', items: [
    { category: 'שמן מנוע', item: 'החלפת שמן 0W-20', intervalKm: 10000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן מאזדה SkyActiv' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר FL22', intervalKm: 120000, intervalMonths: 60, estimatedCost: '200-320 ₪', description: 'מסנן FL22 עם חומר SkyActiv' },
    { category: 'סינון דלק', item: 'פילטר סינון', intervalKm: 10000, intervalMonths: 12, estimatedCost: '50-80 ₪', description: 'פילטר שינוי ב-10,000 ק"מ' },
    { category: 'קירור', item: 'בדיקת מערכת קירור', intervalKm: 60000, intervalMonths: 48, estimatedCost: '800-1,400 ₪', description: 'בדיקת מערכת קירור' },
    { category: 'צמיגים', item: 'בדיקת שחיקה', intervalKm: 30000, intervalMonths: 24, estimatedCost: '320-520 ₪', description: 'בדיקת פרופיל הצמיג' },
    { category: 'קירור', item: 'החלפת נוזל קירור SkyActiv', intervalKm: 45000, intervalMonths: 36, estimatedCost: '180-350 ₪', description: 'נוזל קירור SkyActiv מקורי' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן SkyActiv-Drive', intervalKm: 80000, intervalMonths: 60, estimatedCost: '450-800 ₪', description: 'SkyActiv-Drive — שמן גיר אוטומטי' },
    { category: 'גלגלים', item: 'בדיקת לחץ צמיגים', intervalKm: 15000, intervalMonths: 12, estimatedCost: '80-170 ₪', description: 'בדיקת לחץ צמיגים עם בדיקת כיוון' },
  ]},

  { manufacturer: 'סיאט', model: '*', yearFrom: 2015, yearTo: 2030, fuelType: null, source: 'manual', items: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן VW Group תקן' },
    { category: 'שמן מנוע', item: 'החלפת שמן דיזל', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'שמן דיזל — VW Group' },
    { category: 'שמן מנוע', item: 'החלפת שמן קור גבוה', intervalKm: 15000, intervalMonths: 12, estimatedCost: '60-120 ₪', description: 'שמן חמצון' },
    { category: 'בלמים', item: 'בדיקת רפידות בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '400-800 ₪', description: 'בדיקת בלמי חפיסה עגולים' },
    { category: 'בלמים', item: 'החלפת דיסק בלמים', intervalKm: 60000, intervalMonths: 24, estimatedCost: '150-250 ₪', description: 'החלפה לפי הנחיות' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר', intervalKm: 120000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: 'מסנן אוויר G13' },
    { category: 'סינון דלק', item: 'פילטר דלק', intervalKm: 15000, intervalMonths: 12, estimatedCost: '50-100 ₪', description: 'פילטר בדיקת מסנן' },
    { category: 'רצועות שיניים', item: 'בדיקת רצועת תזמון גיר DSG', intervalKm: 90000, intervalMonths: 60, estimatedCost: '1,500-2,500 ₪', description: 'גיר DSG — רצועת תזמון = גדול' },
    { category: 'צמיגים', item: 'בדיקת שחיקה', intervalKm: 30000, intervalMonths: 24, estimatedCost: '350-550 ₪', description: 'בדיקת פרופיל הצמיג' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 60000, intervalMonths: 48, estimatedCost: '200-400 ₪', description: 'נוזל קירור' },
    { category: 'תיבת הילוכים', item: 'החלפת נוזל DSG', intervalKm: 60000, intervalMonths: 48, estimatedCost: '500-900 ₪', description: 'נוזל DSG — שמן גיר אוטומטי ממולץ' },
    { category: 'גלגלים', item: 'בדיקת לחץ צמיגים', intervalKm: 15000, intervalMonths: 12, estimatedCost: '100-200 ₪', description: 'בדיקת לחץ צמיגים' },
  ]},
];

async function main() {
  console.log('מתחיל לזרוע תבניות אחזקה...');
  let count = 0;

  for (const template of ISRAELI_MARKET_TEMPLATES) {
    // Delete existing record if exists, then create fresh
    await prisma.maintenanceTemplate.deleteMany({
      where: {
        manufacturer: template.manufacturer,
        model: template.model,
        yearFrom: template.yearFrom,
        yearTo: template.yearTo,
        fuelType: template.fuelType,
      },
    });
    await prisma.maintenanceTemplate.create({
      data: {
        manufacturer: template.manufacturer,
        model: template.model,
        yearFrom: template.yearFrom,
        yearTo: template.yearTo,
        fuelType: template.fuelType,
        source: template.source,
        items: JSON.stringify(template.items),
      },
    });
    console.log(`✓ ${template.manufacturer}: ${template.items.length} פריטים`);
    count++;
  }

  console.log(`\n✅ סה"כ ${count} יצרנים נזרעו בהצלחה!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
