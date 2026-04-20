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
  mileage: z.coerce.number({ required_error: 'קילומטראז׳ נדרש' }).int('קילומטראז׳ חייב להיות מספר שלם').nonnegative('קילומטראז׳ חייב להיות חיובי'),
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

/**
 * Comprehensive inspection schema - matches the 8-step garage inspection form.
 * Used by POST /api/inspections for creating full vehicle inspections.
 */
export const comprehensiveInspectionSchema = z.object({
  vehicleId: z.string().optional(),
  appointmentId: z.string().optional(),

  // Manual vehicle entry (when vehicleId is not provided)
  manualVehicle: z.object({
    licensePlate: z.string().min(5),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().optional(),
    color: z.string().optional(),
  }).optional(),

  inspectionType: z.enum(['full', 'rot', 'engine', 'tires', 'brakes', 'pre_test', 'periodic', 'troubleshoot']),
  mechanicName: z.string().max(100).optional(),
  mileage: z.number().int().optional(),
  engineNumber: z.string().optional(),
  engineVerified: z.boolean().optional(),
  overallScore: z.number().int().min(0).max(100).optional(),

  // Photos (JSON objects with base64 strings)
  exteriorPhotos: z.record(z.string()).optional(),
  interiorPhotos: z.record(z.string()).optional(),

  // Tires & Lights — passthrough() preserves extra fields the frontend may send
  tiresData: z.object({
    frontLeft: z.string().optional(),
    frontRight: z.string().optional(),
    rearLeft: z.string().optional(),
    rearRight: z.string().optional(),
  }).passthrough().optional(),
  tiresNotes: z.string().optional(),
  lightsData: z.object({
    brakes: z.string().optional(),
    reverse: z.string().optional(),
    fog: z.string().optional(),
    headlights: z.string().optional(),
    frontSignal: z.string().optional(),
    rearSignal: z.string().optional(),
    highBeam: z.string().optional(),
    plate: z.string().optional(),
  }).passthrough().optional(),
  lightsNotes: z.string().optional(),

  // Mechanical systems — accept items as either array or object (frontend sends object)
  frontAxle: z.object({
    status: z.string().optional(),
    ballBearings: z.string().optional(),
    items: z.union([z.array(z.record(z.unknown())), z.record(z.unknown())]).optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),
  steeringData: z.object({
    status: z.string().optional(),
    alignment: z.string().optional(),
    items: z.union([z.array(z.record(z.unknown())), z.record(z.unknown())]).optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),
  shocksData: z.object({
    frontLeft: z.string().optional(),
    frontRight: z.string().optional(),
    rearLeft: z.string().optional(),
    rearRight: z.string().optional(),
    items: z.union([z.array(z.record(z.unknown())), z.record(z.unknown())]).optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),
  bodyData: z.object({
    condition: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),
  batteryData: z.object({
    isOriginal: z.boolean().optional(),
    status: z.string().optional(),
    date: z.string().optional(),
  }).passthrough().optional(),

  // Fluids & Interior
  fluidsData: z.object({
    brakeFluid: z.string().optional(),
    engineOil: z.string().optional(),
    coolant: z.string().optional(),
  }).passthrough().optional(),
  fluidsNotes: z.string().optional(),
  interiorSystems: z.object({
    acCold: z.string().optional(),
    acHot: z.string().optional(),
    audio: z.string().optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),
  windowsData: z.object({
    frontLeft: z.string().optional(),
    frontRight: z.string().optional(),
    rearLeft: z.string().optional(),
    rearRight: z.string().optional(),
  }).passthrough().optional(),
  windowsNotes: z.string().optional(),

  // Engine & Gearbox
  engineIssues: z.object({
    issues: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),
  gearboxIssues: z.object({
    issues: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),

  // Braking system percentages
  brakingSystem: z.object({
    frontDiscs: z.number().optional(),
    rearDiscs: z.number().optional(),
    frontPads: z.number().optional(),
    rearPads: z.number().optional(),
  }).passthrough().optional(),
  brakeNotes: z.string().optional(),

  // Summary & Notes
  summary: z.string().optional(),
  recommendations: z.array(z.object({
    text: z.string(),
    urgency: z.string().optional(),
    estimatedCost: z.string().optional(),
  })).optional(),
  notes: z.object({
    undercarriage: z.string().optional(),
    engine: z.string().optional(),
    general: z.string().optional(),
  }).passthrough().optional(),

  // Customer signature
  customerName: z.string().optional(),
  customerIdNumber: z.string().optional(),
  customerSignature: z.string().optional(),

  // Legacy support
  detailedScores: z.record(z.number()).optional(),
  items: z.array(z.object({
    category: z.string(),
    itemName: z.string(),
    status: z.enum(['ok', 'warning', 'critical']),
    notes: z.string().optional(),
    score: z.number().int().min(0).max(100).optional(),
  })).optional(),

  // Pre-test data
  preTestChecklist: z.record(z.boolean()).optional(),
  preTestNotes: z.string().optional(),

  // Service/work items
  serviceItems: z.array(z.string()).optional(),
  workPerformed: z.array(z.object({
    item: z.string(),
    action: z.enum(['fixed', 'replaced', 'adjusted', 'checked', 'cleaned']),
    notes: z.string().optional(),
    cost: z.number().optional(),
  })).optional(),

  // Photos for non-full types
  vehiclePhoto: z.string().optional(),
  invoicePhoto: z.string().optional(),

  // Periodic service fields
  serviceNotes: z.string().optional(),
  serviceRecommendations: z.string().optional(),
  servicePhotos: z.array(z.string()).optional(),

  // Troubleshoot fields
  troubleshootData: z.object({
    problem: z.string().optional(),
    diagnosis: z.string().optional(),
    fix: z.string().optional(),
    parts: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),

  // Pre-test item-level notes
  preTestItemNotes: z.record(z.string()).optional(),
}).passthrough();

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
    'vehicle_license',
    'driving_license',
    'insurance',
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
  fileData: z.string()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  fileUrl: z.string()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
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
    'vehicle_license',
    'driving_license',
    'insurance',
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
export type ComprehensiveInspectionInput = z.infer<typeof comprehensiveInspectionSchema>;
export type SosEventInput = z.infer<typeof sosEventSchema>;
export type SosEventUpdateInput = z.infer<typeof sosEventUpdateSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type GarageInput = z.infer<typeof garageSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
