/**
 * Centralized Hebrew translations for the AutoLog application.
 * All user-facing Hebrew string mappings live here as the single source of truth.
 */

// =============================================
// Service types (appointments & inspections)
// =============================================

export const SERVICE_TYPE_HEB: Record<string, string> = {
  inspection: 'בדיקה',
  maintenance: 'טיפול',
  repair: 'תיקון',
  test_prep: 'הכנה לטסט',
};

// =============================================
// Appointment statuses
// =============================================

export const APPOINTMENT_STATUS_HEB: Record<string, string> = {
  pending: 'ממתין לאישור',
  confirmed: 'מאזשר',
  rejected: 'נדחה',
  in_progress: 'בטיפול',
  completed: 'הושלם',
  cancelled: 'מבוטל',
};

// Time limit for garage to respond to appointment (in minutes)
export const APPOINTTENT_RESPONSE_TIMEOUT_MINUTES = 3;

// =============================================
// User roles
// =============================================

export const USER_ROLE_HEB: Record<string, string> = {
  user: 'משתמש',
  admin: 'מנהל',
  garage_owner: 'בעל מוסך',
};

// =============================================
// SOS event types
// =============================================

export const SOS_TYPE_HEB: Record<string, string> = {
  accident: 'תאונה',
  breakdown: 'תקלה מכנית',
  flat_tire: 'צמיג תקוע',
  fuel: 'דלק נגמר',
  electrical: 'בעיה חשמלית',
  locked_out: 'נעילה ברכב',
  other: 'אחר',
};

// =============================================
// History event titles
// =============================================

export const HISTORY_EVENT_TITLES: Record<string, string> = {
  inspection: 'בדיקה טכנית',
  appointment: 'תור בסדנה',
  expense: 'הוצאה',
  sos: 'קריאת SOS',
};

// =============================================
// Inspection type names (for history)
// =============================================

export const INSPECTION_TYPE_HEB: Record<string, string> = {
  inspection: 'בדיקה טכנית',
  maintenance: 'תחזוקה',
  repair: 'תיקון',
  test_prep: 'הכנה למבחן',
  full: 'בדיקה מלאה',
  pre_test: 'הכנה לטסט',
  rot: 'בדיקת רקב',
};

// =============================================
// Expense categories
// =============================================

export const EXPENSE_CATEGORY_HEB: Record<string, string> = {
  fuel: 'דלק',
  maintenance: 'תחזוקה',
  insurance: 'ביטוח',
  test: 'בדיקה טכנית',
  parking: 'חנייה',
  fine: 'קנס',
  other: 'אחר',
};

// =============================================
// Inspection item name maps
// =============================================

export const TIRE_NAMES_HEB: Record<string, string> = {
  frontLeft: 'צמיג קדמי שמאל',
  frontRight: 'צמיג קדמי ימין',
  rearLeft: 'צמיג אחורי שמאל',
  rearRight: 'צמיג אחורי ימין',
};

export const LIGHT_NAMES_HEB: Record<string, string> = {
  brakes: 'אורות בלם',
  reverse: 'אורות ריוורס',
  fog: 'אורות ערפל',
  headlights: 'פנסים ראשיים',
  frontSignal: 'איתות קדמי',
  rearSignal: 'איתות אחורי',
  highBeam: 'אור גבוה',
  plate: 'תאורת לוחית',
};

export const FLUID_NAMES_HEB: Record<string, string> = {
  brakeFluid: 'נוזל בלמים',
  engineOil: 'שמן מנוע',
  coolant: 'נוזל קירור',
};

export const PRE_TEST_NAMES_HEB: Record<string, string> = {
  tires: 'צמיגים (מצב + לחץ)',
  lights: 'אורות ומחוונים',
  brakes: 'בלמים',
  mirrors: 'מראות',
  wipers: 'מגבים + נוזל',
  horn: 'צופר',
  seatbelts: 'חגורות בטיחות',
  exhaust: 'מערכת פליטה',
  steering: 'היגוי',
  suspension: 'מתלים ובולמים',
  fluids: 'נוזלים',
  battery: 'מצבר',
  handbrake: 'בלם יד',
  speedometer: 'מד מהירות',
  windows: 'חלונות ושמשות',
};
