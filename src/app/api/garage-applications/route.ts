import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { sanitizeInput } from '@/lib/security';
import { createApplication, checkDuplicateEmail } from '@/lib/garage-applications-db';

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

    const sanitized: Record<string, any> = {
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

    const isDuplicate = await checkDuplicateEmail(sanitized.email);
    if (isDuplicate) {
      return errorResponse('כבר קיימת בקשה עם כתובת אימייל זו. אנו נחזור אליך בהקדם.', 409);
    }

    if (data.images && data.images.length > 0) {
      const validImages = data.images.filter(img => {
        if (!img.startsWith('data:image/')) return false;
        const sizeEstimate = (img.length * 3) / 4;
        return sizeEstimate < 2 * 1024 * 1024;
      });
      if (validImages.length > 0) {
        sanitized.images = JSON.stringify(validImages);
      }
    }

    const id = await createApplication(sanitized);

    return jsonResponse({
      id,
      message: 'הבקשה נשלחה בהצלחה! צוות AutoLog יבדוק את הבקשה ויחזור אליך בהקדם.',
    }, 201);
  } catch (error) {
    console.error('garage-applications POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'שגיאת שרת פנימית';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
