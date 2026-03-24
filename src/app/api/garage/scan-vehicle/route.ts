import { NextRequest } from 'next/server';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import prisma from '@/lib/db';

// POST /api/garage/scan-vehicle - Scan license plate or registration document
// Extracts vehicle info from an image using pattern matching
// In production, this would use an OCR API or AI vision model
export async function POST(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return errorResponse('לא נשלחה תמונה', 400);
    }

    // For now, we try to find the vehicle by looking up all vehicles
    // and matching against a scanned plate number
    // In production: send to OCR service (Google Vision, Tesseract, etc.)

    // Extract potential license plate from base64 image
    // This is a placeholder - in production use real OCR
    let licensePlate = '';
    let manufacturer = '';
    let model = '';
    let year = '';
    let color = '';

    // Try to look up existing vehicle in DB by any identifiers found
    // For now, return empty results that the user can fill in manually
    // The frontend will switch to manual mode and let the user fill the fields

    // Future: integrate with Israeli MOT (משרד התחבורה) API
    // by license plate to auto-fill manufacturer, model, year, color
    // API: https://data.gov.il/dataset/53cea79b-09a4-4f8d-9a25-6a1650faa1c1

    return jsonResponse({
      licensePlate,
      manufacturer,
      model,
      year,
      color,
      message: 'צלם את הלוחית או רישיון הרכב. הפרטים ימולאו אוטומטית בקרוב.',
      ocrAvailable: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
