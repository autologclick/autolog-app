import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/vehicles/scan-license
 *
 * Server-side Vision API fallback for license plate extraction.
 * Uses OpenAI GPT-4o-mini Vision when available, with Anthropic Claude as alternative.
 *
 * Accepts: { image: string } — base64 data URL of the license document photo
 * Returns: { licensePlate: string } or { error: string }
 *
 * Environment variables (set one):
 *   OPENAI_API_KEY — for OpenAI GPT-4o-mini Vision
 *   ANTHROPIC_API_KEY — for Anthropic Claude Vision (alternative)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'לא נשלחה תמונה' }, { status: 400 });
    }

    // Validate it's a data URL
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'פורמט תמונה לא תקין' }, { status: 400 });
    }

    // Try OpenAI first, then Anthropic
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      // No API key configured — return gracefully so client falls back to manual
      return NextResponse.json({ error: 'Vision API not configured' }, { status: 501 });
    }

    let licensePlate: string | null = null;

    if (openaiKey) {
      licensePlate = await extractWithOpenAI(openaiKey, image);
    } else if (anthropicKey) {
      licensePlate = await extractWithAnthropic(anthropicKey, image);
    }

    if (licensePlate) {
      return NextResponse.json({ licensePlate });
    }

    return NextResponse.json({ error: 'לא זוהה מספר רכב בתמונה' }, { status: 404 });
  } catch (error) {
    console.error('Vision API scan error:', error);
    return NextResponse.json({ error: 'שגיאת שרת בזיהוי' }, { status: 500 });
  }
}

/**
 * Extract license plate using OpenAI GPT-4o-mini Vision.
 */
async function extractWithOpenAI(apiKey: string, imageDataUrl: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `This is a photo of an Israeli vehicle registration document (רישיון רכב).
Find the field labeled "מספר רכב" (vehicle number). It appears near the top-right of the document.
The number is 7 or 8 digits, sometimes shown with a check digit after a dash (e.g. 5919270-2-5).
Return ONLY the first 7 or 8 digits of the vehicle number, WITHOUT the check digit.
No dashes, no spaces, no explanation — just the digits.
If you cannot find it, return "NOT_FOUND".`,
              },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl, detail: 'high' },
              },
            ],
          },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    if (text === 'NOT_FOUND' || !text) return null;

    // Clean and validate
    const cleaned = text.replace(/[-–—\s.]/g, '');

    // Exact 7-8 digits
    if (/^\d{7,8}$/.test(cleaned)) {
      return cleaned;
    }

    // AI returned extra digits (check digit) — take first 7 or 8
    const digitMatch = cleaned.match(/^(\d{7,8})/);
    if (digitMatch) {
      return digitMatch[1];
    }

    return null;
  } catch (error) {
    console.error('OpenAI Vision extraction failed:', error);
    return null;
  }
}

/**
 * Extract license plate using Anthropic Claude Vision.
 */
async function extractWithAnthropic(apiKey: string, imageDataUrl: string): Promise<string | null> {
  try {
    // Parse the data URL to get base64 and media type
    const match = imageDataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
    if (!match) return null;
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
        max_tokens: 20,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `This is a photo of an Israeli vehicle registration document (רישיון רכב).
Find the field labeled "מספר רכב" (vehicle number). It appears near the top-right of the document.
The number is 7 or 8 digits, sometimes shown with a check digit after a dash (e.g. 5919270-2-5).
Return ONLY the first 7 or 8 digits of the vehicle number, WITHOUT the check digit.
No dashes, no spaces, no explanation — just the digits.
If you cannot find it, return "NOT_FOUND".`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || '';

    if (text === 'NOT_FOUND' || !text) return null;

    const cleaned = text.replace(/[-–—\s.]/g, '');

    if (/^\d{7,8}$/.test(cleaned)) {
      return cleaned;
    }

    // AI returned extra digits (check digit) — take first 7 or 8
    const digitMatch = cleaned.match(/^(\d{7,8})/);
    if (digitMatch) {
      return digitMatch[1];
    }

    return null;
  } catch (error) {
    console.error('Anthropic Vision extraction failed:', error);
    return null;
  }
}
