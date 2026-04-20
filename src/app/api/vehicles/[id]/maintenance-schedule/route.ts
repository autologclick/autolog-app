import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { findMaintenanceTemplate, calculateScheduleFromTemplate, ensureTemplatesUpToDate } from '@/lib/maintenance-templates';

/**
 * GET /api/vehicles/[id]/maintenance-schedule
 *
 * Returns AI-generated maintenance schedule based on manufacturer guidelines.
 * Caches results in the database for performance.
 */

interface MaintenanceItem {
  category: string;
  item: string;
  intervalKm: number;
  intervalMonths: number;
  nextAtKm: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

interface MaintenanceSchedule {
  nextServiceKm: number;
  nextServiceDate: string;
  summary: string;
  items: MaintenanceItem[];
  generatedAt: string;
  basedOnMileage: number;
}

// Ensure the maintenanceData column exists (self-migration)
let migrationChecked = false;
async function ensureColumn() {
  if (migrationChecked) return;
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "maintenanceData" TEXT`
    );
  } catch {
    // Column might already exist or DB doesn't support IF NOT EXISTS — ignore
  }
  migrationChecked = true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Fetch vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        manufacturer: true,
        model: true,
        year: true,
        mileage: true,
        fuelType: true,
      },
    });

    if (!vehicle) {
      return jsonResponse({ error: 'רכב לא נמצא' }, 404);
    }

    // Ownership check — non-admins can only see their own vehicles
    if (payload.role !== 'admin' && vehicle.userId !== payload.userId) {
      return jsonResponse({ error: 'אין הרשאה' }, 403);
    }

    // If vehicle has no mileage, try to get from latest treatment
    if (!vehicle.mileage || vehicle.mileage <= 0) {
      const latestTreatment = await prisma.treatment.findFirst({
        where: { vehicleId: id, mileage: { gt: 0 } },
        orderBy: { date: 'desc' },
        select: { mileage: true },
      });
      if (latestTreatment?.mileage && latestTreatment.mileage > 0) {
        vehicle.mileage = latestTreatment.mileage;
        // Also update the vehicle record for future use
        await prisma.vehicle.update({
          where: { id },
          data: { mileage: latestTreatment.mileage },
        });
      }
    }

    if (!vehicle.mileage || vehicle.mileage <= 0) {
      return jsonResponse({ error: 'יש לעדכן קילומטראז\' לפני חישוב טיפול הבא' }, 400);
    }

    // Ensure OEM templates are up-to-date (clears cache if re-seeded)
    const reSeeded = await ensureTemplatesUpToDate();

    // Try to get cached data
    await ensureColumn();

    let cachedData: string | null = null;
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ maintenanceData: string | null }>>(
        `SELECT "maintenanceData" FROM "Vehicle" WHERE "id" = $1`,
        id
      );
      cachedData = result[0]?.maintenanceData || null;
    } catch {
      // Column might not exist yet
    }

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData) as MaintenanceSchedule;
        const generatedAt = new Date(parsed.generatedAt);
        const daysSinceGenerated = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Cache valid for 30 days, mileage hasn't changed much, AND nextService is still ahead
        const currentMileage = vehicle.mileage || 0;
        if (
          daysSinceGenerated < 30 &&
          Math.abs(parsed.basedOnMileage - currentMileage) < 5000 &&
          parsed.nextServiceKm > currentMileage
        ) {
          return jsonResponse({ schedule: parsed, cached: true });
        }
      } catch {
        // Invalid cache, regenerate
      }
    }

    // Generate with AI
    const schedule = await generateMaintenanceSchedule(vehicle);

    if (!schedule) {
      return jsonResponse({ error: 'לא ניתן לחשב לוח טיפולים כרגע' }, 503);
    }

    // Cache the result
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Vehicle" SET "maintenanceData" = $1 WHERE "id" = $2`,
        JSON.stringify(schedule),
        id
      );
    } catch (e) {
      console.error('Failed to cache maintenance data:', e);
    }

    return jsonResponse({ schedule, cached: false });
  } catch (error) {
    return handleApiError(error);
  }
}

