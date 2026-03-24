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
});

// ============================================================
// VEHICLE SCHEMAS
// ============================================================

export const vehicleSchema = z.object({
  nickname: z.string()
    .min(1, 'כינוי רכב נדרש')
    .max(50, 'כינוי ארוך מדי'),
  manufacturer: z.string()
    .min(1, 'יצרן נדרש')
    .max(50, 'שם יצרן ארוך מדי'),
  model: z.string()
    .min(1, 'דגם נדרש')
    .max(50, 'שם דגם ארוך מדי'),
  year: z.coerce.number()
    .int('שנה חייבת להיות מספר שלם')
    .min(1900, 'שנה לא תקינה')
    .max(new Date().getFullYear() + 1, 'שנה לא תקינה'),
  licensePlate: z.string()
    .min(1, 'מספר רישוי נדרש')
    .max(20, 'מספר רישוי לא תקין'),
  color: z.string().max(50, 'צבע ארוך מדי').optional(),
  vin: z.string().max(17, 'VIN ארוך מדי').optional().or(z.literal('')),
  fuelType: z.string().max(50, 'סוג דלק ארוך מדי').optional().or(z.literal('')),
  testExpiryDate: z.string().optional().or(z.literal('')),
  insuranceExpiry: z.string().optional().or(z.literal('')),
  registrationDate: z.string().optional().or(z.literal('')),
  mileage: z.coerce.number().int('קילומטראז חייב להיות מספר שלם').nonnegative().optional(),
});

// ============================================================
// INSPECTION SCHEMAS
// ============================================================

export const inspectionItemSchema = z.object({
  category: z.string().min(1, 'קטגוריה נדרשת'),
  itemName: z.string().min(1, 'שם פריט נדרש'),
  status: z.enum(['ok', 'warning', 'critical']).optional(),
  notes: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export const inspectionSchema = z.object({
  vehicleId: z.string().min(1, 'בחר רכב'),
  inspectionType: z.enum([
    'full', 'rot', 'engine', 'tires', 'brakes', 'pre_test'
  ], {
    errorMap: () => ({ message: 'סוג בדיקה לא תקין' }),
  }),
  mechanicName: z.string().max(100, 'שם מכונאי ארוך מדי').optional(),
  items: z.array(inspectionItemSchema).optional(),
});

// ============================================================
// SOS EVENT SCHEMAS
// ============================================================

export const sosEventSchema = z.object({
  vehicleId: z.string().optional(),
  eventType: z.enum([
    'accident', 'breakdown', 'flat_tire', 'fuel', 'electrical', 'other'
  ], {
    errorMap: () => ({ message: 'סוג אירוע לא תקין' }),
  }),
  description: z.string().max(500, 'תיאור ארוך מדי').optional(),
  location: z.string().max(200, 'מיקום ארוך מדי').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const sosEventUpdateSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().max(1000, 'הערות ארוכות מדי').optional(),
});

// ============================================================
// APPOINTMENT SCHEMAS
// ============================================================

export const appointmentSchema = z.object({
  vehicleId: z.string().min(1, 'בחר רכב'),
  garageId: z.string().min(1, 'בחר מוסך'),
  serviceType: z.string().min(1, 'סוג שירות נדרש').max(100, 'סוג שירות ארוך מדי'),
  date: z.string().min(1, 'תאריך נדרש'),
  time: z.string().min(1, 'שעה נדרשת'),
  notes: z.string().max(500, 'הערות ארוכות מדי').optional().or(z.literal('')).nullable(),
});

// ============================================================
// EXPENSE SCHEMAS
// ============================================================

export const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'בחר רכב'),
  category: z.enum([
    'fuel', 'maintenance', 'insurance', 'test', 'parking', 'fines', 'other'
  ], {
    errorMap: () => ({ message: 'קטגוריה לא תקינה' }),
  }),
  amount: z.coerce.number()
    .positive('סכום חייב להיות חיובי')
    .finite('סכום לא תקין'),
  description: z.string().max(500, 'תיאור ארוך מדי').optional().or(z.literal('')),
  date: z.string().min(1, 'תאריך נדרש'),
  receiptUrl: z.string().url('כתובת קבלה לא תקינה').optional().or(z.literal('')),
});

export const updateExpenseSchema = expenseSchema.partial();

// ============================================================
// GARAGE SCHEMAS
// ============================================================

export const garageSchema = z.object({
  name: z.string()
    .min(1, 'שם מוסך נדרש')
    .max(100, 'שם מוסך ארוך מדי'),
  address: z.string().max(200, 'כתובת ארוכה מדי').optional(),
  city: z.string()
    .min(1, 'עיר נדרשת')
    .max(50, 'שם עיר ארוך מדי'),
  phone: z.string()
    .regex(/^[0-9\-\+\(\)\s]*$/, 'מספר טלפון לא תקין')
    .optional()
    .or(z.literal('')),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  description: z.string().max(1000, 'תיאור ארוך מדי').optional(),
  services: z.string().optional(),
  workingHours: z.string().optional(),
});

// ============================================================
// DOCUMENT SCHEMAS
// ============================================================

export const documentSchema = z.object({
  vehicleId: z.string().min(1, 'בחר רכב'),
  type: z.enum([
    'insurance_compulsory',
    'insurance_comprehensive',
    'insurance_third_party',
    'license',
    'registration',
    'test_certificate',
    'receipt',
    'photo',
    'other'
  ], {
    errorMap: () => ({ message: 'סוג מסמך לא תקין' }),
  }),
  title: z.string()
    .min(1, 'כותרת נדרשת')
    .max(200, 'כותרת ארוכה מדי'),
  description: z.string()
    .max(1000, 'תיאור ארוך מדי')
    .optional()
    .or(z.literal('')),
  fileUrl: z.string()
    .url('כתובת קובץ לא תקינה')
    .optional()
    .or(z.literal('')),
  fileName: z.string()
    .max(255, 'שם קובץ ארוך מדי')
    .optional()
    .or(z.literal('')),
  fileType: z.string()
    .max(100, 'סוג קובץ ארוך מדי')
    .optional()
    .or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const updateDocumentSchema = z.object({
  type: z.enum([
    'insurance_compulsory',
    'insurance_comprehensive',
    'insurance_third_party',
    'license',
    'registration',
    'test_certificate',
    'receipt',
    'photo',
    'other'
  ]).optional(),
  title: z.string()
    .min(1, 'כותרת נדרשת')
    .max(200, 'כותרת ארוכה מדי')
    .optional(),
  description: z.string()
    .max(1000, 'תיאור ארוך מדי')
    .optional()
    .or(z.literal('')),
  fileUrl: z.string()
    .url('כתובת קובץ לא תקינה')
    .optional()
    .or(z.literal('')),
  fileName: z.string()
    .max(255, 'שם קובץ ארוך מדי')
    .optional()
    .or(z.literal('')),
  fileType: z.string()
    .max(100, 'סוג קובץ ארוך מדי')
    .optional()
    .or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type SosEventInput = z.infer<typeof sosEventSchema>;
export type SosEventUpdateInput = z.infer<typeof sosEventUpdateSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type GarageInput = z.infer<typeof garageSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
