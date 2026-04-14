// generate-templates.mjs
// Generates seed-templates-v2.sql from profile + model mapping.
// Run: node generate-templates.mjs  →  then: npx prisma db execute --file seed-templates-v2.sql --schema prisma/schema.prisma

import fs from 'fs';

// ============================================================
// MAINTENANCE PROFILES — shared item lists per engine family
// ============================================================
const PROFILES = {
  vw_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן 5W-30 VW 504 00' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 60000, intervalMonths: 24, estimatedCost: '120-200 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה (תא נוסעים)', intervalKm: 30000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-500 ₪', description: 'TSI/TFSI — NGK/Denso מקורי' },
    { category: 'בלמים', item: 'החלפת רפידות בלמים קדמי', intervalKm: 40000, intervalMonths: 36, estimatedCost: '400-700 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור G13', intervalKm: 90000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT4', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן DSG', intervalKm: 60000, intervalMonths: 48, estimatedCost: '700-1,100 ₪', description: 'DQ200/DQ381' },
    { category: 'רצועות', item: 'בדיקת/החלפת רצועת תזמון', intervalKm: 120000, intervalMonths: 72, estimatedCost: '1,800-2,800 ₪', description: 'במנועי TSI עם שרשרת — בדיקה בלבד' },
  ],
  vw_diesel: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '280-450 ₪', description: 'שמן 5W-30 VW 507 00' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 60000, intervalMonths: 24, estimatedCost: '120-200 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 30000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'דלק', item: 'החלפת מסנן דלק (דיזל)', intervalKm: 60000, intervalMonths: 24, estimatedCost: '200-350 ₪', description: '' },
    { category: 'פליטה', item: 'מילוי AdBlue', intervalKm: 15000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת רפידות בלמים קדמי', intervalKm: 40000, intervalMonths: 36, estimatedCost: '400-700 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור G13', intervalKm: 90000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT4', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן DSG', intervalKm: 60000, intervalMonths: 48, estimatedCost: '700-1,100 ₪', description: 'DQ250/DQ381' },
    { category: 'רצועות', item: 'החלפת רצועת תזמון', intervalKm: 120000, intervalMonths: 72, estimatedCost: '2,000-3,200 ₪', description: 'TDI' },
  ],
  toyota_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 10000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן 0W-20 Toyota מקורי' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 40000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 20000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים (אירידיום)', intervalKm: 100000, intervalMonths: 60, estimatedCost: '400-700 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '400-700 ₪', description: '' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור Super LLC', intervalKm: 80000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT3', intervalKm: 0, intervalMonths: 36, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן CVT/אוטומטי', intervalKm: 60000, intervalMonths: 60, estimatedCost: '400-700 ₪', description: '' },
  ],
  toyota_hybrid: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 10000, intervalMonths: 12, estimatedCost: '280-450 ₪', description: 'שמן 0W-20/0W-16 Toyota' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 40000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 20000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מערכת היברידית', item: 'בדיקת סוללה היברידית + קירור Inverter', intervalKm: 20000, intervalMonths: 12, estimatedCost: '150-300 ₪', description: 'סריקה + מצב SOC' },
    { category: 'מצתים', item: 'החלפת מצתים (אירידיום)', intervalKm: 100000, intervalMonths: 60, estimatedCost: '400-700 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 60000, intervalMonths: 36, estimatedCost: '400-700 ₪', description: 'רגן\' מאריך חיי רפידות' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור (מנוע + Inverter)', intervalKm: 80000, intervalMonths: 60, estimatedCost: '300-500 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT3', intervalKm: 0, intervalMonths: 36, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן e-CVT', intervalKm: 100000, intervalMonths: 60, estimatedCost: '500-800 ₪', description: '' },
  ],
  hyundai_kia_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 10000, intervalMonths: 12, estimatedCost: '220-380 ₪', description: 'שמן 5W-30 Hyundai/Kia' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 15000, intervalMonths: 12, estimatedCost: '70-130 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-500 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '350-650 ₪', description: '' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור (OAT ירוק/כחול)', intervalKm: 60000, intervalMonths: 48, estimatedCost: '180-300 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT4', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי/DCT', intervalKm: 60000, intervalMonths: 48, estimatedCost: '400-800 ₪', description: '' },
  ],
  hyundai_kia_hybrid: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 10000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן 0W-20' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 15000, intervalMonths: 12, estimatedCost: '70-130 ₪', description: '' },
    { category: 'מערכת היברידית', item: 'בדיקת סוללה + קירור Inverter', intervalKm: 20000, intervalMonths: 12, estimatedCost: '150-300 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-500 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 50000, intervalMonths: 36, estimatedCost: '350-650 ₪', description: '' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור (מנוע + סוללה)', intervalKm: 60000, intervalMonths: 48, estimatedCost: '250-450 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן DCT היברידי', intervalKm: 60000, intervalMonths: 48, estimatedCost: '500-900 ₪', description: '' },
  ],
  ev_generic: [
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT4', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 60000, intervalMonths: 36, estimatedCost: '400-700 ₪', description: 'רגן\' מאריך חיים' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה/HEPA', intervalKm: 20000, intervalMonths: 12, estimatedCost: '100-250 ₪', description: '' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '100-180 ₪', description: 'רכבי EV שוחקים צמיגים מהר יותר' },
    { category: 'קירור', item: 'בדיקת/החלפת נוזל קירור סוללה + מוטור', intervalKm: 0, intervalMonths: 48, estimatedCost: '400-800 ₪', description: 'לפי יצרן' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן רדוקטור', intervalKm: 0, intervalMonths: 60, estimatedCost: '250-450 ₪', description: '' },
    { category: 'מערכת חשמל', item: 'בדיקת סוללה (SOH) + עדכוני תוכנה', intervalKm: 20000, intervalMonths: 12, estimatedCost: '0-300 ₪', description: 'לרוב ללא עלות בשירות' },
    { category: 'מיזוג', item: 'בדיקת מייבש + Heat Pump', intervalKm: 0, intervalMonths: 24, estimatedCost: '200-400 ₪', description: '' },
  ],
  tesla_ev: [
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT4 (לאחר בדיקה)', intervalKm: 0, intervalMonths: 48, estimatedCost: '200-350 ₪', description: 'Tesla לפי בדיקה בלבד' },
    { category: 'בלמים', item: 'ניקוי ושימון בלמים (אזור לח)', intervalKm: 20000, intervalMonths: 12, estimatedCost: '200-400 ₪', description: 'מומלץ באקלים ים תיכוני' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן HEPA/פחם', intervalKm: 0, intervalMonths: 24, estimatedCost: '250-500 ₪', description: 'Model S/X כל שנתיים, Model 3/Y כל שנתיים' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '100-180 ₪', description: '' },
    { category: 'מיזוג', item: 'החלפת מייבש מיזוג (Desiccant Bag)', intervalKm: 0, intervalMonths: 72, estimatedCost: '300-500 ₪', description: '' },
    { category: 'מערכת חשמל', item: 'עדכוני תוכנה + בדיקת בטריה', intervalKm: 0, intervalMonths: 12, estimatedCost: '0 ₪', description: 'OTA' },
  ],
  mazda_skyactiv: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 10000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן 0W-20 SkyActiv' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע FL22', intervalKm: 120000, intervalMonths: 60, estimatedCost: '200-320 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 20000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '350-600 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '400-700 ₪', description: '' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור SkyActiv', intervalKm: 0, intervalMonths: 132, estimatedCost: '250-400 ₪', description: '11 שנים' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן SkyActiv-Drive', intervalKm: 80000, intervalMonths: 60, estimatedCost: '500-800 ₪', description: '' },
  ],
  stellantis_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 20000, intervalMonths: 24, estimatedCost: '300-500 ₪', description: 'שמן 0W-30 PSA B71/C2' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 40000, intervalMonths: 24, estimatedCost: '100-180 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 20000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-500 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '400-700 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור OAT', intervalKm: 80000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT4', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן גיר EAT8/MT', intervalKm: 60000, intervalMonths: 48, estimatedCost: '500-900 ₪', description: '' },
  ],
  stellantis_diesel: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 20000, intervalMonths: 24, estimatedCost: '350-550 ₪', description: 'שמן 5W-30 PSA B71 2312' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 40000, intervalMonths: 24, estimatedCost: '100-180 ₪', description: '' },
    { category: 'דלק', item: 'החלפת מסנן דלק (דיזל)', intervalKm: 40000, intervalMonths: 24, estimatedCost: '200-350 ₪', description: '' },
    { category: 'פליטה', item: 'מילוי AdBlue + בדיקת DPF', intervalKm: 20000, intervalMonths: 12, estimatedCost: '100-250 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '400-700 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור OAT', intervalKm: 80000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: '' },
    { category: 'רצועות', item: 'החלפת רצועת תזמון', intervalKm: 160000, intervalMonths: 120, estimatedCost: '2,000-3,500 ₪', description: '' },
  ],
  german_premium_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן (Condition Based)', intervalKm: 20000, intervalMonths: 24, estimatedCost: '400-700 ₪', description: 'BMW LL-01 / MB 229.5 / VW 504 00' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 60000, intervalMonths: 48, estimatedCost: '150-280 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה/פחם', intervalKm: 30000, intervalMonths: 24, estimatedCost: '150-280 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 60, estimatedCost: '500-900 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת רפידות + דיסקים קדמי', intervalKm: 50000, intervalMonths: 36, estimatedCost: '1,200-2,200 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 0, intervalMonths: 24, estimatedCost: '200-350 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי (ZF 8HP / 9G-Tronic)', intervalKm: 80000, intervalMonths: 60, estimatedCost: '900-1,500 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 0, intervalMonths: 60, estimatedCost: '300-500 ₪', description: '' },
  ],
  german_premium_diesel: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 20000, intervalMonths: 24, estimatedCost: '450-750 ₪', description: 'BMW LL-04 / MB 229.52' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 60000, intervalMonths: 48, estimatedCost: '150-280 ₪', description: '' },
    { category: 'דלק', item: 'החלפת מסנן דלק (דיזל)', intervalKm: 60000, intervalMonths: 24, estimatedCost: '250-450 ₪', description: '' },
    { category: 'פליטה', item: 'מילוי AdBlue', intervalKm: 15000, intervalMonths: 12, estimatedCost: '100-200 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת רפידות + דיסקים', intervalKm: 50000, intervalMonths: 36, estimatedCost: '1,200-2,200 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 0, intervalMonths: 24, estimatedCost: '200-350 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי', intervalKm: 80000, intervalMonths: 60, estimatedCost: '900-1,500 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 0, intervalMonths: 60, estimatedCost: '300-500 ₪', description: '' },
  ],
  japanese_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 10000, intervalMonths: 12, estimatedCost: '230-380 ₪', description: '0W-20/5W-30 מקורי' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 40000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 20000, intervalMonths: 12, estimatedCost: '70-130 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-500 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '350-650 ₪', description: '' },
    { category: 'צמיגים', item: 'סיבוב צמיגים', intervalKm: 10000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 80000, intervalMonths: 60, estimatedCost: '180-320 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT3/4', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן CVT/אוטומטי', intervalKm: 60000, intervalMonths: 48, estimatedCost: '400-750 ₪', description: '' },
  ],
  renault_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 20000, intervalMonths: 24, estimatedCost: '280-450 ₪', description: 'RN17 שמן 5W-30' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 40000, intervalMonths: 24, estimatedCost: '100-180 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 20000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-500 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '400-700 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור', intervalKm: 90000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן EDC/אוטומטי', intervalKm: 60000, intervalMonths: 48, estimatedCost: '500-900 ₪', description: '' },
  ],
  ford_gasoline: [
    { category: 'שמן מנוע', item: 'החלפת שמן ופילטר שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'Ford WSS-M2C950-A' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אוויר מנוע', intervalKm: 45000, intervalMonths: 24, estimatedCost: '100-180 ₪', description: '' },
    { category: 'מסנני אוויר', item: 'החלפת מסנן אבקה', intervalKm: 30000, intervalMonths: 12, estimatedCost: '80-150 ₪', description: '' },
    { category: 'מצתים', item: 'החלפת מצתים EcoBoost', intervalKm: 60000, intervalMonths: 48, estimatedCost: '350-600 ₪', description: '' },
    { category: 'בלמים', item: 'בדיקת והחלפת רפידות בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '400-700 ₪', description: '' },
    { category: 'קירור', item: 'החלפת נוזל קירור Orange', intervalKm: 160000, intervalMonths: 120, estimatedCost: '250-400 ₪', description: '' },
    { category: 'בלמים', item: 'החלפת נוזל בלמים DOT4', intervalKm: 0, intervalMonths: 24, estimatedCost: '150-250 ₪', description: '' },
    { category: 'תיבת הילוכים', item: 'החלפת שמן PowerShift/8F', intervalKm: 80000, intervalMonths: 60, estimatedCost: '500-900 ₪', description: '' },
  ],
};

