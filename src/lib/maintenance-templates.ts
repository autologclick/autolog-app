/**
 * Maintenance Templates — OEM-based service schedules for popular Israeli market vehicles.
 *
 * Architecture (Hybrid):
 *   1. Check DB for manufacturer+model+year match → use stored OEM data (fast, accurate)
 *   2. If no match → fallback to AI (Claude Haiku) for generation
 *   3. Cache result in Vehicle.maintenanceData either way
 *
 * Each template contains items with:
 *   - category: Hebrew category name
 *   - item: Hebrew item name
 *   - intervalKm: manufacturer-recommended km interval
 *   - intervalMonths: manufacturer-recommended month interval
 *   - estimatedCost: estimated cost range in ILS
 *   - description: Hebrew description of why this is needed
 */

import prisma from '@/lib/db';

export interface MaintenanceTemplateItem {
  category: string;
  item: string;
  intervalKm: number;
  intervalMonths: number;
  estimatedCost: string;
  description: string;
}

export interface MaintenanceTemplateData {
  manufacturer: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  fuelType: string | null;
  source: string;
  items: MaintenanceTemplateItem[];
}

// ============================================================
// DB Operations
// ============================================================

// Bump this version whenever ISRAELI_MARKET_TEMPLATES changes.
// Auto-seed will re-run when the deployed version differs from the DB.
const TEMPLATE_VERSION = 5;

// ── Manufacturer name aliases for matching ──
// Maps various spellings (Hebrew, English, common typos) to the canonical name used in templates.
const MANUFACTURER_ALIASES: Record<string, string> = {
  // Mazda
  'מזדה': 'מאזדה', 'mazda': 'מאזדה', 'MAZDA': 'מאזדה', 'Mazda': 'מאזדה',
  // Toyota
  'toyota': 'טויוטה', 'TOYOTA': 'טויוטה', 'Toyota': 'טויוטה',
  // Hyundai
  'hyundai': 'יונדאי', 'HYUNDAI': 'יונדאי', 'Hyundai': 'יונדאי', 'יונדי': 'יונדאי', 'הונדאי': 'יונדאי',
  // Kia
  'kia': 'קיה', 'KIA': 'קיה', 'Kia': 'קיה',
  // Skoda
  'skoda': 'סקודה', 'SKODA': 'סקודה', 'Skoda': 'סקודה', 'שקודה': 'סקודה',
  // Seat / Cupra
  'seat': 'סיאט', 'SEAT': 'סיאט', 'Seat': 'סיאט', 'cupra': 'סיאט', 'CUPRA': 'סיאט', 'Cupra': 'סיאט', 'קופרה': 'סיאט',
  // Volkswagen
  'volkswagen': 'פולקסווגן', 'VW': 'פולקסווגן', 'vw': 'פולקסווגן', 'Volkswagen': 'פולקסווגן',
  // Nissan
  'nissan': 'ניסאן', 'NISSAN': 'ניסאן', 'Nissan': 'ניסאן',
  // Mitsubishi
  'mitsubishi': 'מיצובישי', 'MITSUBISHI': 'מיצובישי', 'Mitsubishi': 'מיצובישי',
  // Suzuki
  'suzuki': 'סוזוקי', 'SUZUKI': 'סוזוקי', 'Suzuki': 'סוזוקי',
  // Honda
  'honda': 'הונדה', 'HONDA': 'הונדה', 'Honda': 'הונדה',
  // BMW
  'bmw': 'ב.מ.וו', 'BMW': 'ב.מ.וו', 'Bmw': 'ב.מ.וו',
  // Mercedes
  'mercedes': 'מרצדס', 'MERCEDES': 'מרצדס', 'Mercedes': 'מרצדס', 'mercedes-benz': 'מרצדס',
};

function normalizeManufacturer(name: string): string {
  const trimmed = name.trim();
  return MANUFACTURER_ALIASES[trimmed] || trimmed;
}

let tableChecked = false;
let autoSeeded = false;

