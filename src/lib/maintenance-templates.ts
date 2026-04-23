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
 *   (no pricing — only replacement items and intervals)
 *   - description: Hebrew description of why this is needed
 */

import prisma from '@/lib/db';

export interface MaintenanceTemplateItem {
  category: string;
  item: string;
  intervalKm: number;
  intervalMonths: number;
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
const TEMPLATE_VERSION = 8;

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
  'bmw': 'ב.מ.וו', 'BMW': 'ב.מ.וו', 'Bmw': 'ב.מ.וו', 'בי אם וו': 'ב.מ.וו', 'בי.אם.וו': 'ב.מ.וו',
  // Mercedes
  'mercedes': 'מרצדס', 'MERCEDES': 'מרצדס', 'Mercedes': 'מרצדס', 'mercedes-benz': 'מרצדס', 'Mercedes-Benz': 'מרצדס',
  // Renault
  'renault': 'רנו', 'RENAULT': 'רנו', 'Renault': 'רנו',
  // Peugeot
  'peugeot': 'פיז\'ו', 'PEUGEOT': 'פיז\'ו', 'Peugeot': 'פיז\'ו', 'פז\'ו': 'פיז\'ו',
  // Citroen
  'citroen': 'סיטרואן', 'CITROEN': 'סיטרואן', 'Citroen': 'סיטרואן', 'citroën': 'סיטרואן',
  // Dacia
  'dacia': 'דאצ\'יה', 'DACIA': 'דאצ\'יה', 'Dacia': 'דאצ\'יה',
  // MG
  'mg': 'MG', 'Mg': 'MG',
  // Chery
  'chery': 'צ\'רי', 'CHERY': 'צ\'רי', 'Chery': 'צ\'רי',
  // Geely
  'geely': 'ג\'ילי', 'GEELY': 'ג\'ילי', 'Geely': 'ג\'ילי',
  // Subaru
  'subaru': 'סובארו', 'SUBARU': 'סובארו', 'Subaru': 'סובארו',
  // Ford
  'ford': 'פורד', 'FORD': 'פורד', 'Ford': 'פורד',
  // Audi
  'audi': 'אאודי', 'AUDI': 'אאודי', 'Audi': 'אאודי',
  // Opel
  'opel': 'אופל', 'OPEL': 'אופל', 'Opel': 'אופל',
  // Fiat
  'fiat': 'פיאט', 'FIAT': 'פיאט', 'Fiat': 'פיאט',
  // Lexus (Toyota luxury)
  'lexus': 'לקסוס', 'LEXUS': 'לקסוס', 'Lexus': 'לקסוס',
  // Volvo
  'volvo': 'וולוו', 'VOLVO': 'וולוו', 'Volvo': 'וולוו',
  // Jeep
  'jeep': 'ג\'יפ', 'JEEP': 'ג\'יפ', 'Jeep': 'ג\'יפ',
  // Chevrolet
  'chevrolet': 'שברולט', 'CHEVROLET': 'שברולט', 'Chevrolet': 'שברולט', 'chevy': 'שברולט',
  // Tesla
  'tesla': 'טסלה', 'TESLA': 'טסלה', 'Tesla': 'טסלה',
  // BYD
  'byd': 'BYD', 'BYD': 'BYD', 'Byd': 'BYD', 'ביד': 'BYD',
  // Mini (BMW Group)
  'mini': 'מיני', 'MINI': 'מיני', 'Mini': 'מיני',
  // Alfa Romeo
  'alfa romeo': 'אלפא רומיאו', 'ALFA ROMEO': 'אלפא רומיאו', 'Alfa Romeo': 'אלפא רומיאו', 'alfa': 'אלפא רומיאו',
  // Land Rover / Range Rover
  'land rover': 'לנד רובר', 'LAND ROVER': 'לנד רובר', 'Land Rover': 'לנד רובר', 'range rover': 'לנד רובר', 'Range Rover': 'לנד רובר', 'ריינג\' רובר': 'לנד רובר',
  // Jaguar
  'jaguar': 'יגואר', 'JAGUAR': 'יגואר', 'Jaguar': 'יגואר',
  // Porsche
  'porsche': 'פורשה', 'PORSCHE': 'פורשה', 'Porsche': 'פורשה',
  // Ssangyong
  'ssangyong': 'סאנגיונג', 'SSANGYONG': 'סאנגיונג', 'Ssangyong': 'סאנגיונג', 'SsangYong': 'סאנגיונג',
  // Isuzu
  'isuzu': 'איסוזו', 'ISUZU': 'איסוזו', 'Isuzu': 'איסוזו',
  // GWM / Haval (Great Wall Motors)
  'gwm': 'GWM', 'GWM': 'GWM', 'haval': 'GWM', 'HAVAL': 'GWM', 'Haval': 'GWM', 'האוול': 'GWM',
  // JAC
  'jac': 'JAC', 'JAC': 'JAC', 'Jac': 'JAC', 'ג\'אק': 'JAC',
  // Polestar (Volvo/Geely electric)
  'polestar': 'פולסטאר', 'POLESTAR': 'פולסטאר', 'Polestar': 'פולסטאר',
  // Smart
  'smart': 'סמארט', 'SMART': 'סמארט', 'Smart': 'סמארט',
  // DS (PSA luxury)
  'ds': 'DS', 'DS': 'DS',
  // Dodge / RAM
  'dodge': 'דודג\'', 'DODGE': 'דודג\'', 'Dodge': 'דודג\'', 'ram': 'דודג\'', 'RAM': 'דודג\'', 'Ram': 'דודג\'',
  // Infiniti (Nissan luxury)
  'infiniti': 'אינפיניטי', 'INFINITI': 'אינפיניטי', 'Infiniti': 'אינפיניטי',
  // BAIC
  'baic': 'BAIC', 'BAIC': 'BAIC',
  // Maxus (LDV)
  'maxus': 'מקסוס', 'MAXUS': 'מקסוס', 'Maxus': 'מקסוס', 'ldv': 'מקסוס', 'LDV': 'מקסוס',
  // Cupra (separate entry in case registered differently)
  'קופרא': 'סיאט',
  // Lancia
  'lancia': 'לנצ\'יה', 'LANCIA': 'לנצ\'יה', 'Lancia': 'לנצ\'יה',
  // Seat in Hebrew
  'סיאט': 'סיאט',
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
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'החלפת שמן סינטטי ומסנן שמן לשמירה על ביצועי המנוע' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר נקי מבטיח שריפה יעילה וחיסכון בדלק' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן תא הנוסעים מסנן אבק ומזהמים מהאוויר בתוך הרכב' },
      { category: 'בלמים', item: 'בדיקת רפידות בלמים קדמיות', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת עובי רפידות הבלמים והחלפה במידת הצורך' },
      { category: 'בלמים', item: 'בדיקת רפידות בלמים אחוריות', intervalKm: 60000, intervalMonths: 48, description: 'בדיקת רפידות אחוריות — בלאי איטי יותר מקדמיות' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 60000, intervalMonths: 24, description: 'נוזל בלמים סופג לחות לאורך זמן ומאבד מיעילותו' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור מונע התחממות יתר והקפאה של המנוע' },

      { category: 'צמיגים', item: 'החלפת צמיגים', intervalKm: 60000, intervalMonths: 48, description: 'החלפת 4 צמיגים בהתאם לבלאי — בטיחות קריטית' },
      { category: 'רצועות', item: 'בדיקת רצועת טיימינג', intervalKm: 90000, intervalMonths: 60, description: 'קריעת רצועת טיימינג עלולה לגרום לנזק חמור למנוע' },
      { category: 'מתלים', item: 'בדיקת בולמי זעזועים', intervalKm: 60000, intervalMonths: 48, description: 'בולמי זעזועים משפיעים על יציבות הרכב ונוחות הנסיעה' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים בלויים פוגעים בביצועי המנוע ובצריכת הדלק' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר (DSG/אוטומט)', intervalKm: 60000, intervalMonths: 48, description: 'החלפת שמן גיר DSG שומרת על תיבת ההילוכים ומונעת תקלות' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
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
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'החלפת שמן ומסנן — הטיפול הבסיסי ביותר לשמירה על המנוע' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר נקי חיוני לביצועי מנוע מיטביים' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן דלק', intervalKm: 60000, intervalMonths: 48, description: 'מסנן דלק מגן על מערכת ההזרקה מפני זיהומים' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה לאוויר נקי ונעים בתוך הרכב' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות, דיסקים וצנרת בלמים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'נוזל בלמים חדש מבטיח בלימה אפקטיבית' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 60, description: 'נוזל קירור מונע התחממות יתר של המנוע' },

      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר (V-belt)', intervalKm: 60000, intervalMonths: 48, description: 'רצועת עזר מפעילה מזגן, הגה כוח ואלטרנטור' },
      { category: 'מתלים', item: 'בדיקת מתלים ובולמי זעזועים', intervalKm: 60000, intervalMonths: 48, description: 'מתלים תקינים חיוניים לבטיחות ונוחות' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים חדשים משפרים ביצועים וצריכת דלק' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי', intervalKm: 80000, intervalMonths: 60, description: 'שמן גיר נקי מונע שחיקה מוקדמת של תיבת ההילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
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
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'טויוטה ישראל — החלפה כל 15,000 ק"מ או שנה' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 45000, intervalMonths: 36, description: 'מסנן אוויר מנוע — החלפה כל 3 טיפולים' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'שמירה על אוויר נקי בתא הנוסעים — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת רפידות ודיסקי בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקה והחלפה לפי בלאי — בטיחות קריטית' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 36, description: 'מונע קורוזיה במערכת הבלמים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 160000, intervalMonths: 84, description: 'טויוטה משתמשת בנוזל Super Long Life — החלפה נדירה' },

      { category: 'צמיגים', item: 'החלפת צמיגים', intervalKm: 60000, intervalMonths: 48, description: 'החלפת סט צמיגים בהתאם למידת הבלאי' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 105000, intervalMonths: 72, description: 'רצועת עזר מפעילה מערכות עזר במנוע' },
      { category: 'מתלים', item: 'בדיקת מתלים ובולמים', intervalKm: 60000, intervalMonths: 48, description: 'יציבות ונוחות נסיעה' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 105000, intervalMonths: 72, description: 'מצתי אירידיום של טויוטה מחזיקים עד 100,000 ק"מ' },
      { category: 'תיבת הילוכים', item: 'בדיקת שמן גיר CVT/אוטומט', intervalKm: 75000, intervalMonths: 60, description: 'בדיקה והחלפה לפי סוג התיבה' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
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
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'טיפול בסיסי — שמירה על המנוע באחריות קיה 7 שנים' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר חדש לביצועי מנוע מיטביים' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'אוויר נקי בתא הנוסעים' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'נוזל חדש לבלימה בטוחה' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 60, description: 'מניעת התחממות יתר' },

      { category: 'רצועות', item: 'בדיקת רצועת עזר', intervalKm: 60000, intervalMonths: 48, description: 'בדיקה ויזואלית והחלפה לפי מצב' },
      { category: 'מתלים', item: 'בדיקת מתלים ובולמים', intervalKm: 60000, intervalMonths: 48, description: 'שמירה על יציבות ובטיחות' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים חדשים לביצועים ויעילות' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי', intervalKm: 80000, intervalMonths: 60, description: 'שמירה על תיבת ההילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
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
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 0W-20 מומלץ למנועי SkyActiv' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר נקי לטכנולוגיית SkyActiv' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 20000, intervalMonths: 18, description: 'אוויר נקי ונעים' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקה והחלפה לפי בלאי' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'שמירה על מערכת בלימה אפקטיבית' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור FL22 ייעודי למאזדה' },

      { category: 'מתלים', item: 'בדיקת מתלים ובולמים', intervalKm: 60000, intervalMonths: 48, description: 'בדיקת מערכת המתלים' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים ייעודיים למנועי SkyActiv' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומטי', intervalKm: 80000, intervalMonths: 60, description: 'שמן SkyActiv-Drive ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
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
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'מרווח VW Group סטנדרטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר — מרווח VW Group' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת רפידות בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת בלמים קדמיים ואחוריים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 60000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור G13' },

      { category: 'רצועות', item: 'בדיקת רצועת טיימינג', intervalKm: 90000, intervalMonths: 60, description: 'קריטי — רצועה קרועה = נזק למנוע' },

      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DSG', intervalKm: 60000, intervalMonths: 48, description: 'שמן DSG — קריטי לתיבות כפולות' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- VOLKSWAGEN (VW Group) ----
  {
    manufacturer: 'פולקסווגן',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 5W-30/0W-20 לפי דרישת היצרן' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר לביצועי מנוע מיטביים' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן תא נוסעים — אוויר נקי ומונע ריחות' },
      { category: 'בלמים', item: 'בדיקת רפידות בלמים קדמיות', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת עובי רפידות והחלפה במידת הצורך' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 60000, intervalMonths: 24, description: 'VW דורש החלפה כל שנתיים — מונע קורוזיה' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל G13 ייעודי לקבוצת VW' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 90000, intervalMonths: 60, description: 'קריטי — קריעת רצועה גורמת לנזק חמור למנוע' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום/פלטינום לביצועים מיטביים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DSG/אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן DSG — קריטי לתיבות דאבל קלאץ\' של VW' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- NISSAN ----
  {
    manufacturer: 'ניסאן',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 5W-30 — הבסיס לכל טיפול' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע — חיוני לביצועים וחיסכון בדלק' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה לאוויר נקי' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות, דיסקים וצנרת' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'נוזל בלמים DOT4 — מניעת קורוזיה' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'ניסאן Super Long Life Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 75000, intervalMonths: 60, description: 'רצועת עזר מפעילה אלטרנטור ומזגן' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים ייעודיים לניסאן' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT', intervalKm: 60000, intervalMonths: 48, description: 'שמן CVT NS-3 ייעודי — קריטי לתיבות CVT של ניסאן' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- MITSUBISHI ----
  {
    manufacturer: 'מיצובישי',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי מלא 0W-20/5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה — החלפה כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים לבטיחות' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל Super Long Life Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 75000, intervalMonths: 60, description: 'רצועת V מפעילה מערכות עזר' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתי אירידיום' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT/אוטומט', intervalKm: 80000, intervalMonths: 60, description: 'שמן CVTF-J4 ייעודי למיצובישי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- SUZUKI ----
  {
    manufacturer: 'סוזוקי',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 0W-20 לחיסכון בדלק' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל Super Long Life' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 30000, intervalMonths: 24, description: 'מצתי ניקל סטנדרטיים — החלפה תדירה יותר' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT/אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן CVT Green 1 של סוזוקי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- HONDA ----
  {
    manufacturer: 'הונדה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן 0W-20 סינטטי מלא' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר לביצועי מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים קדמיים ואחוריים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 36, description: 'הונדה ממליצה החלפה כל 3 שנים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 72, description: 'Honda Long Life Coolant Type 2' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 105000, intervalMonths: 72, description: 'רצועת Serpentine' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 105000, intervalMonths: 72, description: 'מצתי אירידיום — מחזיקים מעמד ארוך' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT', intervalKm: 60000, intervalMonths: 48, description: 'שמן Honda HCF-2 ייעודי לתיבות CVT' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- BMW ----
  {
    manufacturer: 'ב.מ.וו',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן BMW LL-01 סינטטי מלא — כל 15,000 ק"מ בישראל' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'Micro-filter — מסנן קבינה עם פחם פעיל' },
      { category: 'בלמים', item: 'בדיקת רפידות ודיסקי בלמים', intervalKm: 30000, intervalMonths: 24, description: 'חיישני בלאי מתריעים — בדיקה ויזואלית כל טיפול' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'BMW דורש החלפה כל שנתיים — קריטי לביצועים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 48, description: 'BMW Antifreeze/Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 60000, intervalMonths: 48, description: 'רצועה ריבד Serpentine' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום NGK/Bosch' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט (ZF)', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ZF LifeGuard — למרות ש-BMW טוען "sealed for life"' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- MERCEDES ----
  {
    manufacturer: 'מרצדס',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן MB 229.5 סינטטי מלא' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה עם שכבת פחם פעיל' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים — חיישני בלאי מובנים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'מרצדס דורש החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'MB Coolant 325.0' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 75000, intervalMonths: 48, description: 'רצועת Poly-V' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים ייעודיים למרצדס' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר 9G-Tronic', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF 236.17 — קריטי לתיבות 9 הילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- RENAULT ----
  {
    manufacturer: 'רנו',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן RN0720 סינטטי 5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Glaceol RX Type D' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 75000, intervalMonths: 60, description: 'רצועת Poly-V' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 30000, intervalMonths: 24, description: 'מצתים — מרווח קצר יותר למנועי רנו TCe' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר EDC/אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן Elfmatic CVT ייעודי לרנו' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- PEUGEOT / CITROEN (PSA Group) ----
  {
    manufacturer: 'פיז\'ו',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Total Quartz INEO 5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור Revkogel 2000+' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 90000, intervalMonths: 72, description: 'קריטי — במנועי PureTech יש שרשרת טיימינג' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים ייעודיים למנועי PureTech/VTi' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר EAT6/EAT8', intervalKm: 60000, intervalMonths: 48, description: 'שמן Total Fluidmatic — קריטי לתיבות Aisin' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- CITROEN (same PSA intervals) ----
  {
    manufacturer: 'סיטרואן',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Total Quartz INEO 5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 90000, intervalMonths: 72, description: 'קריטי — קריעה גורמת לנזק חמור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- DACIA (Renault platform) ----
  {
    manufacturer: 'דאצ\'יה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן 5W-30 סינטטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 30000, intervalMonths: 24, description: 'מצתים — מנועי TCe של דאצ\'יה' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT/EDC', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי לתיבת הילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- MG (Chinese-owned, popular in Israel 2022+) ----
  {
    manufacturer: 'MG',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 10000, intervalMonths: 12, description: 'MG ממליצה כל 10,000 ק"מ — מרווח קצר יותר' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 20000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 40000, intervalMonths: 36, description: 'מצתים למנועי טורבו 1.5' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DCT/CVT', intervalKm: 60000, intervalMonths: 48, description: 'שמן DCT ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- CHERY (Chinese, growing in Israel) ----
  {
    manufacturer: 'צ\'רי',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 10000, intervalMonths: 12, description: 'שמן 5W-30 סינטטי — מרווח 10,000 ק"מ' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 20000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 40000, intervalMonths: 36, description: 'מצתים למנועי טורבו' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT/DCT', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי לתיבת הילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- SUBARU ----
  {
    manufacturer: 'סובארו',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן 0W-20 סינטטי למנועי בוקסר' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'סובארו ממליצה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Subaru Long Life Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 105000, intervalMonths: 72, description: 'קריטי למנועי בוקסר (FB/FA — שרשרת, EJ — רצועה)' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT (Lineartronic)', intervalKm: 60000, intervalMonths: 48, description: 'שמן CVT-II ייעודי לסובארו' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- AUDI (VW Group — premium intervals) ----
  {
    manufacturer: 'אאודי',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן VW 504/507 סינטטי מלא' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה עם פחם פעיל' },
      { category: 'בלמים', item: 'בדיקת רפידות ודיסקי בלמים', intervalKm: 30000, intervalMonths: 24, description: 'חיישני בלאי — בדיקה כל טיפול שני' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 60000, intervalMonths: 24, description: 'אאודי דורש החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל G13' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 90000, intervalMonths: 60, description: 'שרשרת ברוב הדגמים — בדיקת מתיחות' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר S-Tronic/Tiptronic', intervalKm: 60000, intervalMonths: 48, description: 'שמן DSG/ATF ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- FORD ----
  {
    manufacturer: 'פורד',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Ford Castrol 5W-20/5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'נוזל DOT4 — החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Motorcraft Orange Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 75000, intervalMonths: 60, description: 'רצועת Serpentine' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום למנועי EcoBoost' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר PowerShift/אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF Mercon — קריטי לתיבות PowerShift' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- OPEL (GM/Stellantis) ----
  {
    manufacturer: 'אופל',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Dexos2 5W-30 סינטטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Dex-Cool Long Life' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 90000, intervalMonths: 72, description: 'שרשרת ברוב מנועי 1.2T/1.4T' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- FIAT ----
  {
    manufacturer: 'פיאט',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Selenia 5W-30/5W-40' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור Paraflu UP' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 75000, intervalMonths: 60, description: 'קריטי — במנועי Fire/MultiAir' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DDCT/אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי לתיבות Dualogic/DDCT' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- GEELY (Chinese, growing in Israel) ----
  {
    manufacturer: 'ג\'ילי',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 10000, intervalMonths: 12, description: 'שמן 5W-30 סינטטי — מרווח 10,000 ק"מ' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 20000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 40000, intervalMonths: 36, description: 'מצתים למנועי טורבו' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DCT/אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי לתיבת הילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- LEXUS (Toyota luxury — similar intervals) ----
  {
    manufacturer: 'לקסוס',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי מלא 0W-20 — תקן לקסוס' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 45000, intervalMonths: 36, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת רפידות ודיסקי בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקה והחלפה לפי בלאי' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 36, description: 'מונע קורוזיה במערכת' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 160000, intervalMonths: 84, description: 'Toyota Super Long Life Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 105000, intervalMonths: 72, description: 'רצועת עזר' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 105000, intervalMonths: 72, description: 'מצתי אירידיום — מחזיקים עד 100K ק"מ' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט', intervalKm: 75000, intervalMonths: 60, description: 'שמן ATF WS ייעודי ללקסוס' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- VOLVO ----
  {
    manufacturer: 'וולוו',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן VCC RBS0-2AE 0W-20 סינטטי מלא' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה עם פחם פעיל IAQS' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'וולוו דורש החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Volvo Coolant VCS' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 90000, intervalMonths: 60, description: 'רצועת Poly-V' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום למנועי Drive-E' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט (Aisin)', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF לתיבת Aisin AW של וולוו' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- JEEP (Stellantis) ----
  {
    manufacturer: 'ג\'יפ',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 5W-30/0W-20 לפי דגם' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'OAT Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 75000, intervalMonths: 60, description: 'רצועת Serpentine' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים למנועי MultiAir/Tigershark' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר ZF 9HP', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ZF — קריטי לתיבות 9 הילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- CHEVROLET ----
  {
    manufacturer: 'שברולט',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Dexos1 Gen3 סינטטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Dex-Cool Long Life' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום ACDelco' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט', intervalKm: 75000, intervalMonths: 60, description: 'שמן Dexron VI ATF' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- TESLA (Electric — no oil changes!) ----
  {
    manufacturer: 'טסלה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: 'electric',
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן HEPA — חיוני לאיכות אוויר בקבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בלאי נמוך בזכות בלימה רגנרטיבית — בדיקה תקופתית' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 60000, intervalMonths: 24, description: 'טסלה ממליצה החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור מערכת חשמל', intervalKm: 120000, intervalMonths: 48, description: 'נוזל קירור למנוע חשמלי וסוללה' },
      { category: 'צמיגים', item: 'סיבוב/החלפת צמיגים', intervalKm: 15000, intervalMonths: 12, description: 'רכב חשמלי — בלאי צמיגים מהיר יותר בשל מומנט מיידי' },
      { category: 'מיזוג', item: 'ייבוש מערכת מיזוג (Desiccant)', intervalKm: 90000, intervalMonths: 72, description: 'החלפת חומר ייבוש במערכת המיזוג' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת לחץ צמיגים, תאורה, מצבר 12V, מערכת בלימה, מתלים, עדכון תוכנה ואבחון מחשב' },
    ]
  },

  // ---- BYD (Chinese electric/hybrid — fastest growing in Israel) ----
  {
    manufacturer: 'BYD',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בלאי מופחת בזכות בלימה רגנרטיבית' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור מערכת חשמל', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור לסוללה ומנוע חשמלי' },
      { category: 'צמיגים', item: 'סיבוב/החלפת צמיגים', intervalKm: 10000, intervalMonths: 12, description: 'בלאי מהיר יותר ברכב חשמלי — סיבוב כל טיפול' },
      { category: 'תיבת הילוכים', item: 'בדיקת/החלפת שמן גיר הפחתה', intervalKm: 60000, intervalMonths: 48, description: 'שמן גיר הפחתה למנוע חשמלי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת לחץ צמיגים, תאורה, מצבר 12V, מערכת בלימה, מתלים, מערכת חשמל ואבחון מחשב' },
    ]
  },

  // ---- MINI (BMW Group) ----
  {
    manufacturer: 'מיני',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן BMW LL-01 סינטטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'Micro-filter — מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת רפידות ודיסקי בלמים', intervalKm: 30000, intervalMonths: 24, description: 'חיישני בלאי מתריעים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'החלפה כל שנתיים — תקן BMW Group' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 48, description: 'BMW/MINI Coolant' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט/DCT', intervalKm: 60000, intervalMonths: 48, description: 'שמן Aisin ATF/DCT ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- ALFA ROMEO (Stellantis) ----
  {
    manufacturer: 'אלפא רומיאו',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Selenia K Power 5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור Paraflu UP' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 75000, intervalMonths: 60, description: 'קריטי — במנועי MultiAir' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים למנועי MultiAir/GME טורבו' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר ZF 8HP/DCT', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ZF LifeGuard' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- LAND ROVER / RANGE ROVER ----
  {
    manufacturer: 'לנד רובר',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Castrol Edge Professional 5W-20' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה PM2.5' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Land Rover OAT Coolant' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת עזר', intervalKm: 75000, intervalMonths: 60, description: 'רצועת Serpentine' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום למנועי Ingenium' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר ZF 8HP/9HP', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ZF LifeGuard 8' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות, מערכת שטח ואבחון מחשב' },
    ]
  },

  // ---- JAGUAR (JLR) ----
  {
    manufacturer: 'יגואר',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Castrol Edge Professional 5W-20' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Jaguar OAT Coolant' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתי אירידיום למנועי Ingenium' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר ZF 8HP', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ZF LifeGuard' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- PORSCHE ----
  {
    manufacturer: 'פורשה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Mobil 1 0W-40 מאושר פורשה A40' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה עם פחם פעיל' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים — PCCB קרמיים או פלדה' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'פורשה דורש החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Porsche Coolant G13' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים ייעודיים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר PDK/Tiptronic', intervalKm: 60000, intervalMonths: 48, description: 'שמן PDK — קריטי לתיבת הדאבל קלאץ\'' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- SSANGYONG ----
  {
    manufacturer: 'סאנגיונג',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט/DCT', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- ISUZU ----
  {
    manufacturer: 'איסוזו',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן 5W-30 CK-4 למנועי דיזל' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן דלק', intervalKm: 30000, intervalMonths: 24, description: 'מסנן דלק — קריטי למנועי דיזל' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור Long Life' },
      { category: 'מנוע', item: 'החלפת רצועת טיימינג', intervalKm: 90000, intervalMonths: 60, description: 'קריטי — רצועת טיימינג במנועי D-Max' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF Aisin' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- GWM / HAVAL (Great Wall Motors — Chinese) ----
  {
    manufacturer: 'GWM',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 10000, intervalMonths: 12, description: 'שמן 5W-30 סינטטי — מרווח 10,000 ק"מ' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 20000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 40000, intervalMonths: 36, description: 'מצתים למנועי טורבו' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר DCT/אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן DCT ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- JAC (Chinese) ----
  {
    manufacturer: 'JAC',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 10000, intervalMonths: 12, description: 'שמן 5W-30 סינטטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 20000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 40000, intervalMonths: 36, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT/DCT', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי לתיבת הילוכים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- POLESTAR (Volvo/Geely electric) ----
  {
    manufacturer: 'פולסטאר',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: 'electric',
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה IAQS' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בלאי מופחת בזכות בלימה רגנרטיבית' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור מערכת חשמל', intervalKm: 120000, intervalMonths: 48, description: 'נוזל קירור לסוללה ומנוע חשמלי' },
      { category: 'צמיגים', item: 'סיבוב/החלפת צמיגים', intervalKm: 15000, intervalMonths: 12, description: 'סיבוב צמיגים כל טיפול' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת לחץ צמיגים, תאורה, מצבר 12V, מערכת בלימה, מתלים, עדכון תוכנה ואבחון מחשב' },
    ]
  },

  // ---- SMART (electric/micro) ----
  {
    manufacturer: 'סמארט',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור מערכת חשמל', intervalKm: 120000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'צמיגים', item: 'סיבוב/החלפת צמיגים', intervalKm: 15000, intervalMonths: 12, description: 'סיבוב צמיגים' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת לחץ צמיגים, תאורה, מצבר 12V, מערכת בלימה, מתלים ואבחון מחשב' },
    ]
  },

  // ---- DS (PSA luxury brand) ----
  {
    manufacturer: 'DS',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Total Quartz INEO 5W-30' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 60000, intervalMonths: 48, description: 'מצתים למנועי PureTech' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר EAT8', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF Aisin' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- DODGE / RAM (Stellantis American) ----
  {
    manufacturer: 'דודג\'',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 5W-20/0W-20' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'OAT Coolant' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים למנועי HEMI/Pentastar' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר ZF 8HP', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ZF 8+HP' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- INFINITI (Nissan luxury) ----
  {
    manufacturer: 'אינפיניטי',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן סינטטי 5W-30 Ester Oil' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 30000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'Nissan Long Life Coolant' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתי אירידיום' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט 7AT', intervalKm: 60000, intervalMonths: 48, description: 'שמן ATF ייעודי לאינפיניטי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- BAIC (Chinese) ----
  {
    manufacturer: 'BAIC',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 10000, intervalMonths: 12, description: 'שמן 5W-30 סינטטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 20000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 40000, intervalMonths: 36, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר CVT/DCT', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- MAXUS / LDV (Chinese commercial) ----
  {
    manufacturer: 'מקסוס',
    model: '*',
    yearFrom: 2020,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 10000, intervalMonths: 12, description: 'שמן 5W-30 סינטטי' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 20000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 10000, intervalMonths: 12, description: 'מסנן קבינה — כל טיפול' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 20000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 40000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 100000, intervalMonths: 48, description: 'נוזל קירור' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 40000, intervalMonths: 36, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 10000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
    ]
  },

  // ---- LANCIA (Stellantis — Ypsilon in Israel) ----
  {
    manufacturer: 'לנצ\'יה',
    model: '*',
    yearFrom: 2015,
    yearTo: 2030,
    fuelType: null,
    source: 'manual',
    items: [
      { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: 15000, intervalMonths: 12, description: 'שמן Selenia 5W-40' },
      { category: 'שמן ומסננים', item: 'החלפת מסנן אוויר', intervalKm: 30000, intervalMonths: 24, description: 'מסנן אוויר מנוע' },
      { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: 15000, intervalMonths: 12, description: 'מסנן קבינה' },
      { category: 'בלמים', item: 'בדיקת מערכת בלמים', intervalKm: 30000, intervalMonths: 24, description: 'בדיקת רפידות ודיסקים' },
      { category: 'בלמים', item: 'החלפת נוזל בלמים', intervalKm: 45000, intervalMonths: 24, description: 'החלפה כל שנתיים' },
      { category: 'נוזלים', item: 'החלפת נוזל קירור', intervalKm: 120000, intervalMonths: 60, description: 'נוזל קירור Paraflu UP' },
      { category: 'רצועות', item: 'בדיקת/החלפת רצועת טיימינג', intervalKm: 75000, intervalMonths: 60, description: 'קריטי — במנועי Fire' },
      { category: 'מנוע', item: 'החלפת מצתים', intervalKm: 45000, intervalMonths: 36, description: 'מצתים' },
      { category: 'תיבת הילוכים', item: 'החלפת שמן גיר אוטומט', intervalKm: 60000, intervalMonths: 48, description: 'שמן ייעודי' },
      { category: 'כללי', item: 'אבחון כללי', intervalKm: 15000, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
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
