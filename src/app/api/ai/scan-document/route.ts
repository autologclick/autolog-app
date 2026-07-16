import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';

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

  // Roadside assistance — only present on ביטוח מקיף policies.
  // Both are optional; we silently skip if not found (never alert the user).
  roadServiceProvider: string | null;  // e.g. "שגריר", "דרכים", "ממסי"
  roadServicePhone: string | null;     // shortcode (e.g. "*8888") or full number

  // Raw text summary for reference
  summary: string;

  // MULTI_DOC_PATCH_V1: extra documents detected in the same file (e.g. 2 policies in one PDF).
  // Primary doc populates top-level fields; additional ones go here. null if only one doc.
  additionalDocuments?: ScanResult[] | null;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    requireAuth(req);

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
      // documents: primary first, then any additional ones found in the same file
      const documents = [result, ...(result.additionalDocuments || [])];
      return NextResponse.json({ success: true, data: result, documents });
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
4. Mileage: Look for "ק״מ", "קילומטראז", "מד אוכל", "ספידומטר", "מד מרחק", "km", "KM", "odometer", "speedometer". IMPORTANT: Israeli receipts often write mileage with a DOT as thousands separator — "99.882" or "120.500" means 99,882 or 120,500 kilometers, NOT decimal. If a "mileage" value appears with a single dot followed by exactly 3 digits, treat the dot as a thousands separator and return the value as a whole integer (e.g., "99.882" → 99882). Sane vehicle mileage is between 1,000 and 999,999 km — values outside this range are likely misread.
5. Invoice number: Look for "מס׳ חשבונית", "מס׳ קבלה", "אסמכתא", "#". For רישיון רכב — put the "בעלים קודמים" count here (the number like 00, 01, 02)
6. Business name: Usually at the top of the document, often with logo. For רישיון רכב — use the test station name if visible
7. Line items: Individual services/parts with their costs
8. For רישיון רכב (vehicle registration): "בתוקף עד" = expiryDate, "כינוי מסחרי" = vehicleInfo (model name like CX-5, NOT the manufacturer), "תוצר" = manufacturer (WITHOUT country name)
9. For פוליסת ביטוח מקיף (comprehensive insurance policy) ONLY: look for the roadside assistance section ("שירותי דרך", "גרירה", "שירות דרך"). Common providers: שגריר (Shagrir), דרכים (Drachim), ממסי (Memsi/איגוד הנהיגה), ש.א.ת (SAT), פז שירות, תחבורה, ביטוח ישיר דרך. If found, set roadServiceProvider to the provider name and roadServicePhone to the contact number (often shown as *8888, *3500, etc). If the policy doesn't mention roadside service, leave BOTH as null — do NOT guess and do NOT fail.

10. MULTI-PAGE PDFs: A PDF may have many pages (cover sheets, payment schedules, terms & conditions, the actual document, etc). FIND the page(s) with the actual structured data and extract from those. Ignore boilerplate / generic T&C / legalese pages. If the same document spans multiple pages, treat them as ONE document — do NOT split it.

11. MULTIPLE DISTINCT DOCUMENTS IN ONE FILE: If you detect TWO OR MORE genuinely different documents in the same file (e.g. a comprehensive insurance policy AND a separate mandatory insurance policy, OR an insurance certificate AND a receipt, OR two policies for two different vehicles), populate "additionalDocuments" with the OTHER documents (put the most important / most recent / most complete one in the top-level fields, the rest in the array). If there is only ONE document — even if it spans multiple pages — leave additionalDocuments as null. Do NOT fabricate a second document just because the file has more pages.

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
  "roadServiceProvider": "string (provider name in Hebrew, e.g. שגריר) or null — ONLY for ביטוח מקיף policies",
  "roadServicePhone": "string (phone or shortcode like *8888) or null — ONLY for ביטוח מקיף policies",
  "summary": "string — 1-2 sentence Hebrew summary of the document",
  "additionalDocuments": null OR an array of objects with the SAME schema as above (omit additionalDocuments inside them). Use ONLY when 2+ truly distinct documents are found. Otherwise null.
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
        model: 'claude-sonnet-4-6',
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
        model: 'claude-sonnet-4-6',
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
function extractJsonObject(raw: string): string {
  const start = raw.indexOf('{');
  if (start === -1) return raw.trim();
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (inStr) {
      if (esc) esc = false;
      else if (c === 92) esc = true;
      else if (c === 34) inStr = false;
    } else {
      if (c === 34) inStr = true;
      else if (c === 123) depth++;
      else if (c === 125) { depth--; if (depth === 0) return raw.slice(start, i + 1); }
    }
  }
  return raw.slice(start).trim();
}

