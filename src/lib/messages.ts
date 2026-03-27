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
  INVALID_EMAIL_OR_PASSWORD: 'מייל או סיסמה שגויים',
  ACCOUNT_INACTIVE: 'החשבון אינו פעיל',
  LOGIN_ERROR: 'שגיאה בהתחברות. אנא נסה שוב מאוחר יותר.',
  CURRENT_PASSWORD_WRONG: 'סיסמה נוכחית שגויה',
  REFRESH_TOKEN_MISSING: 'אין refresh token',
  REFRESH_TOKEN_INVALID: 'טוקן הרענון אינו תקף',
  REFRESH_ERROR: 'שגיאה ברענון הtoken. אנא התחברו מחדש.',
  ID_NUMBER_EXISTS: 'מספר תעודה זה כבר רשום במערכת',
  EMAIL_OR_ID_EXISTS: 'כתובת המייל או מספר התעודה כבר רשומים במערכת',
  REGISTER_ERROR: 'שגיאה ברישום. אנא נסה שוב מאוחר יותר.',
  INVALID_RESET_LINK: 'קישור לא תקין',
  PASSWORD_REQUIRED: 'סיסמה נדרשת',
  PASSWORD_MIN_LENGTH: 'הסיסמה חייבת להכיל לפחות 8 תווים',
  PASSWORD_UPPERCASE: 'הסיסמה חייבת להכיל אות גדולה באנגלית',
  PASSWORD_LOWERCASE: 'הסיסמה חייבת להכיל אות קטנה באנגלית',
  PASSWORD_DIGIT: 'הסיסמה חייבת להכיל ספרה',
  RESET_LINK_EXPIRED: 'קישור לא תקין או שפג תוקפו. נא לבקש קישור חדש.',
  CSRF_ERROR: 'שגיאה בהנפקת טוקן אבטחה',
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
  TREATMENT_UPDATED: 'הטיפול עודכן בהצלחה',
  TREATMENT_DELETED: 'הטיפול נמחק בהצלחה',
  TREATMENT_APPROVED: 'הטיפול אושר בהצלחה!',
  TREATMENT_REJECTED: 'הטיפול נדחה',
  DOCUMENT_DELETED: 'המסמך נמחק בהצלחה',
  DOCUMENT_UPDATED: 'המסמך עודכן בהצלחה',
  NOTIFICATION_DELETED: 'ההודעה נמחקה בהצלחה',
} as const;

// ==========================================
// Vehicle-Specific
// ==========================================
export const VEHICLE_MESSAGES = {
  NOT_FOUND: 'רכב לא נמצא',
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
  NOT_FOUND: 'מוסך לא נמצא',
} as const;

// ==========================================
// Entity-Specific Not Found Messages
// ==========================================
export const NOT_FOUND = {
  VEHICLE: 'רכב לא נמצא',
  GARAGE: 'מוסך לא נמצא',
  APPOINTMENT: 'תור לא נמצא',
  INSPECTION: 'בדיקה לא נמצאה',
  EXPENSE: 'הוצאה לא נמצאה',
  DOCUMENT: 'מסמך לא נמצא',
  NOTIFICATION: 'הודעה לא נמצאה',
  USER: 'משתמש לא נמצא',
  SOS_EVENT: 'אירוע לא נמצא',
  TREATMENT: 'טיפול לא נמצא',
  REVIEW: 'ביקורת לא נמצאה',
  BENEFIT: 'הטבה לא נמצאה',
} as const;

// ==========================================
// Appointment-Specific Errors
// ==========================================
export const APPOINTMENT_ERRORS = {
  CANNOT_UPDATE_CANCELLED: 'לא ניתן לעדכן תור מבוטל',
  CANNOT_UPDATE_COMPLETED: 'לא ניתן לעדכן תור שהושלם',
  CANNOT_CANCEL: 'לא ניתן לבטל תור זה',
  CANCELLED_SUCCESS: 'התור בוטל בהצלחה',
  ALREADY_COMPLETED: 'התור כבר הושלם',
  VEHICLE_REQUIRED: 'יש לבחור רכב',
  SERVICE_TYPE_REQUIRED: 'יש לבחור סוג טיפול',
} as const;

// ==========================================
// Treatment-Specific
// ==========================================
export const TREATMENT_ERRORS = {
  UNAUTHORIZED: 'טיפול לא נמצא או שאין הרשאה',
  CANNOT_APPROVE: 'לא ניתן לאשר טיפול זה',
  CANNOT_REJECT: 'לא ניתן לדחות טיפול זה',
  INVALID_ACTION: 'פעולה לא תקינה',
} as const;

// ==========================================
// Notification-Specific
// ==========================================
export const NOTIFICATION_ERRORS = {
  MARK_READ_FAILED: 'שגיאה בסימון הודעות',
} as const;

// ==========================================
// Document-Specific  
// ==========================================
export const DOCUMENT_ERRORS = {
  DELETE_FAILED: 'שגיאה במחיקת המסמך',
} as const;

// ==========================================
// Garage Application-Specific
// ==========================================
export const GARAGE_APP_ERRORS = {
  INVALID_STATUS: 'סטטוס לא תקין',
  ALREADY_PROCESSED: 'בקשה זו כבר טופלה',
  NOT_FOUND: 'בקשה לא נמצאה',
} as const;

// ==========================================
// Vehicle Lookup (Ministry of Transport)
// ==========================================
export const VEHICLE_LOOKUP_ERRORS = {
  LICENSE_REQUIRED: 'נא להזין מספר רישוי',
  FETCH_ERROR: 'שגיאה בשליפת נתונים ממשרד התחבורה',
  NOT_FOUND: 'רכב לא נמצא במאגר משרד התחבורה',
  SERVER_DOWN: 'שרת משרד התחבורה לא מגיב, נסה שוב',
  UNKNOWN_ERROR: 'שגיאה לא ידועה',
  SEARCH_ERROR: 'שגיאה בחיפוש רכב',
} as const;

// ==========================================
// Image Upload/Management
// ==========================================
export const IMAGE_ERRORS = {
  NOT_SELECTED: 'לא נבחרה תמונה',
  INVALID_FORMAT: 'פורמט תמונה לא נתמך. השתמש ב-JPEG, PNG או WebP',
  NONE_SELECTED: 'לא נבחרו תמונות',
  UPLOAD_FAILED: 'לא הצלחנו להעלות את התמונות. בדוק את הפורמט והגודל.',
  INVALID_TYPE: 'סוג לא תקין. השתמש ב-logo או gallery',
  INVALID_IMAGE: 'תמונה לא תקינה',
  INVALID_FILENAME: 'שם קובץ לא תקין',
  SPECIFY_IMAGE: 'נא לציין תמונה למחיקה',
  LOGO_UPLOADED: 'הלוגו הועלה בהצלחה',
  LOGO_DELETED: 'הלוגו נמחק',
  IMAGE_DELETED: 'התמונה נמחקה',
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

// Last verified: 2026-03-27-ui
