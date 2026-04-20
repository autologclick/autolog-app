import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

/**
 * POST /api/ai/scan-document
 *
 * AI-powered document scanner that extracts structured data from uploaded images.
 * Handles: receipts, invoices, insurance policies, MOT certificates, registration docs,
 * maintenance records, and any vehicle-related document.
 *
 * Accepts: { image: string, context?: string }
 *   - image: base64 data URL of the document photo
 *   - context: optional hint about what the user is trying to do (e.g. "adding expense", "uploading document")
 *
 * Returns: { success: true, data: ScanResult } or { error: string }
 */

export interface ScanResult {
  // Document identification
  documentType: 'receipt' | 'invoice' | 'insurance' | 'registration' | 'test_certificate' | 'maintenance_record' | 'other';
  documentTypeHebrew: string;
  confidence: 'high' | 'medium' | 'low';

  // Common fields (null if not found)
  date: string | null;              // ISO format YYYY-MM-DD
  expiryDate: string | null;        // ISO format YYYY-MM-DD (for insurance, test, registration)
  totalAmount: number | null;       // Total cost in ILS
  currency: string | null;          // Usually ILS/₪
  invoiceNumber: string | null;     // Receipt/invoice number
  mileage: number | null;           // Odometer reading in km

  // Vehicle info (if visible on document)
  licensePlate: string | null;      // 7-8 digit Israeli plate
  vehicleInfo: string | null;       // Make/model if visible

  // Business/garage info
  businessName: string | null;      // Garage or insurance company name
  businessPhone: string | null;
  businessAddress: string | null;

  // Service details
  description: string | null;       // What was done / document subject
  lineItems: Array<{
    description: string;
    amount: number | null;
  }> | null;

  // Category suggestion for documents page
  suggestedCategory: string | null;  // insurance, test, registration, receipt, other

  // Raw text summary for reference
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const body = await req.json();
    const { image, context } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'לא נשלחה תמונה' }, { status: 400 });
    }

    const isPdf = image.startsWith('data:application/pdf');
    const isImage = image.startsWith('data:image/');

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: 'פורמט קובץ לא תקין. נתמכים: תמונות ו-PDF' }, { status: 400 });
    }

    // Check file size (max ~10MB base64)
    if (image.length > 14_000_000) {
      return NextResponse.json({ error: 'הקובץ גדול מדי. מקסימום 10MB' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      return NextResponse.json(
        { error: 'שירות הסריקה החכמה לא מוגדר. אנא הגדר OPENAI_API_KEY או ANTHROPIC_API_KEY.' },
        { status: 501 }
      );
    }

    let result: ScanResult | null = null;

    if (isPdf) {
      // PDF files — use Anthropic's native document support (OpenAI doesn't support PDF in vision)
      if (anthropicKey) {
        result = await scanPdfWithAnthropic(anthropicKey, image, context);
      } else {
        return NextResponse.json(
          { error: 'סריקת PDF דורשת הגדרת ANTHROPIC_API_KEY' },
          { status: 501 }
        );
      }
    } else {
      // Image files — try OpenAI first, fall back to Anthropic
      if (openaiKey) {
        result = await scanWithOpenAI(openaiKey, image, context);
      }

      if (!result && anthropicKey) {
        result = await scanWithAnthropic(anthropicKey, image, context);
      }
    }

    if (result) {
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { error: 'לא הצלחנו לזהות פרטים מהמסמך. נסה לצלם שוב באור טוב.' },
      { status: 422 }
    );
  } catch (error) {
    console.error('Document scan error:', error);
    return NextResponse.json({ error: 'שגיאת שרת בסריקה' }, { status: 500 });
  }
}

const SYSTEM_PROMPT = `You are a document data extractor for an Israeli vehicle management app called AutoLog.
You receive photos of vehicle-related documents in Hebrew (and sometimes English).

Your job: extract ALL structured data you can find from the document image.

Common document types you'll encounter:
- קבלה / חשבונית (receipt/invoice) — from garages, mechanics, parts shops
- פוליסת ביטוח (insurance policy) — vehicle insurance documents
- תעודת טסט (MOT/test certificate) — annual vehicle inspection certificate
- רישיון רכב (vehicle registration) — ownership document
- אישור טיפול (maintenance record) — service records

IMPORTANT EXTRACTION RULES:
1. Dates: Convert ANY date format to ISO YYYY-MM-DD. Israeli dates are often DD/MM/YYYY or DD.MM.YYYY
2. Amounts: Extract the TOTAL amount. Look for "סה״כ", "סה\"כ", "סך הכל", "TOTAL", "סך". Remove ₪ symbol, return as number
3. License plate: Israeli plates are 7-8 digits (e.g., 1234567 or 12345678). Field is "מספר רכב"
4. Mileage: Look for "ק״מ", "קילומטראז", "מד אוכל", "km", "KM", "odometer"
5. Invoice number: Look for "מס׳ חשבונית", "מס׳ קבלה", "אסמכתא", "#". For רישיון רכב — put the "בעלים קודמים" count here (the number like 00, 01, 02)
6. Business name: Usually at the top of the document, often with logo. For רישיון רכב — use the test station name if visible
7. Line items: Individual services/parts with their costs
8. For רישיון רכב (vehicle registration): "בתוקף עד" = expiryDate, "כינוי מסחרי" = vehicleInfo (model name like CX-5, NOT the manufacturer), "תוצר" = manufacturer (WITHOUT country name)

Return a JSON object with these exact fields (use null for fields you can't find):`;