async function ensureMaintenanceTemplateTable() {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MaintenanceTemplate" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "manufacturer" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "yearFrom" INTEGER NOT NULL,
        "yearTo" INTEGER NOT NULL,
        "fuelType" TEXT,
        "source" TEXT NOT NULL DEFAULT 'manual',
        "items" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MaintenanceTemplate_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "MaintenanceTemplate_manufacturer_model_yearFrom_yearTo_fuelType_key"
      ON "MaintenanceTemplate" ("manufacturer", "model", "yearFrom", "yearTo", "fuelType")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MaintenanceTemplate_manufacturer_model_idx"
      ON "MaintenanceTemplate" ("manufacturer", "model")
    `);
  } catch {
    /* table check non-fatal */
  }
  tableChecked = true;
}

/**
 * Find a matching maintenance template for a vehicle.
 * Tries exact match first, then broadens to any fuel type.
 */
/**
 * Ensure templates are up-to-date. Call BEFORE reading cache.
 * Returns true if templates were re-seeded (cache was cleared).
 */
export async function ensureTemplatesUpToDate(): Promise<boolean> {
  if (autoSeeded) return false;
  autoSeeded = true;
  await ensureMaintenanceTemplateTable();

  try {
    const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "MaintenanceTemplate"`
    );
    const dbCount = Number(countRows[0]?.count || 0);
    const codeCount = ISRAELI_MARKET_TEMPLATES.length;

    let needsSeed = dbCount === 0 || dbCount < codeCount;

    if (!needsSeed) {
      const versionCheck = await prisma.$queryRawUnsafe<Array<{ source: string }>>(
        `SELECT "source" FROM "MaintenanceTemplate" LIMIT 1`
      );
      const storedSource = versionCheck[0]?.source || '';
      needsSeed = !storedSource.includes(`v${TEMPLATE_VERSION}`);
    }

    if (needsSeed) {
      console.log(`[maintenance-templates] Auto-seeding templates (v${TEMPLATE_VERSION})...`);
      await seedAllTemplates();
      // Clear ALL cached vehicle maintenance data so they recalculate
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Vehicle" SET "maintenanceData" = NULL WHERE "maintenanceData" IS NOT NULL`
        );
      } catch { /* non-fatal */ }
      return true;
    }
  } catch (e) {
    console.error('Auto-seed check failed (non-fatal):', e);
  }
  return false;
}

export async function findMaintenanceTemplate(
  manufacturer: string,
  model: string,
  year: number,
  fuelType: string | null
): Promise<MaintenanceTemplateItem[] | null> {
  await ensureMaintenanceTemplateTable();

  // Normalize inputs for matching (resolve aliases like "מזדה" → "מאזדה")
  const mfr = normalizeManufacturer(manufacturer);
  const mdl = model.trim();

  try {
    // Try exact match with fuel type first
    let results = await prisma.$queryRawUnsafe<Array<{ items: string }>>(
      `SELECT "items" FROM "MaintenanceTemplate"
       WHERE "manufacturer" = $1 AND "model" = $2
       AND "yearFrom" <= $3 AND "yearTo" >= $3
       AND ("fuelType" = $4 OR "fuelType" IS NULL)
       ORDER BY CASE WHEN "fuelType" = $4 THEN 0 ELSE 1 END
       LIMIT 1`,
      mfr, mdl, year, fuelType
    );

    if (results.length === 0) {
      // Try manufacturer-only match (generic schedule for all models of this brand)
      results = await prisma.$queryRawUnsafe<Array<{ items: string }>>(
        `SELECT "items" FROM "MaintenanceTemplate"
         WHERE "manufacturer" = $1 AND "model" = '*'
         AND "yearFrom" <= $2 AND "yearTo" >= $2
         LIMIT 1`,
        mfr, year
      );
    }

    if (results.length > 0) {
      return JSON.parse(results[0].items) as MaintenanceTemplateItem[];
    }
  } catch (e) {
    console.error('Error finding maintenance template:', e);
  }

  return null;
}

/**
 * Calculate next service km and build schedule from template items.
 */