function parseAndValidate(rawJson: string): ScanResult | null {
  try {
    const parsed = JSON.parse(extractJsonObject(rawJson));

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
      roadServiceProvider: typeof parsed.roadServiceProvider === 'string' && parsed.roadServiceProvider.trim()
        ? parsed.roadServiceProvider.trim()
        : null,
      roadServicePhone: typeof parsed.roadServicePhone === 'string' && parsed.roadServicePhone.trim()
        ? parsed.roadServicePhone.trim()
        : null,
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : 'מסמך שזוהה',
      additionalDocuments: Array.isArray(parsed.additionalDocuments) && parsed.additionalDocuments.length > 0
        ? parsed.additionalDocuments
            .map((doc: unknown) => parseAndValidateSingle(doc as Record<string, unknown>))
            .filter((d: ScanResult | null): d is ScanResult => d !== null)
        : null,
    };

    return result;
  } catch (error) {
    console.error('Failed to parse scan result:', error, rawJson);
    return null;
  }
}

function parseAndValidateSingle(parsed: Record<string, unknown>): ScanResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  try {
    return {
      documentType: validateEnum(parsed.documentType, ['receipt', 'invoice', 'insurance', 'registration', 'test_certificate', 'maintenance_record', 'other'], 'other'),
      documentTypeHebrew: typeof parsed.documentTypeHebrew === 'string' ? parsed.documentTypeHebrew : 'מסמך',
      confidence: validateEnum(parsed.confidence, ['high', 'medium', 'low'], 'medium'),
      date: validateDate(parsed.date),
      expiryDate: validateDate(parsed.expiryDate),
      totalAmount: typeof parsed.totalAmount === 'number' && parsed.totalAmount >= 0 ? Math.round(parsed.totalAmount * 100) / 100 : null,
      currency: (parsed.currency as string | null) || null,
      invoiceNumber: typeof parsed.invoiceNumber === 'string' ? parsed.invoiceNumber.trim() : null,
      mileage: typeof parsed.mileage === 'number' && parsed.mileage > 0 ? Math.round(parsed.mileage) : null,
      licensePlate: validatePlate(parsed.licensePlate),
      vehicleInfo: typeof parsed.vehicleInfo === 'string' ? parsed.vehicleInfo.trim() : null,
      businessName: typeof parsed.businessName === 'string' ? parsed.businessName.trim() : null,
      businessPhone: typeof parsed.businessPhone === 'string' ? parsed.businessPhone.trim() : null,
      businessAddress: typeof parsed.businessAddress === 'string' ? parsed.businessAddress.trim() : null,
      description: typeof parsed.description === 'string' ? parsed.description.trim() : null,
      lineItems: Array.isArray(parsed.lineItems) ? (parsed.lineItems as Array<{description?: string; amount?: number}>).filter(
        (item) => item && typeof item.description === 'string'
      ).map((item) => ({
        description: item.description as string,
        amount: typeof item.amount === 'number' ? Math.round(item.amount * 100) / 100 : null,
      })) : null,
      suggestedCategory: validateEnum(parsed.suggestedCategory, ['insurance', 'test', 'registration', 'receipt', 'other'], 'other'),
      roadServiceProvider: typeof parsed.roadServiceProvider === 'string' && parsed.roadServiceProvider.trim() ? parsed.roadServiceProvider.trim() : null,
      roadServicePhone: typeof parsed.roadServicePhone === 'string' && parsed.roadServicePhone.trim() ? parsed.roadServicePhone.trim() : null,
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : 'מסמך שזוהה',
      additionalDocuments: null,
    };
  } catch { return null; }
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