// Force refresh endpoint
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true, userId: true, manufacturer: true,
        model: true, year: true, mileage: true, fuelType: true,
      },
    });

    if (!vehicle || vehicle.userId !== payload.userId) {
      return jsonResponse({ error: 'רכב לא נמצא או אין הרשאה' }, 404);
    }

    // If vehicle has no mileage, try to get from latest treatment
    if (!vehicle.mileage || vehicle.mileage <= 0) {
      const latestTreatment = await prisma.treatment.findFirst({
        where: { vehicleId: id, mileage: { gt: 0 } },
        orderBy: { date: 'desc' },
        select: { mileage: true },
      });
      if (latestTreatment?.mileage && latestTreatment.mileage > 0) {
        vehicle.mileage = latestTreatment.mileage;
        await prisma.vehicle.update({
          where: { id },
          data: { mileage: latestTreatment.mileage },
        });
      }
    }

    if (!vehicle.mileage || vehicle.mileage <= 0) {
      return jsonResponse({ error: 'יש לעדכן קילומטראז\' לפני חישוב טיפול הבא' }, 400);
    }

    await ensureColumn();
    const schedule = await generateMaintenanceSchedule(vehicle);

    if (!schedule) {
      return jsonResponse({ error: 'לא ניתן לחשב לוח טיפולים כרגע' }, 503);
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Vehicle" SET "maintenanceData" = $1 WHERE "id" = $2`,
        JSON.stringify(schedule),
        id
      );
    } catch (e) {
      console.error('Failed to cache maintenance data:', e);
    }

    return jsonResponse({ schedule, cached: false });
  } catch (error) {
    return handleApiError(error);
  }
}