export function calculateScheduleFromTemplate(
  items: MaintenanceTemplateItem[],
  currentMileage: number,
  manufacturer: string,
  model: string,
  year: number
) {
  const enrichedItems = items.map(item => {
    // Calculate next km this item is due
    const intervalsPassed = Math.floor(currentMileage / item.intervalKm);
    const nextAtKm = (intervalsPassed + 1) * item.intervalKm;

    // Calculate priority based on how close we are
    const kmUntilDue = nextAtKm - currentMileage;
    let priority: 'high' | 'medium' | 'low';
    if (kmUntilDue <= 2000) {
      priority = 'high';
    } else if (kmUntilDue <= 5000) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    return {
      ...item,
      nextAtKm,
      priority,
    };
  });

  // Sort by priority (high first) then by nextAtKm
  enrichedItems.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.nextAtKm - b.nextAtKm;
  });

  // Next service is at the nearest interval
  const nextServiceKm = Math.min(...enrichedItems.map(i => i.nextAtKm));

  // Estimate date based on ~15,000 km/year
  const kmToNext = nextServiceKm - currentMileage;
  const daysToNext = Math.round((kmToNext / 15000) * 365);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToNext);
  const nextServiceDate = nextDate.toISOString().split('T')[0];

  // Summary of high-priority items
  const highPriorityItems = enrichedItems
    .filter(i => i.priority === 'high')
    .map(i => i.item)
    .slice(0, 3);

  const summary = highPriorityItems.length > 0
    ? `שירות תחזוקה הכולל ${highPriorityItems.join(', ')}`
    : `טיפול שגרתי ב-${nextServiceKm.toLocaleString()} ק"מ`;

  return {
    nextServiceKm,
    nextServiceDate,
    summary,
    items: enrichedItems,
    generatedAt: new Date().toISOString(),
    basedOnMileage: currentMileage,
    source: 'oem_database' as const,
  };
}

/**
 * Seed a maintenance template into the database.
 */
