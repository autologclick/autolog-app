import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/vehicles/scan-license
 *
 * Server-side Vision API for full Israeli vehicle registration (רישיון רכב) extraction.
 * Uses OpenAI GPT-4o Vision when available, with Anthropic Claude as alternative.
 *
 * Accepts: { image: string } — base64 data URL of the license document photo
 * Returns: ScanResult (all fields optional) — fields the AI confidently read
 *
 * Backward compatibility:
 *   The frontend originally expected { licensePlate }; this still works since
 *   licensePlate remains one of the returned fields. Frontend now uses additional
 *   fields when available, so users get a pre-filled form even when the MOT
 *   (data.gov.il) lookup fails.
 *
 * Environment variables (set one):
 *   OPENAI_API_KEY — for OpenAI Vision
 *   ANTHROPIC_API_KEY — for Anthropic Claude Vision (alternative)
 */

export interface ScanResult {
  licensePlate?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  color?: string;
  fuelType?: string;
  vin?: string;
  ownerName?: string;
  testExpiryDate?: string;
}

const EXTRACTION_PROMPT = `You are reading an Israeli vehicle registration document (רישיון רכב).
Extract every field you can read with HIGH confidence. The document is in Hebrew, right-to-left.

Fields and their Hebrew labels on the document:
- "מספר רכב" → licensePlate: 7 or 8 digits. If shown as "1234567-8-9" (with check digits after dashes), return ONLY the first 7-8 digits before the first dash.
- "תוצרת" or "יצרן" → manufacturer: the brand (e.g., "טויוטה", "מאזדה", "Hyundai")
- "דגם" or "כינוי מסחרי" → model: the model name (e.g., "קורולה", "3", "i30")
- "שנת ייצור" → year: 4-digit year (e.g., "2019")
- "צבע" or "צבע רכב" → color: in Hebrew (e.g., "לבן", "שחור מטאלי")
- "סוג דלק" → fuelType: in Hebrew (e.g., "בנזין", "דיזל", "חשמלי", "היברידי")
- "מספר שלדה" or "מסגרת" → vin: alphanumeric VIN (17 chars usually)
- "תאריך תוקף" or "תוקף" → testExpiryDate: in YYYY-MM-DD format
- "שם בעל הרכב" or "בעלים" → ownerName: full name in Hebrew

Output STRICTLY a single JSON object, no markdown, no explanation, no code fences.
Use this exact shape, omitting any field you cannot read clearly:
{"licensePlate":"...","manufacturer":"...","model":"...","year":"...","color":"...","fuelType":"...","vin":"...","testExpiryDate":"...","ownerName":"..."}

Critical rules:
- If the document is unreadable, return {}
- Do NOT guess. Better to omit a field than return a wrong value.
- Do NOT include any field set to null, "unknown", "N/A", or empty string.
- year must be exactly 4 digits between 1980 and ${new Date().getFullYear() + 1}.
- licensePlate must be only digits, no letters.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'לא נשלחה תמונה' }, { status: 400 });
    }

    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'פורמט תמונה לא תקין' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      return NextResponse.json({ error: 'Vision API not configured' }, { status: 501 });
    }

    let result: ScanResult = {};

    if (openaiKey) {
      result = await extractWithOpenAI(openaiKey, image);
    }

    // If OpenAI returned nothing useful, try Anthropic as a second opinion
    if (!hasUsefulData(result) && anthropicKey) {
      const anthropicResult = await extractWithAnthropic(anthropicKey, image);
      // Merge: prefer existing OpenAI fields, fill gaps from Anthropic
      result = mergeResults(result, anthropicResult);
    }

    if (!hasUsefulData(result)) {
      return NextResponse.json({ error: 'לא זוהה מידע בתמונה' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Vision API scan error:', error);
    return NextResponse.json({ error: 'שגיאת שרת בזיהוי' }, { status: 500 });
  }
}

function hasUsefulData(r: ScanResult): boolean {
  return Object.values(r).some((v) => typeof v === 'string' && v.length > 0);
}

function mergeResults(primary: ScanResult, secondary: ScanResult): ScanResult {
  const merged: ScanResult = { ...primary };
  for (const k of Object.keys(secondary) as Array<keyof ScanResult>) {
    if (!merged[k] && secondary[k]) {
      merged[k] = secondary[k];
    }
  }
  return merged;
}

/**
 * Parse the raw JSON-ish response from the AI into a clean ScanResult.
 * Validates each field and discards anything that doesn't match expected shape.
 */
function parseAiJson(rawText: string): ScanResult {
  if (!rawText) return {};

  // Strip code fences if the model added them despite instructions
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let obj: Record<string, unknown> = {};
  try {
    obj = JSON.parse(cleaned);
  } catch {
    // Try to extract first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return {};
    try {
      obj = JSON.parse(m[0]);
    } catch {
      return {};
    }
  }

  if (!obj || typeof obj !== 'object') return {};

  const result: ScanResult = {};

  // licensePlate — strict numeric, 7-8 digits
  if (typeof obj.licensePlate === 'string') {
    const plateClean = obj.licensePlate.replace(/[-–—\s.]/g, '');
    const m = plateClean.match(/^(\d{7,8})/);
    if (m) result.licensePlate = m[1];
  }

  // year — 4 digits, sane range
  if (obj.year !== undefined && obj.year !== null) {
    const yearStr = String(obj.year).match(/\d{4}/)?.[0];
    if (yearStr) {
      const yearNum = parseInt(yearStr, 10);
      const maxYear = new Date().getFullYear() + 1;
      if (yearNum >= 1980 && yearNum <= maxYear) {
        result.year = yearStr;
      }
    }
  }

  // VIN — 11 to 17 alphanumeric (some older Israeli VINs are shorter)
  if (typeof obj.vin === 'string') {
    const vinClean = obj.vin.replace(/\s/g, '').toUpperCase();
    if (/^[A-Z0-9]{11,17}$/.test(vinClean)) {
      result.vin = vinClean;
    }
  }

  // testExpiryDate — YYYY-MM-DD or convertible
  if (typeof obj.testExpiryDate === 'string') {
    const d = parseFlexibleDate(obj.testExpiryDate);
    if (d) result.testExpiryDate = d;
  }

  // Free-text fields — trim, reject empties and placeholders
  const stringFields: Array<keyof ScanResult> = [
    'manufacturer', 'model', 'color', 'fuelType', 'ownerName',
  ];
  for (const f of stringFields) {
    const v = obj[f];
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (
        trimmed.length > 0 &&
        trimmed.length < 100 &&
        !/^(unknown|n\/?a|null|undefined|none|—|-)$/i.test(trimmed)
      ) {
        result[f] = trimmed;
      }
    }
  }

  return result;
}

function parseFlexibleDate(s: string): string | null {
  const trimmed = s.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // DD/MM/YYYY or DD-MM-YYYY
  const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  // Try Date constructor as fallback
  const d = new Date(trimmed);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1980 && d.getFullYear() < 2100) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

/**
 * Extract vehicle data using OpenAI GPT-4o Vision (more accurate than mini).
 */
async function extractWithOpenAI(apiKey: string, imageDataUrl: string): Promise<ScanResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Upgraded from gpt-4o-mini for better Hebrew OCR accuracy
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
            ],
          },
        ],
        max_tokens: 400,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return {};
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    const parsed = parseAiJson(text);
    return parsed;
  } catch (error) {
    console.error('OpenAI Vision extraction failed:', error);
    return {};
  }
}

/**
 * Extract vehicle data using Anthropic Claude Vision.
 */
async function extractWithAnthropic(apiKey: string, imageDataUrl: string): Promise<ScanResult> {
  try {
    const match = imageDataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
    if (!match) return {};
    const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = match[2];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Data },
              },
              { type: 'text', text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text());
      return {};
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || '';
    const parsed = parseAiJson(text);
    return parsed;
  } catch (error) {
    console.error('Anthropic Vision extraction failed:', error);
    return {};
  }
}