async function generateMaintenanceSchedule(vehicle: {
  manufacturer: string;
  model: string;
  year: number;
  mileage: number | null;
  fuelType: string | null;
}): Promise<MaintenanceSchedule | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    console.error('No AI API key configured');
    return null;
  }

  const mileage = vehicle.mileage || 0;

  // ===== HYBRID APPROACH: Try OEM database first, then AI fallback =====
  try {
    const templateItems = await findMaintenanceTemplate(
      vehicle.manufacturer, vehicle.model, vehicle.year, vehicle.fuelType
    );
    if (templateItems && templateItems.length > 0) {
      return calculateScheduleFromTemplate(
        templateItems, mileage, vehicle.manufacturer, vehicle.model, vehicle.year
      );
    }
  } catch {
    // Template lookup failed — fall through to AI generation
  }

  const prompt = `You are an expert automotive mechanic with deep knowledge of manufacturer maintenance schedules for all car brands worldwide, specializing in the Israeli market.

Given this vehicle:
- Manufacturer: ${vehicle.manufacturer}
- Model: ${vehicle.model}
- Year: ${vehicle.year}
- Current Mileage: ${mileage.toLocaleString()} km
- Fuel Type: ${vehicle.fuelType || 'Unknown'}

Based on the OFFICIAL manufacturer maintenance schedule for this EXACT vehicle model, provide a detailed maintenance schedule.

CRITICAL — MANDATORY BASIC ITEMS (must appear in EVERY schedule):
These 3 items are done at every regular service and MUST be included with the base service interval:
1. "החלפת שמן מנוע ומסנן שמן" — category "שמן ומסננים" — interval 15000 km (or 10000 for Chinese brands)
2. "החלפת פילטר מזגן" — category "שמן ומסננים" — interval 15000 km (or 10000 for Chinese brands)
3. "בדיקה כללית" — category "כללי" — interval 15000 km (or 10000 for Chinese brands)

IMPORTANT RULES:
- The first two items above are basic replacements done at EVERY service visit — they must have the same intervalKm as the base service cycle.
- Include additional REPLACEMENT or FLUID CHANGE items (air filter, brake pads, spark plugs, coolant, transmission fluid, belts, tires, brake fluid).
- Do NOT include inspection-only items (e.g., "בדיקת בלמים", "בדיקת צמיגים"). Inspections are handled separately.
- The "בדיקה כללית" item description should list what to CHECK at this service: fluids, tire pressure, lights, battery, brake pads thickness, suspension, belts, computer diagnostics.
- "פילטר מזגן" is the Israeli term for cabin air filter (not "מסנן תא נוסעים").
- Do NOT include any cost estimates or prices.
- All intervals MUST be multiples of the base service interval (15000 or 10000) to ensure items align properly at service milestones.

Calculate:
1. When the NEXT service is due (in km and approximate date assuming ~15,000 km/year)
2. All REPLACEMENT items with their manufacturer-recommended intervals
3. Priority level for each item based on current mileage

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "nextServiceKm": <number - next service milestone in km, must be a multiple of the base interval>,
  "nextServiceDate": "<YYYY-MM-DD approximate date>",
  "summary": "<one line summary in Hebrew of what's needed next>",
  "items": [
    {
      "category": "<category in Hebrew: שמן ומסננים / בלמים / צמיגים / חשמל / מתלים / רצועות / נוזלים / מנוע / תיבת הילוכים / מיזוג / כללי>",
      "item": "<specific item name in Hebrew — must be a REPLACEMENT action, e.g. החלפת שמן, החלפת מסנן, NOT בדיקת...>",
      "intervalKm": <manufacturer recommended interval in km — MUST be a multiple of 15000 or 10000>,
      "intervalMonths": <manufacturer recommended interval in months>,
      "nextAtKm": <next km this item is due — calculated from current mileage>,
      "priority": "<high/medium/low based on urgency at current mileage>",
      "description": "<brief description in Hebrew of why this is needed>"
    }
  ]
}

Include 8-12 REPLACEMENT items plus the one "בדיקה כללית" item. Sort by priority (high first).
Use accurate manufacturer intervals for this EXACT model — do NOT guess. If unsure about a specific interval for this model, use industry-standard intervals for the same engine type/displacement.
All text fields should be in Hebrew.`;

  // Try Anthropic Haiku first (fastest + cheapest), then OpenAI as fallback
  if (anthropicKey) {
    try {
      const result = await generateWithAnthropic(anthropicKey, prompt, mileage);
      if (result) return result;
    } catch (error) {
      console.error('Anthropic generation error:', error);
    }
  }

  if (openaiKey) {
    try {
      const result = await generateWithOpenAI(openaiKey, prompt, mileage);
      if (result) return result;
    } catch (error) {
      console.error('OpenAI generation error:', error);
    }
  }

  return null;
}

async function generateWithOpenAI(apiKey: string, prompt: string, mileage: number): Promise<MaintenanceSchedule | null> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('OpenAI error:', err);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) return null;

  // Safely extract JSON - handle possible text preamble from AI
  const cleaned = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return sanitizeSchedule(parsed, mileage);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return sanitizeSchedule(parsed, mileage);
    }
    throw new Error('No valid JSON found in OpenAI response: ' + cleaned.substring(0, 100));
  }
}

async function generateWithAnthropic(apiKey: string, prompt: string, mileage: number): Promise<MaintenanceSchedule | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      temperature: 0.2,
      system: 'You are a JSON API endpoint for a vehicle maintenance application. You MUST respond with ONLY a valid JSON object. Never include any text, explanation, disclaimers, or conversation before or after the JSON. If you are unsure about specific manufacturer intervals, use widely accepted industry-standard intervals. Your response must start with { and end with }.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Anthropic error:', err);
    return null;
  }

  const data = await response.json();
  const content = data.content?.[0]?.text?.trim();

  if (!content) return null;

  // Safely extract JSON - handle possible text preamble from AI
  const cleaned = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return sanitizeSchedule(parsed, mileage);
  } catch {
    // Try extracting JSON object from text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return sanitizeSchedule(parsed, mileage);
    }
    throw new Error('No valid JSON found in Anthropic response: ' + cleaned.substring(0, 100));
  }
}

