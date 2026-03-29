import { z } from 'zod';

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(1, 'סיסמה נדרשת'),
});

export const registerSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string()
    .min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
    .regex(/[A-Z]/, 'הסיסמה חייבת להכיל אות גדולה באנגלית')
    .regex(/[a-z]/, 'הסיסמה חייבת להכיל אות קטנה באנגלית')
    .regex(/[0-9]/, 'הסיסמה חייבת להכיל ספרה'),
  fullName: z.string()
    .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
    .max(100, 'שם מלא ארוך מדי'),
  phone: z.string()
    .regex(/^[0-9\-\+\(\)\s]*$/, 'מספר טלפון לא תקין')
    .optional()
    .or(z.literal('')),
  idNumber: z.string().optional().or(z.literal('')),
  licenseNumber: z.string().optional().or(z.literal('')),
});

export const updateProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
    .max(100, 'שם מלא ארוך מדי')
    .optional(),
  phone: z.string()
    .regex(/^[0-9\-\+\(\)\s]*$/, 'מספר טלפון לא תקין')
    .optional()
    .or(z.literal('')),
  licenseNumber: z.string().optional().or(z.literal('')),
  city: z.string().max(100, 'שם עיר ארוך מדי').optional().or(z.literal('')),
  address: z.string().max(200, 'כתובת ארוכה מדי').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  preferredLanguage: z.enum(['he', 'en', 'ar', 'ru']).optional(),
  avatarUrl: z.string().url('כתובת תמונה לא תקינה').optional().or(z.literal('')),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
  }).optional(),
});