import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { sanitizeInput } from '@/lib/security';
import { createApplication, checkDuplicateEmail } from '@/lib/garage-applications-db';
import { createLogger } from '@/lib/logger';
import { VALIDATION_ERRORS, GARAGE_MESSAGES, API_ERRORS } from '@/lib/messages';

const logger = createLogger('garage-applications');

interface SanitizedApplication {
  garageName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  description?: string;
  services?: string;
  languages?: string;
  yearsExperience?: number;
  employeeCount?: number;
  licenseNumber?: string;
  images?: string;
}

const applicationSchema = z.object({
  garageName: z.string().min(2, 'שם המוסך חייב להכיל לפחות 2 תווים').max(100),
  ownerName: z.string().min(2, 'שם בעל המוסך חייב להכיל לפחות 2 תווים').max(100),
  email: z.string().email('כתובת אימייל לא תקינה'),
  phone: z.string().min(9, 'מספר טלפון לא תקין').max(15),
  city: z.string().min(2, 'שם העיר חייב להכיל לפחות 2 תווים').max(50),
  address: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  services: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).max(100).optional(),
  employeeCount: z.number().min(1).max(500).optional(),
  licenseNumber: z.string().max(50).optional(),
  images: z.array(z.string()).max(6).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return errorResponse(firstError.message, 422);
    }

    const data = parsed.data;

    // Sanitize inputs
    const sanitized: SanitizedApplication = {
      garageName: sanitizeInput(data.garageName),
      ownerName: sanitizeInput(data.ownerName),
      email: data.email.toLowerCase().trim(),
      phone: sanitizeInput(data.phone),
      city: sanitizeInput(data.city),
      address: data.address ? sanitizeInput(data.address) : undefined,
      description: data.description ? sanitizeInput(data.description) : undefined,
      services: data.services ? JSON.stringify(data.services) : undefined,
      languages: data.languages ? JSON.stringify(data.languages) : undefined,
      yearsExperience: data.yearsExperience,
      employeeCount: data.employeeCount,
      licenseNumber: data.licenseNumber ? sanitizeInput(data.licenseNumber) : undefined,
    };

    // Check for duplicate pending/approved applications
    const isDuplicate = await checkDuplicateEmail(sanitized.email);
    if (isDuplicate) {
      return errorResponse('כבר קיימת בקשה עם כתובת אימייל זו. אנו נחזור אליך בהקדם.', 409);
    }

    // Store image data URIs directly in DB (Vercel has read-only filesystem)
    if (data.images && data.images.length > 0) {
      // Filter valid images and limit size (keep only thumbnails < 500KB each)
      const validImages = data.images.filter(img => {
        if (!img.startsWith('data:image/')) return false;
        // Rough size estimate: base64 is ~4/3 of original
        const sizeEstimate = (img.length * 3) / 4;
        return sizeEstimate < 2 * 1024 * 1024; // Max 2MB per image
      });
      if (validImages.length > 0) {
        sanitized.images = JSON.stringify(validImages);
      }
    }

    const id = await createApplication(sanitized);

    return jsonResponse({
      id,
      message: GARAGE_MESSAGES.APPLICATION_SENT,
    }, 201);
  } catch (error) {
    logger.error('garage-applications POST error', { error: error instanceof Error ? error.message : String(error) });
    const errMsg = error instanceof Error ? error.message : 'שגיאת שרת פנימית';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