/**
 * Sanitize AI-generated schedule: ensure nextServiceKm is AHEAD of current mileage.
 * AI sometimes returns the current interval milestone instead of the next one.
 */
function sanitizeSchedule(parsed: Record<string, unknown>, mileage: number): MaintenanceSchedule {
  let nextKm = parsed.nextServiceKm as number;

  // If AI returned a nextServiceKm that's already passed, find the correct next one
  if (nextKm <= mileage) {
    // Try to find the nearest future km from individual items
    const items = (parsed.items as Array<{ nextAtKm?: number; intervalKm?: number }>) || [];
    const futureKms = items
      .map(item => {
        if (item.nextAtKm && item.nextAtKm > mileage) return item.nextAtKm;
        // Recalculate from intervalKm
        if (item.intervalKm && item.intervalKm > 0) {
          const passed = Math.floor(mileage / item.intervalKm);
          return (passed + 1) * item.intervalKm;
        }
        return null;
      })
      .filter((km): km is number => km !== null && km > mileage);

    if (futureKms.length > 0) {
      nextKm = Math.min(...futureKms);
    } else {
      // Fallback: round up to next 5000 km
      nextKm = Math.ceil(mileage / 5000) * 5000;
      if (nextKm <= mileage) nextKm += 5000;
    }
  }

  // Also fix individual items that are behind current mileage
  const fixedItems = ((parsed.items as Array<Record<string, unknown>>) || []).map(item => {
    const nextAtKm = item.nextAtKm as number;
    const intervalKm = item.intervalKm as number;
    if (nextAtKm && nextAtKm <= mileage && intervalKm && intervalKm > 0) {
      const passed = Math.floor(mileage / intervalKm);
      item.nextAtKm = (passed + 1) * intervalKm;
    }
    return item;
  });

  // Ensure mandatory basic items exist — oil change, cabin filter, general inspection
  const baseInterval = Math.min(
    ...fixedItems.filter(i => (i.intervalKm as number) > 0).map(i => i.intervalKm as number),
    15000
  );
  const mandatoryItems = [
    { category: 'שמן ומסננים', item: 'החלפת שמן מנוע ומסנן שמן', intervalKm: baseInterval, intervalMonths: 12, description: 'החלפת שמן ומסנן — הטיפול הבסיסי ביותר לשמירה על המנוע' },
    { category: 'שמן ומסננים', item: 'החלפת פילטר מזגן', intervalKm: baseInterval, intervalMonths: 12, description: 'מסנן קבינה לאוויר נקי בתוך הרכב' },
    { category: 'כללי', item: 'בדיקה כללית', intervalKm: baseInterval, intervalMonths: 12, description: 'בדיקת נוזלים, לחץ צמיגים, תאורה, מצבר, בולמים, רפידות, מתלים, רצועות ואבחון מחשב' },
  ];

  for (const mandatory of mandatoryItems) {
    const exists = fixedItems.some(i =>
      (i.item as string)?.includes(mandatory.item.substring(0, 10)) ||
      (mandatory.category === 'כללי' && (i.category as string) === 'כללי')
    );
    if (!exists) {
      const intervalsPassed = Math.floor(mileage / mandatory.intervalKm);
      const nextAtKm = (intervalsPassed + 1) * mandatory.intervalKm;
      fixedItems.unshift({
        ...mandatory,
        nextAtKm,
        priority: 'high',
      } as unknown as Record<string, unknown>);
    }
  }

  // Recalculate next service date
  const kmToNext = nextKm - mileage;
  const daysToNext = Math.max(1, Math.round((kmToNext / 15000) * 365));
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToNext);

  return {
    ...parsed,
    summary: (parsed.summary as string) || `טיפול שגרתי ב-${nextKm.toLocaleString()} ק"מ`,
    nextServiceKm: nextKm,
    nextServiceDate: nextDate.toISOString().split('T')[0],
    items: fixedItems,
    generatedAt: new Date().toISOString(),
    basedOnMileage: mileage,
  } as unknown as MaintenanceSchedule;
}
