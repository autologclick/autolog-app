import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { findMaintenanceTemplate, calculateScheduleFromTemplate } from '@/lib/maintenance-templates';

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
  estimatedCost: string;
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

        // Cache valid for 30 days or until mileage changes significantly
        if (daysSinceGenerated < 30 && Math.abs(parsed.basedOnMileage - (vehicle.mileage || 0)) < 5000) {
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

  const prompt = `You are an expert automotive mechanic with deep knowledge of manufacturer maintenance schedules for all car brands worldwide.

Given this vehicle:
- Manufacturer: ${vehicle.manufacturer}
- Model: ${vehicle.model}
- Year: ${vehicle.year}
- Current Mileage: ${mileage.toLocaleString()} km
- Fuel Type: ${vehicle.fuelType || 'Unknown'}

Based on the OFFICIAL manufacturer maintenance schedule for this specific vehicle, provide a detailed maintenance schedule.

Calculate:
1. When the NEXT service is due (in km and approximate date assuming ~15,000 km/year)
2. All maintenance items that should be checked/replaced at each service interval
3. Priority level for each item based on current mileage

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "nextServiceKm": <number - next service milestone in km>,
  "nextServiceDate": "<YYYY-MM-DD approximate date>",
  "summary": "<one line summary in Hebrew of what's needed next>",
  "items": [
    {
      "category": "<category in Hebrew: שמן ומסננים / בלמים / צמיגים / חשמל / מתלים / רצועות / נוזלים / מנוע / תיבת הילוכים / מיזוג / כללי>",
      "item": "<specific item name in Hebrew>",
      "intervalKm": <manufacturer recommended interval in km>,
      "intervalMonths": <manufacturer recommended interval in months>,
      "nextAtKm": <next km this item is due>,
      "priority": "<high/medium/low based on urgency at current mileage>",
      "estimatedCost": "<estimated cost range in ILS, e.g. 200-400 ₪>",
      "description": "<brief description in Hebrew of why this is needed>"
    }
  ]
}

Include ALL relevant items (typically 8-15 items). Sort by priority (high first).
Use accurate manufacturer intervals — do NOT guess. If unsure about a specific interval for this model, use industry-standard intervals.
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
    return { ...parsed, generatedAt: new Date().toISOString(), basedOnMileage: mileage };
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { ...parsed, generatedAt: new Date().toISOString(), basedOnMileage: mileage };
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
    return { ...parsed, generatedAt: new Date().toISOString(), basedOnMileage: mileage };
  } catch {
    // Try extracting JSON object from text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { ...parsed, generatedAt: new Date().toISOString(), basedOnMileage: mileage };
    }
    throw new Error('No valid JSON found in Anthropic response: ' + cleaned.substring(0, 100));
  }
}