// ============================================================
// MODELS — manufacturer + model + fuel types available in Israel
// ============================================================
const MODELS = [
  // --- Skoda (VW Group) ---
  ['סקודה', 'Fabia', ['gasoline'], 'vw_gasoline'],
  ['סקודה', 'Scala', ['gasoline'], 'vw_gasoline'],
  ['סקודה', 'Octavia', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['סקודה', 'Kamiq', ['gasoline'], 'vw_gasoline'],
  ['סקודה', 'Karoq', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['סקודה', 'Kodiaq', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['סקודה', 'Superb', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['סקודה', 'Enyaq', ['electric'], 'ev_generic'],

  // --- Seat / Cupra ---
  ['סיאט', 'Ibiza', ['gasoline'], 'vw_gasoline'],
  ['סיאט', 'Leon', ['gasoline'], 'vw_gasoline'],
  ['סיאט', 'Arona', ['gasoline'], 'vw_gasoline'],
  ['סיאט', 'Ateca', ['gasoline'], 'vw_gasoline'],
  ['סיאט', 'Tarraco', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['קופרה', 'Formentor', ['gasoline', 'hybrid'], { gasoline: 'vw_gasoline', hybrid: 'vw_gasoline' }],
  ['קופרה', 'Born', ['electric'], 'ev_generic'],

  // --- Volkswagen ---
  ['פולקסווגן', 'Polo', ['gasoline'], 'vw_gasoline'],
  ['פולקסווגן', 'Golf', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['פולקסווגן', 'T-Roc', ['gasoline'], 'vw_gasoline'],
  ['פולקסווגן', 'T-Cross', ['gasoline'], 'vw_gasoline'],
  ['פולקסווגן', 'Tiguan', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['פולקסווגן', 'Passat', ['gasoline', 'diesel'], { gasoline: 'vw_gasoline', diesel: 'vw_diesel' }],
  ['פולקסווגן', 'ID.3', ['electric'], 'ev_generic'],
  ['פולקסווגן', 'ID.4', ['electric'], 'ev_generic'],
  ['פולקסווגן', 'ID.5', ['electric'], 'ev_generic'],

  // --- Audi ---
  ['אאודי', 'A1', ['gasoline'], 'german_premium_gasoline'],
  ['אאודי', 'A3', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['אאודי', 'A4', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['אאודי', 'Q2', ['gasoline'], 'german_premium_gasoline'],
  ['אאודי', 'Q3', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['אאודי', 'Q5', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['אאודי', 'Q7', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['אאודי', 'e-tron', ['electric'], 'ev_generic'],
  ['אאודי', 'Q4 e-tron', ['electric'], 'ev_generic'],

  // --- Toyota ---
  ['טויוטה', 'Yaris', ['gasoline', 'hybrid'], { gasoline: 'toyota_gasoline', hybrid: 'toyota_hybrid' }],
  ['טויוטה', 'Yaris Cross', ['hybrid'], 'toyota_hybrid'],
  ['טויוטה', 'Corolla', ['gasoline', 'hybrid'], { gasoline: 'toyota_gasoline', hybrid: 'toyota_hybrid' }],
  ['טויוטה', 'Corolla Cross', ['hybrid'], 'toyota_hybrid'],
  ['טויוטה', 'CH-R', ['hybrid'], 'toyota_hybrid'],
  ['טויוטה', 'RAV4', ['gasoline', 'hybrid'], { gasoline: 'toyota_gasoline', hybrid: 'toyota_hybrid' }],
  ['טויוטה', 'Highlander', ['hybrid'], 'toyota_hybrid'],
  ['טויוטה', 'Prius', ['hybrid'], 'toyota_hybrid'],
  ['טויוטה', 'Camry', ['hybrid'], 'toyota_hybrid'],
  ['טויוטה', 'bZ4X', ['electric'], 'ev_generic'],

  // --- Lexus ---
  ['לקסוס', 'UX', ['hybrid'], 'toyota_hybrid'],
  ['לקסוס', 'NX', ['hybrid'], 'toyota_hybrid'],
  ['לקסוס', 'RX', ['hybrid'], 'toyota_hybrid'],
  ['לקסוס', 'ES', ['hybrid'], 'toyota_hybrid'],

  // --- Hyundai ---
  ['יונדאי', 'i10', ['gasoline'], 'hyundai_kia_gasoline'],
  ['יונדאי', 'i20', ['gasoline'], 'hyundai_kia_gasoline'],
  ['יונדאי', 'Accent', ['gasoline'], 'hyundai_kia_gasoline'],
  ['יונדאי', 'Bayon', ['gasoline'], 'hyundai_kia_gasoline'],
  ['יונדאי', 'Kona', ['gasoline', 'hybrid', 'electric'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid', electric: 'ev_generic' }],
  ['יונדאי', 'Tucson', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['יונדאי', 'Santa Fe', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['יונדאי', 'Ioniq 5', ['electric'], 'ev_generic'],
  ['יונדאי', 'Ioniq 6', ['electric'], 'ev_generic'],

  // --- Kia ---
  ['קיה', 'Picanto', ['gasoline'], 'hyundai_kia_gasoline'],
  ['קיה', 'Rio', ['gasoline'], 'hyundai_kia_gasoline'],
  ['קיה', 'Stonic', ['gasoline'], 'hyundai_kia_gasoline'],
  ['קיה', 'Ceed', ['gasoline'], 'hyundai_kia_gasoline'],
  ['קיה', 'XCeed', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['קיה', 'Niro', ['hybrid', 'electric'], { hybrid: 'hyundai_kia_hybrid', electric: 'ev_generic' }],
  ['קיה', 'Sportage', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['קיה', 'Sorento', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['קיה', 'EV6', ['electric'], 'ev_generic'],
  ['קיה', 'EV9', ['electric'], 'ev_generic'],

  // --- Mazda ---
  ['מאזדה', '2', ['gasoline'], 'mazda_skyactiv'],
  ['מאזדה', '3', ['gasoline'], 'mazda_skyactiv'],
  ['מאזדה', '6', ['gasoline'], 'mazda_skyactiv'],
  ['מאזדה', 'CX-3', ['gasoline'], 'mazda_skyactiv'],
  ['מאזדה', 'CX-30', ['gasoline'], 'mazda_skyactiv'],
  ['מאזדה', 'CX-5', ['gasoline'], 'mazda_skyactiv'],
  ['מאזדה', 'CX-60', ['gasoline', 'hybrid'], { gasoline: 'mazda_skyactiv', hybrid: 'mazda_skyactiv' }],
  ['מאזדה', 'MX-30', ['electric'], 'ev_generic'],

  // --- Nissan ---
  ['ניסאן', 'Micra', ['gasoline'], 'japanese_gasoline'],
  ['ניסאן', 'Juke', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['ניסאן', 'Qashqai', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['ניסאן', 'X-Trail', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['ניסאן', 'Leaf', ['electric'], 'ev_generic'],
  ['ניסאן', 'Ariya', ['electric'], 'ev_generic'],

  // --- Honda ---
  ['הונדה', 'Jazz', ['hybrid'], 'toyota_hybrid'],
  ['הונדה', 'Civic', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'toyota_hybrid' }],
  ['הונדה', 'HR-V', ['hybrid'], 'toyota_hybrid'],
  ['הונדה', 'CR-V', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'toyota_hybrid' }],
  ['הונדה', 'e:Ny1', ['electric'], 'ev_generic'],

  // --- Suzuki ---
  ['סוזוקי', 'Swift', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['סוזוקי', 'Baleno', ['gasoline'], 'japanese_gasoline'],
  ['סוזוקי', 'Ignis', ['gasoline'], 'japanese_gasoline'],
  ['סוזוקי', 'Vitara', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['סוזוקי', 'S-Cross', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['סוזוקי', 'Jimny', ['gasoline'], 'japanese_gasoline'],
  ['סוזוקי', 'Across', ['hybrid'], 'toyota_hybrid'],

  // --- Mitsubishi ---
  ['מיצובישי', 'Space Star', ['gasoline'], 'japanese_gasoline'],
  ['מיצובישי', 'Colt', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['מיצובישי', 'ASX', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['מיצובישי', 'Eclipse Cross', ['gasoline', 'hybrid'], { gasoline: 'japanese_gasoline', hybrid: 'japanese_gasoline' }],
  ['מיצובישי', 'Outlander', ['hybrid'], 'toyota_hybrid'],

  // --- Renault / Dacia ---
  ['רנו', 'Clio', ['gasoline', 'hybrid'], { gasoline: 'renault_gasoline', hybrid: 'renault_gasoline' }],
  ['רנו', 'Captur', ['gasoline', 'hybrid'], { gasoline: 'renault_gasoline', hybrid: 'renault_gasoline' }],
  ['רנו', 'Megane', ['gasoline'], 'renault_gasoline'],
  ['רנו', 'Megane E-Tech', ['electric'], 'ev_generic'],
  ['רנו', 'Arkana', ['hybrid'], 'renault_gasoline'],
  ['רנו', 'Austral', ['hybrid'], 'renault_gasoline'],
  ['רנו', 'Scenic E-Tech', ['electric'], 'ev_generic'],
  ['רנו', 'Zoe', ['electric'], 'ev_generic'],
  ['דאצ\'יה', 'Sandero', ['gasoline'], 'renault_gasoline'],
  ['דאצ\'יה', 'Duster', ['gasoline'], 'renault_gasoline'],
  ['דאצ\'יה', 'Spring', ['electric'], 'ev_generic'],

  // --- Peugeot ---
  ['פיג\'ו', '208', ['gasoline', 'electric'], { gasoline: 'stellantis_gasoline', electric: 'ev_generic' }],
  ['פיג\'ו', '2008', ['gasoline', 'electric'], { gasoline: 'stellantis_gasoline', electric: 'ev_generic' }],
  ['פיג\'ו', '308', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],
  ['פיג\'ו', '3008', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],
  ['פיג\'ו', '5008', ['gasoline'], 'stellantis_gasoline'],
  ['פיג\'ו', '408', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],

  // --- Citroen / DS / Opel ---
  ['סיטרואן', 'C3', ['gasoline'], 'stellantis_gasoline'],
  ['סיטרואן', 'C4', ['gasoline', 'electric'], { gasoline: 'stellantis_gasoline', electric: 'ev_generic' }],
  ['סיטרואן', 'C5 Aircross', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],
  ['אופל', 'Corsa', ['gasoline', 'electric'], { gasoline: 'stellantis_gasoline', electric: 'ev_generic' }],
  ['אופל', 'Astra', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],
  ['אופל', 'Mokka', ['gasoline', 'electric'], { gasoline: 'stellantis_gasoline', electric: 'ev_generic' }],
  ['אופל', 'Grandland', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],

  // --- Fiat / Alfa / Jeep ---
  ['פיאט', '500', ['gasoline', 'electric'], { gasoline: 'stellantis_gasoline', electric: 'ev_generic' }],
  ['פיאט', 'Panda', ['gasoline'], 'stellantis_gasoline'],
  ['פיאט', 'Tipo', ['gasoline'], 'stellantis_gasoline'],
  ['ג\'יפ', 'Renegade', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],
  ['ג\'יפ', 'Compass', ['gasoline', 'hybrid'], { gasoline: 'stellantis_gasoline', hybrid: 'stellantis_gasoline' }],
  ['ג\'יפ', 'Avenger', ['gasoline', 'electric'], { gasoline: 'stellantis_gasoline', electric: 'ev_generic' }],

  // --- Ford ---
  ['פורד', 'Fiesta', ['gasoline'], 'ford_gasoline'],
  ['פורד', 'Focus', ['gasoline'], 'ford_gasoline'],
  ['פורד', 'Puma', ['gasoline'], 'ford_gasoline'],
  ['פורד', 'Kuga', ['gasoline', 'hybrid'], { gasoline: 'ford_gasoline', hybrid: 'ford_gasoline' }],
  ['פורד', 'Mustang Mach-E', ['electric'], 'ev_generic'],

  // --- BMW ---
  ['ב.מ.וו', 'Series 1', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['ב.מ.וו', 'Series 2', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['ב.מ.וו', 'Series 3', ['gasoline', 'diesel', 'hybrid'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', hybrid: 'german_premium_gasoline' }],
  ['ב.מ.וו', 'Series 5', ['gasoline', 'diesel', 'hybrid'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', hybrid: 'german_premium_gasoline' }],
  ['ב.מ.וו', 'X1', ['gasoline', 'diesel', 'electric'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', electric: 'ev_generic' }],
  ['ב.מ.וו', 'X3', ['gasoline', 'diesel', 'electric'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', electric: 'ev_generic' }],
  ['ב.מ.וו', 'X5', ['gasoline', 'diesel', 'hybrid'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', hybrid: 'german_premium_gasoline' }],
  ['ב.מ.וו', 'i4', ['electric'], 'ev_generic'],
  ['ב.מ.וו', 'iX', ['electric'], 'ev_generic'],
  ['ב.מ.וו', 'iX1', ['electric'], 'ev_generic'],
  ['ב.מ.וו', 'iX3', ['electric'], 'ev_generic'],

  // --- Mini ---
  ['מיני', 'Cooper', ['gasoline', 'electric'], { gasoline: 'german_premium_gasoline', electric: 'ev_generic' }],
  ['מיני', 'Countryman', ['gasoline', 'electric'], { gasoline: 'german_premium_gasoline', electric: 'ev_generic' }],

  // --- Mercedes ---
  ['מרצדס', 'A-Class', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['מרצדס', 'B-Class', ['gasoline'], 'german_premium_gasoline'],
  ['מרצדס', 'C-Class', ['gasoline', 'diesel', 'hybrid'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', hybrid: 'german_premium_gasoline' }],
  ['מרצדס', 'E-Class', ['gasoline', 'diesel', 'hybrid'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', hybrid: 'german_premium_gasoline' }],
  ['מרצדס', 'GLA', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['מרצדס', 'GLB', ['gasoline', 'diesel'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel' }],
  ['מרצדס', 'GLC', ['gasoline', 'diesel', 'hybrid'], { gasoline: 'german_premium_gasoline', diesel: 'german_premium_diesel', hybrid: 'german_premium_gasoline' }],
  ['מרצדס', 'EQA', ['electric'], 'ev_generic'],
  ['מרצדס', 'EQB', ['electric'], 'ev_generic'],
  ['מרצדס', 'EQE', ['electric'], 'ev_generic'],

  // --- Volvo ---
  ['וולוו', 'XC40', ['gasoline', 'hybrid', 'electric'], { gasoline: 'german_premium_gasoline', hybrid: 'german_premium_gasoline', electric: 'ev_generic' }],
  ['וולוו', 'XC60', ['gasoline', 'hybrid'], { gasoline: 'german_premium_gasoline', hybrid: 'german_premium_gasoline' }],
  ['וולוו', 'XC90', ['gasoline', 'hybrid'], { gasoline: 'german_premium_gasoline', hybrid: 'german_premium_gasoline' }],
  ['וולוו', 'EX30', ['electric'], 'ev_generic'],
  ['וולוו', 'EX40', ['electric'], 'ev_generic'],

  // --- Tesla ---
  ['טסלה', 'Model 3', ['electric'], 'tesla_ev'],
  ['טסלה', 'Model Y', ['electric'], 'tesla_ev'],
  ['טסלה', 'Model S', ['electric'], 'tesla_ev'],
  ['טסלה', 'Model X', ['electric'], 'tesla_ev'],

  // --- Chinese brands ---
  ['צ\'רי', 'Tiggo 7', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['צ\'רי', 'Tiggo 8', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['BYD', 'Atto 3', ['electric'], 'ev_generic'],
  ['BYD', 'Dolphin', ['electric'], 'ev_generic'],
  ['BYD', 'Seal', ['electric'], 'ev_generic'],
  ['BYD', 'Han', ['electric'], 'ev_generic'],
  ['MG', '3', ['hybrid'], 'hyundai_kia_hybrid'],
  ['MG', '4', ['electric'], 'ev_generic'],
  ['MG', 'ZS', ['gasoline', 'electric'], { gasoline: 'hyundai_kia_gasoline', electric: 'ev_generic' }],
  ['MG', 'HS', ['gasoline', 'hybrid'], { gasoline: 'hyundai_kia_gasoline', hybrid: 'hyundai_kia_hybrid' }],
  ['ג\'ילי', 'Geometry C', ['electric'], 'ev_generic'],
  ['ג\'ילי', 'Emgrand', ['gasoline'], 'hyundai_kia_gasoline'],
  ['לינק אנד קו', '01', ['hybrid'], 'vw_gasoline'],
  ['לינק אנד קו', '09', ['hybrid'], 'vw_gasoline'],
];

// ============================================================
// SQL GENERATOR
// ============================================================
const sqlEscape = (s) => s.replace(/'/g, "''");
const rows = [];

for (const [manufacturer, model, fuels, profileRef] of MODELS) {
  for (const fuel of fuels) {
    const profileKey = typeof profileRef === 'string' ? profileRef : profileRef[fuel];
    const items = PROFILES[profileKey];
    if (!items) {
      console.error(`MISSING PROFILE: ${profileKey} for ${manufacturer} ${model} ${fuel}`);
      continue;
    }
    const itemsJson = JSON.stringify(items);
    rows.push(`(gen_random_uuid(), '${sqlEscape(manufacturer)}', '${sqlEscape(model)}', 2015, 2030, '${fuel}', 'manual', '${sqlEscape(itemsJson)}', NOW(), NOW())`);
  }
}

const sql = `-- seed-templates-v2.sql
-- Auto-generated by generate-templates.mjs
-- Contains ${rows.length} maintenance templates (manufacturer × model × fuelType)

DELETE FROM "MaintenanceTemplate";

INSERT INTO "MaintenanceTemplate" (id, manufacturer, model, "yearFrom", "yearTo", "fuelType", source, items, "createdAt", "updatedAt") VALUES
${rows.join(',\n')};
`;

fs.writeFileSync('seed-templates-v2.sql', sql);
console.log(`✅ Generated seed-templates-v2.sql with ${rows.length} templates`);
console.log(`   Models: ${MODELS.length}`);
console.log(`   Profiles: ${Object.keys(PROFILES).length}`);
