import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { sanitizeInput } from '@/lib/security';
import { createApplication, checkDuplicateEmail } from '@/lib/garage-applications-db';
import fs from 'fs';
import path from 'path';

const applicationSchema = z.object({
  garageName: z.string().min(2, 'שם המוסך חייב להכיל לפחות 2 תווים').max(100),
  ownerName: z.string().min(2, 'שם בעל המוסך חייב להכיל לפחות 2 תווים').max(100),
  email: z.string().email('כתובת אימייל לא תקינה'),
  phone: z.string().min(9, 'מספר טלפון לא תקין').max(15),
  city: z.string().min(2, 'שם העיר חייב להכיל לפחות 2 תווים').max(50),
  address: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  services: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).max(100).optional(),
  employeeCount: z.number().min(1).max(500).optional(),
  licenseNumber: z.string().max(50).optional(),
  images: z.array(z.string()).max(6).optional(),
});

function saveApplicationImages(appId: string, images: string[]): string[] {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'applications', appId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const urls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img.startsWith('data:image/')) continue;
    const matches = img.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
    if (!matches) continue;
    const ext = matches[1] === 'jpg' ? 'jpeg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) continue;
    const filename = `img_${i}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    urls.push(`/uploads/applications/${appId}/${filename}`);
  }
  return urls;
}

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
    const sanitized = {
      garageName: sanitizeInput(data.garageName),
      ownerName: sanitizeInput(data.ownerName),
      email: data.email.toLowerCase().trim(),
      phone: sanitizeInput(data.phone),
      city: sanitizeInput(data.city),
      address: data.address ? sanitizeInput(data.address) : undefined,
      description: data.description ? sanitizeInput(data.description) : undefined,
      services: data.services ? JSON.stringify(data.services) : undefined,
      yearsExperience: data.yearsExperience,
      employeeCount: data.employeeCount,
      licenseNumber: data.licenseNumber ? sanitizeInput(data.licenseNumber) : undefined,
    };

    // Check for duplicate pending/approved applications
    const isDuplicate = await checkDuplicateEmail(sanitized.email);
    if (isDuplicate) {
      return errorResponse('כבר קיימת בקשה עם כתובת אימייל זו. אנו נחזור אליך בהקדם.', 409);
    }

    // Save images if provided
    if (data.images && data.images.length > 0) {
      const appId = `app_${Date.now()}`;
      const imageUrls = saveApplicationImages(appId, data.images);
      if (imageUrls.length > 0) {
        (sanitized as any).images = JSON.stringify(imageUrls);
      }
    }

    const id = await createApplication(sanitized);

    return jsonResponse({
      id,
      message: 'הבקשה נשלחה בהצלחה! צוות AutoLog יבדוק את הבקשה ויחזור אליך בהקדם.',
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
