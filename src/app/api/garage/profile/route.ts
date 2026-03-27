import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError, validationErrorResponse } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';

const updateGarageProfileSchema = z.object({
  name: z.string().min(2, 'שם המוסך חייב להכיל לפחות 2 תווים').max(100).optional(),
  address: z.string().min(2, 'כתובת חייבת להכיל לפחות 2 תווים').max(200).optional(),
  city: z.string().min(2, 'עיר חייבת להכיל לפחות 2 תווים').max(100).optional(),
  phone: z.string().regex(/^[\d\-+() ]{7,20}$/, 'מספר טלפון לא תקין').optional(),
  email: z.string().email('כתובת אימייל לא תקינה').optional(),
  description: z.string().max(1000, 'תיאור ארוך מדי').optional(),
  services: z.array(z.string()).optional(),
  workingHours: z.record(z.string()).optional(),
  amenities: z.array(z.string()).optional(),

  // Branding & media
  logoUrl: z.string().url('כתובת לוגו לא תקינה').optional().or(z.literal('')),
  galleryImages: z.array(z.string().url('כתובת תמונה לא תקינה')).max(20, 'ניתן להעלות עד 20 תמונות').optional(),
  coverImageUrl: z.string().url('כתובת תמונת כיסוי לא תקינה').optional().or(z.literal('')),

  // Business identity
  businessLicense: z.string().max(50, 'מספר רישיון ארוך מדי').optional().or(z.literal('')),
  taxId: z.string().max(20, 'מספר ח.פ ארוך מדי').optional().or(z.literal('')),
  foundedYear: z.number().int().min(1950).max(new Date().getFullYear()).optional(),

  // Specializations
  specializations: z.array(z.string()).optional(),
  vehicleBrands: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),

  // Pricing & payment
  priceList: z.array(z.object({
    service: z.string(),
    price: z.number().nonnegative(),
    duration: z.string().optional(),
  })).optional(),
  paymentMethods: z.array(z.enum(['cash', 'credit', 'bit', 'paybox', 'bank_transfer'])).optional(),
  priceRange: z.enum(['budget', 'moderate', 'premium']).optional(),

  // Social & contact
  socialLinks: z.object({
    website: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    whatsapp: z.string().optional().or(z.literal('')),
    waze: z.string().url().optional().or(z.literal('')),
    googleMaps: z.string().url().optional().or(z.literal('')),
  }).optional(),
  whatsappNumber: z.string().regex(/^[\d\-+() ]{7,20}$/, 'מספר WhatsApp לא תקין').optional().or(z.literal('')),
});

// GET /api/garage/profile - Get garage profile for current owner
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      include: {
        mechanics: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            inspections: true,
            appointments: true,
            reviews: true,
          },
        },
      },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    // Parse JSON fields
    const parsed = {
      ...garage,
      galleryImages: garage.galleryImages ? JSON.parse(garage.galleryImages) : [],
      specializations: garage.specializations ? JSON.parse(garage.specializations) : [],
      vehicleBrands: garage.vehicleBrands ? JSON.parse(garage.vehicleBrands) : [],
      certifications: garage.certifications ? JSON.parse(garage.certifications) : [],
      priceList: garage.priceList ? JSON.parse(garage.priceList) : [],
      paymentMethods: garage.paymentMethods ? JSON.parse(garage.paymentMethods) : [],
      socialLinks: garage.socialLinks ? JSON.parse(garage.socialLinks) : {},
      services: garage.services ? JSON.parse(garage.services) : [],
      workingHours: garage.workingHours ? JSON.parse(garage.workingHours) : {},
      amenities: garage.amenities ? JSON.parse(garage.amenities) : [],
    };

    return jsonResponse({ garage: parsed });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/garage/profile - Update garage profile
export async function PUT(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const body = await req.json();

    const validation = updateGarageProfileSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    const data = validation.data;
    const updateData: Record<string, unknown> = {};

    // Simple string/number fields
    const simpleFields = ['name', 'address', 'city', 'phone', 'email', 'description',
      'logoUrl', 'coverImageUrl', 'businessLicense', 'taxId', 'foundedYear',
      'whatsappNumber', 'priceRange'] as const;

    for (const field of simpleFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field] || null;
      }
    }

    // JSON array fields
    const jsonArrayFields = ['services', 'workingHours', 'amenities', 'galleryImages',
      'specializations', 'vehicleBrands', 'certifications',
      'priceList', 'paymentMethods', 'socialLinks'] as const;

    for (const field of jsonArrayFields) {
      if (data[field] !== undefined) {
        updateData[field] = JSON.stringify(data[field]);
      }
    }

    const updated = await prisma.garage.update({
      where: { id: garage.id },
      data: updateData,
    });

    return jsonResponse({ garage: updated, message: 'פרופיל המוסך עודכן בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
