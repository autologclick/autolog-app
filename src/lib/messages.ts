/**
 * Centralized Hebrew messages for the AutoLog application.
 * All user-facing strings should be defined here for consistency and easy maintenance.
 * Developer/log messages remain in English in their respective files.
 */

// ==========================================
// API & Network Errors
// ==========================================
export const API_ERRORS = {
  CONNECTION: 'שגיאת חיבור - בדוק את החיבור לאינטרנט',
  TIMEOUT: 'הבקשה ארכה יותר מדי זמן. נסה שוב',
  SERVER: 'שגיאה בשרת. נסה שוב מאוחר יותר',
  GENERIC: 'שגיאה בביצוע הפעולה',
  PARSE: 'שגיאה בעיבוד התגובה מהשרת',
} as const;

// ==========================================
// Authentication & Authorization
// ==========================================
export const AUTH_ERRORS = {
  UNAUTHORIZED: 'פג תוקף ההתחברות. יש להתחבר מחדש',
  FORBIDDEN: 'אין לך הרשאה לבצע פעולה זו',
  FORBIDDEN_RESOURCE: 'אין לך הרשאה לגשת למשאב זה',
  INVALID_CREDENTIALS: 'מספר טלפון או סיסמה שגויים',
  ACCOUNT_LOCKED: 'החשבון ננעל עקב ניסיונות התחברות רבים. נסה שוב מאוחר יותר',
  TOKEN_EXPIRED: 'קוד האימות פג תוקף. נסה שוב',
  TOKEN_INVALID: 'קוד אימות שגוי',
  PHONE_EXISTS: 'מספר הטלפון כבר רשום במערכת',
  EMAIL_EXISTS: 'כתובת המייל כבר רשומה במערכת',
  WEAK_PASSWORD: 'הסיסמה חלשה מדי. השתמש באותיות, מספרים ותווים מיוחדים',
} as const;

// ==========================================
// Validation
// ==========================================
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'שדה חובה',
  INVALID_PHONE: 'מספר טלפון לא תקין',
  INVALID_EMAIL: 'כתובת מייל לא תקינה',
  INVALID_LICENSE_PLATE: 'מספר רישוי לא תקין',
  INVALID_DATE: 'תאריך לא תקין',
  DATA_VALIDATION: 'שגיאת אימות נתונים',
  FILE_TOO_LARGE: 'הקובץ גדול מדי',
  INVALID_FILE_TYPE: 'סוג קובץ לא נתמך',
} as const;

// ==========================================
// Rate Limiting
// ==========================================
export const RATE_LIMIT_ERRORS = {
  TOO_MANY_REQUESTS: 'יותר מדי בקשות. נסה שוב בעוד כמה שניות',
  TOO_MANY_LOGIN_ATTEMPTS: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות',
  TOO_MANY_SMS: 'יותר מדי הודעות SMS. נסה שוב מאוחר יותר',
} as const;

// ==========================================
// CRUD Operations
// ==========================================
export const CRUD_ERRORS = {
  NOT_FOUND: 'המשאב המבוקש לא נמצא',
  CREATE_FAILED: 'שגיאה ביצירת הרשומה',
  UPDATE_FAILED: 'שגיאה בעדכון הרשומה',
  DELETE_FAILED: 'שגיאה במחיקת הרשומה',
} as const;

// ==========================================
// Success Messages
// ==========================================
export const SUCCESS_MESSAGES = {
  SAVED: 'נשמר בהצלחה',
  UPDATED: 'עודכן בהצלחה',
  DELETED: 'נמחק בהצלחה',
  SENT: 'נשלח בהצלחה',
  LOGIN: 'התחברת בהצלחה',
  LOGOUT: 'התנתקת בהצלחה',
  REGISTERED: 'נרשמת בהצלחה',
  PASSWORD_CHANGED: 'הסיסמה שונתה בהצלחה',
  PROFILE_UPDATED: 'הפרופיל עודכן בהצלחה',
  VEHICLE_ADDED: 'הרכב נוסף בהצלחה',
  VEHICLE_UPDATED: 'פרטי הרכב עודכנו בהצלחה',
  DOCUMENT_UPLOADED: 'המסמך הועלה בהצלחה',
  REMINDER_SET: 'התזכורת נקבעה בהצלחה',
  INSPECTION_SAVED: 'הבדיקה נשמרה בהצלחה',
  INSPECTION_COMPLETED: 'הבדיקה הושלמה בהצלחה',
} as const;

// ==========================================
// Vehicle-Specific
// ==========================================
export const VEHICLE_MESSAGES = {
  NOT_FOUND: 'הרכב לא נמצא',
  ALREADY_EXISTS: 'רכב עם מספר רישוי זה כבר קיים במערכת',
  TEST_EXPIRING: 'הטסט עומד לפוג בקרוב',
  INSURANCE_EXPIRING: 'הביטוח עומד לפוג בקרוב',
  TEST_EXPIRED: 'תוקף הטסט פג',
  INSURANCE_EXPIRED: 'תוקף הביטוח פג',
} as const;

// ==========================================
// Garage-Specific
// ==========================================
export const GARAGE_MESSAGES = {
  APPLICATION_SENT: 'הבקשה נשלחה בהצלחה',
  APPLICATION_APPROVED: 'הבקשה אושרה',
  APPLICATION_REJECTED: 'הבקשה נדחתה',
  NOT_FOUND: 'המוסך לא נמצא',
} as const;

// ==========================================
// UI Labels & Placeholders
// ==========================================
export const UI = {
  LOADING: 'טוען...',
  SAVING: 'שומר...',
  SEARCHING: 'מחפש...',
  NO_RESULTS: 'לא נמצאו תוצאות',
  CONFIRM_DELETE: 'האם אתה בטוח שברצונך למחוק?',
  CONFIRM_ACTION: 'האם אתה בטוח?',
  CANCEL: 'ביטול',
  SAVE: 'שמור',
  DELETE: 'מחק',
  EDIT: 'עריכה',
  CLOSE: 'סגור',
  BACK: 'חזרה',
  NEXT: 'הבא',
  PREVIOUS: 'הקודם',
  SUBMIT: 'שלח',
  RETRY: 'נסה שוב',
} as const;