function buildPrompt(context?: string): string {
  const contextHint = context
    ? `\nContext: The user is ${context}. Prioritize extracting relevant fields for this action.`
    : '';

  return `${SYSTEM_PROMPT}${contextHint}

Return ONLY valid JSON with this structure — no markdown, no explanation:
{
  "documentType": "receipt" | "invoice" | "insurance" | "registration" | "test_certificate" | "maintenance_record" | "other",
  "documentTypeHebrew": "string (e.g. קבלה, חשבונית, פוליסת ביטוח, תעודת טסט, רישיון רכב)",
  "confidence": "high" | "medium" | "low",
  "date": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "totalAmount": number or null,
  "currency": "ILS" or null,
  "invoiceNumber": "string or null",
  "mileage": number or null,
  "licensePlate": "string (digits only) or null",
  "vehicleInfo": "string (make/model if visible) or null",
  "businessName": "string or null",
  "businessPhone": "string or null",
  "businessAddress": "string or null",
  "description": "string — brief Hebrew summary of what the document is about",
  "lineItems": [{"description": "string", "amount": number or null}] or null,
  "suggestedCategory": "insurance" | "test" | "registration" | "receipt" | "other",
  "summary": "string — 1-2 sentence Hebrew summary of the document"
}`;
}

async function scanWithOpenAI(apiKey: string, imageDataUrl: string, context?: string): Promise<ScanResult | null> {
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
              { type: 'text', text: buildPrompt(context) },
              { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error('OpenAI scan-document error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    return parseAndValidate(text);
  } catch (error) {
    console.error('OpenAI scan-document failed:', error);
    return null;
  }
}

async function scanWithAnthropic(apiKey: string, imageDataUrl: string, context?: string): Promise<ScanResult | null> {
  try {
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
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Data },
              },
              { type: 'text', text: buildPrompt(context) },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error('Anthropic scan-document error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return null;

    return parseAndValidate(text);
  } catch (error) {
    console.error('Anthropic scan-document failed:', error);
    return null;
  }
}

/**
 * Scan a PDF document using Anthropic's native document support.
 * Anthropic Claude natively processes PDF files — no external parsing library needed.
 */
async function scanPdfWithAnthropic(apiKey: string, pdfDataUrl: string, context?: string): Promise<ScanResult | null> {
  try {
    const match = pdfDataUrl.match(/^data:application\/pdf;base64,(.+)$/i);
    if (!match) return null;
    const base64Data = match[1];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
              },
              { type: 'text', text: buildPrompt(context) },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error('Anthropic PDF scan error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return null;

    return parseAndValidate(text);
  } catch (error) {
    console.error('Anthropic PDF scan failed:', error);
    return null;
  }
}

/**
 * Parse AI response and validate/sanitize the extracted data.
 */
function parseAndValidate(rawJson: string): ScanResult | null {
  try {
    // Strip markdown code fences if present
    const cleaned = rawJson.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate and sanitize fields
    const result: ScanResult = {
      documentType: validateEnum(parsed.documentType, ['receipt', 'invoice', 'insurance', 'registration', 'test_certificate', 'maintenance_record', 'other'], 'other'),
      documentTypeHebrew: typeof parsed.documentTypeHebrew === 'string' ? parsed.documentTypeHebrew : 'מסמך',
      confidence: validateEnum(parsed.confidence, ['high', 'medium', 'low'], 'medium'),
      date: validateDate(parsed.date),
      expiryDate: validateDate(parsed.expiryDate),
      totalAmount: typeof parsed.totalAmount === 'number' && parsed.totalAmount >= 0 ? Math.round(parsed.totalAmount * 100) / 100 : null,
      currency: parsed.currency || null,
      invoiceNumber: typeof parsed.invoiceNumber === 'string' ? parsed.invoiceNumber.trim() : null,
      mileage: typeof parsed.mileage === 'number' && parsed.mileage > 0 ? Math.round(parsed.mileage) : null,
      licensePlate: validatePlate(parsed.licensePlate),
      vehicleInfo: typeof parsed.vehicleInfo === 'string' ? parsed.vehicleInfo.trim() : null,
      businessName: typeof parsed.businessName === 'string' ? parsed.businessName.trim() : null,
      businessPhone: typeof parsed.businessPhone === 'string' ? parsed.businessPhone.trim() : null,
      businessAddress: typeof parsed.businessAddress === 'string' ? parsed.businessAddress.trim() : null,
      description: typeof parsed.description === 'string' ? parsed.description.trim() : null,
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems.filter(
        (item: { description?: string; amount?: number }) => item && typeof item.description === 'string'
      ).map((item: { description: string; amount?: number }) => ({
        description: item.description,
        amount: typeof item.amount === 'number' ? Math.round(item.amount * 100) / 100 : null,
      })) : null,
      suggestedCategory: validateEnum(parsed.suggestedCategory, ['insurance', 'test', 'registration', 'receipt', 'other'], 'other'),
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : 'מסמך שזוהה',
    };

    return result;
  } catch (error) {
    console.error('Failed to parse scan result:', error, rawJson);
    return null;
  }
}

function validateEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function validateDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  // Accept YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return value;
  }
  return null;
}

function validatePlate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const cleaned = value.replace(/[-–—\s.]/g, '');
  return /^\d{7,8}$/.test(cleaned) ? cleaned : null;
}