export async function seedMaintenanceTemplate(template: MaintenanceTemplateData): Promise<void> {
  await ensureMaintenanceTemplateTable();

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MaintenanceTemplate" ("id", "manufacturer", "model", "yearFrom", "yearTo", "fuelType", "source", "items", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT ("manufacturer", "model", "yearFrom", "yearTo", "fuelType")
       DO UPDATE SET "items" = $7, "source" = $6, "updatedAt" = CURRENT_TIMESTAMP`,
      template.manufacturer, template.model, template.yearFrom, template.yearTo,
      template.fuelType, `${template.source}_v${TEMPLATE_VERSION}`, JSON.stringify(template.items)
    );
  } catch (e) {
    console.error('Error seeding maintenance template:', e);
  }
}

// ============================================================
// Seed Data — Popular Israeli Market Vehicles
// ============================================================

export const ISRAELI_MARKET_TEMPLATES: MaintenanceTemplateData[] = [
  // ---- SKODA ----
  {
    manufacturer: 'סקודה',
    model: '*', // Applies to all Skoda models (VW Group standard intervals)
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'החלפת שמן סינטטי ומסנן שמן לשמירה על ביצועי המנוע' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'מסנן אוויר נקי מבטיח שריפה יעילה וחיסכון בדלק' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '60-120 ₪', description: 'מסנן תא הנוסעים מסנן אבק ומזהמים מהאוויר בתוך הרכב' },
      { category: 'בלמים', item: 'בדיקת רפידות בלמים קדמיות', intervalKm: 30000, intervalMonths: 24, estimatedCost: '400-800 ₪', description: 'בדיקת עובי רפידות הבלמים והחלפה במידת הצורך' },
      { category: 'בלמים', item: 'בדיקת רפידות בלמים אחוריות', intervalKm: 60000, intervalMonths: 48, estimatedCost: '350-700 ₪', description: 'בדיקת רפידות אחוריות — בלאי איטי יותר מקדמיות' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 60000, intervalMonths: 24, estimatedCost: '150-250 ₪', description: 'נוזל בלמים סופג לחות לאורך זמן ומאבד מיעילותו' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: 'נוזל קירור מונע התחממות יתר והקפאה של המנוע' },

      { category: 'צמיגים', item: 'החלפת צמיגים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '1,200-2,400 ₪', description: 'החלפת 4 צמיגים בהתאם לבלאי — בטיחות קריטית' },
      { category: 'רצועות', item: 'בדיקת רצועת טיימינג', intervalKm: 90000, intervalMonths: 60, estimatedCost: '1,500-2,500 ₪', description: 'קריעת רצועת טיימינג עלולה לגרום לנזק חמור למנוע' },
      { category: 'מתלים', item: 'בדיקת בולמי זעזועים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '800-1,600 ₪', description: 'בולמי זעזועים משפיעים על יציבות הרכב ונוחות הנסיעה' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '200-400 ₪', description: 'מצתים בלויים פוגעים בביצועי המנוע ובצריכת הדלק' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר (DSG/אוטומט)', intervalKm: 60000, intervalMonths: 48, estimatedCost: '500-900 ₪', description: 'החלפת שמן גיר DSG שומרת על תיבת ההילוכים ומונעת תקלות' },
      { category: 'כללי', item: 'בדיקה כללית', intervalKm: 15000, intervalMonths: 12, estimatedCost: '0 ₪', description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- HYUNDAI ----
  {
    manufacturer: 'יונדאי',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '220-380 ₪', description: 'החלפת שמן ומסנן — הטיפול הבסיסי ביותר לשמירה על המנוע' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, estimatedCost: '70-130 ₪', description: 'מסנן אוויר נקי חיוני לביצועי מנוע מיטביים' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן דלק', intervalKm: 60000, intervalMonths: 48, estimatedCost: '100-200 ₪', description: 'מסנן דלק מגן על מערכת ההזרקה מפני זיהומים' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '50-100 ₪', description: 'מסנן קבינה לאוויר נקי ונעים בתוך הרכב' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '400-800 ₪', description: 'בדיקת רפידות, דיסקים וצנרת בלמים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '120-220 ₪', description: 'נוזל בלמים חדש מבטיח בלימה אפקטיבית' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 60, estimatedCost: '180-300 ₪', description: 'נוזל קירור מונע התחממות יתר של המנוע' },

      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר (V-belt)', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-600 ₪', description: 'רצועת עזר מפעילה מזגן, הגה כוח ואלטרנטור' },
      { category: 'מתלים', item: 'בדיקת מתלים ובולמי זעזועים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '700-1,400 ₪', description: 'מתלים תקינים חיוניים לבטיחות ונוחות' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, estimatedCost: '150-350 ₪', description: 'מצתים חדשים משפרים ביצועים וצריכת דלק' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי', intervalKm: 80000, intervalMonths: 60, estimatedCost: '400-800 ₪', description: 'שמן גיר נקי מונע שחיקה מוקדמת של תיבת ההילוכים' },
      { category: 'כללי', item: 'בדיקה כללית', intervalKm: 15000, intervalMonths: 12, estimatedCost: '0 ₪', description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- TOYOTA ----
  {
    manufacturer: 'טויוטה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'טויוטה ישראל — החלפה כל 15,000 ק"מ או שנה' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 45000, intervalMonths: 36, estimatedCost: '80-140 ₪', description: 'מסנן אוויר מנוע — החלפה כל 3 טיפולים' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '60-110 ₪', description: 'שמירה על אוויר נקי בתא הנוסעים — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת רפידות ודיסקי בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '400-900 ₪', description: 'בדיקה והחלפה לפי בלאי — בטיחות קריטית' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 36, estimatedCost: '130-230 ₪', description: 'מונע קורוזיה במערכת הבלמים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 160000, intervalMonths: 84, estimatedCost: '200-350 ₪', description: 'טויוטה משתמשת בנוזל Super Long Life — החלפה נדירה' },

      { category: 'צמיגים', item: 'החלפת צמיגים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '1,000-2,200 ₪', description: 'החלפת סט צמיגים בהתאם למידת הבלאי' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 105000, intervalMonths: 72, estimatedCost: '250-500 ₪', description: 'רצועת עזר מפעילה מערכות עזר במנוע' },
      { category: 'מתלים', item: 'בדיקת מתלים ובולמים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '800-1,500 ₪', description: 'יציבות ונוחות נסיעה' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 105000, intervalMonths: 72, estimatedCost: '200-400 ₪', description: 'מצתי אירידיום של טויוטה מחזיקים עד 100,000 ק"מ' },
      { category: 'תיבת הילוכים', item: 'בדיקת שמן גיר CVT/אוטומט', intervalKm: 75000, intervalMonths: 60, estimatedCost: '400-700 ₪', description: 'בדיקה והחלפה לפי סוג התיבה' },
      { category: 'כללי', item: 'בדיקה כללית', intervalKm: 15000, intervalMonths: 12, estimatedCost: '0 ₪', description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- KIA ----
  {
    manufacturer: 'קיה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '220-370 ₪', description: 'טיפול בסיסי — שמירה על המנוע באחריות קיה 7 שנים' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, estimatedCost: '70-130 ₪', description: 'מסנן אוויר חדש לביצועי מנוע מיטביים' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '50-100 ₪', description: 'אוויר נקי בתא הנוסעים' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '350-750 ₪', description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '120-200 ₪', description: 'נוזל חדש לבלימה בטוחה' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 60, estimatedCost: '170-280 ₪', description: 'מניעת התחממות יתר' },

      { category: 'רצועות', item: 'בדיקת רצועת עזר', intervalKm: 60000, intervalMonths: 48, estimatedCost: '300-550 ₪', description: 'בדיקה ויזואלית והחלפה לפי מצב' },
      { category: 'מתלים', item: 'בדיקת מתלים ובולמים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '700-1,300 ₪', description: 'שמירה על יציבות ובטיחות' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, estimatedCost: '150-300 ₪', description: 'מצתים חדשים לביצועים ויעילות' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי', intervalKm: 80000, intervalMonths: 60, estimatedCost: '400-750 ₪', description: 'שמירה על תיבת ההילוכים' },
      { category: 'כללי', item: 'בדיקה כללית', intervalKm: 15000, intervalMonths: 12, estimatedCost: '0 ₪', description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- MAZDA ----
  {
    manufacturer: 'מאזדה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'שמן סינטטי 0W-20 מומלץ למנועי SkyActiv' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-140 ₪', description: 'מסנן אוויר נקי לטכנולוגיית SkyActiv' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 20000, intervalMonths: 18, estimatedCost: '60-110 ₪', description: 'אוויר נקי ונעים' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '400-850 ₪', description: 'בדיקה והחלפה לפי בלאי' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, estimatedCost: '130-220 ₪', description: 'שמירה על מערכת בלימה אפקטיבית' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, estimatedCost: '200-320 ₪', description: 'נוזל קירור FL22 ייעודי למאזדה' },

      { category: 'מתלים', item: 'בדיקת מתלים ובולמים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '800-1,400 ₪', description: 'בדיקת מערכת המתלים' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, estimatedCost: '180-350 ₪', description: 'מצתים ייעודיים למנועי SkyActiv' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי', intervalKm: 80000, intervalMonths: 60, estimatedCost: '450-800 ₪', description: 'שמן SkyActiv-Drive ייעודי' },
      { category: 'כללי', item: 'בדיקה כללית', intervalKm: 15000, intervalMonths: 12, estimatedCost: '0 ₪', description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- SEAT / CUPRA (VW Group — similar to Skoda) ----
  {
    manufacturer: 'סיאט',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '250-400 ₪', description: 'מרווח VW Group סטנדרטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, estimatedCost: '80-150 ₪', description: 'מסנן אוויר — מרווח VW Group' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, estimatedCost: '60-120 ₪', description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת רפידות בלמים', intervalKm: 30000, intervalMonths: 24, estimatedCost: '400-800 ₪', description: 'בדיקת בלמים קדמיים ואחוריים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 60000, intervalMonths: 24, estimatedCost: '150-250 ₪', description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, estimatedCost: '200-350 ₪', description: 'נוזל קירור G13' },

      { category: 'רצועות', item: 'בדיקת רצועת טיימינג', intervalKm: 90000, intervalMonths: 60, estimatedCost: '1,500-2,500 ₪', description: 'קריטי — רצועה קרועה = נזק למנוע' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, estimatedCost: '200-400 ₪', description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DSG', intervalKm: 60000, intervalMonths: 48, estimatedCost: '500-900 ₪', description: 'שמן DSG — קריטי לתיבות כפולות' },
      { category: 'כללי', item: 'בדיקה כללית', intervalKm: 15000, intervalMonths: 12, estimatedCost: '0 ₪', description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },
];

/**
 * Seed all templates into the database.
 */
export async function seedAllTemplates(): Promise<number> {
  let count = 0;
  for (const template of ISRAELI_MARKET_TEMPLATES) {
    await seedMaintenanceTemplate(template);
    count++;
  }
  return count;
}
