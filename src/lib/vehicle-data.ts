/**
 * Comprehensive Israeli Vehicle Market Data
 *
 * Contains all manufacturers and models currently sold or commonly found
 * in Israel, including electric (EV) and hybrid vehicles.
 *
 * Used across the app for manufacturer/model selection dropdowns.
 * Models are organized by manufacturer, with EV/Hybrid markers.
 */

export type FuelCategory = 'petrol' | 'diesel' | 'hybrid' | 'electric';

export interface VehicleModel {
  name: string;
  nameHe?: string;        // Hebrew name if different
  fuelCategory: FuelCategory;
}

export interface ManufacturerData {
  name: string;            // Display name (Hebrew or brand)
  models: VehicleModel[];
}

// ─── Complete Israeli Market Vehicle Database ─────────────────────────

export const VEHICLE_DATABASE: ManufacturerData[] = [
  // ══════════════════════ Japanese ══════════════════════
  {
    name: 'טויוטה',
    models: [
      { name: 'יאריס', fuelCategory: 'petrol' },
      { name: 'יאריס קרוס', fuelCategory: 'hybrid' },
      { name: 'אייגו X', fuelCategory: 'petrol' },
      { name: 'קורולה', fuelCategory: 'petrol' },
      { name: 'קורולה Cross', fuelCategory: 'hybrid' },
      { name: 'קורולה Cross הייבריד', fuelCategory: 'hybrid' },
      { name: 'קאמרי', fuelCategory: 'petrol' },
      { name: 'קאמרי הייבריד', fuelCategory: 'hybrid' },
      { name: 'C-HR', fuelCategory: 'hybrid' },
      { name: 'C-HR הייבריד', fuelCategory: 'hybrid' },
      { name: 'RAV4', fuelCategory: 'petrol' },
      { name: 'RAV4 הייבריד', fuelCategory: 'hybrid' },
      { name: 'RAV4 פלאג-אין הייבריד', fuelCategory: 'hybrid' },
      { name: 'היילנדר', fuelCategory: 'hybrid' },
      { name: 'לנד קרוזר', fuelCategory: 'diesel' },
      { name: 'לנד קרוזר פראדו', fuelCategory: 'diesel' },
      { name: 'פריוס', fuelCategory: 'hybrid' },
      { name: 'היילקס', fuelCategory: 'diesel' },
      { name: 'bZ4X', fuelCategory: 'electric' },
      { name: 'פרואייס', fuelCategory: 'diesel' },
      { name: 'אוריס', fuelCategory: 'petrol' },
      { name: 'אוונסיס', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'מזדה',
    models: [
      { name: '2', fuelCategory: 'petrol' },
      { name: '3', fuelCategory: 'petrol' },
      { name: '6', fuelCategory: 'petrol' },
      { name: 'CX-3', fuelCategory: 'petrol' },
      { name: 'CX-30', fuelCategory: 'petrol' },
      { name: 'CX-5', fuelCategory: 'petrol' },
      { name: 'CX-60', fuelCategory: 'hybrid' },
      { name: 'CX-60 PHEV', fuelCategory: 'hybrid' },
      { name: 'CX-9', fuelCategory: 'petrol' },
      { name: 'CX-90', fuelCategory: 'hybrid' },
      { name: 'MX-5', fuelCategory: 'petrol' },
      { name: 'MX-30', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'הונדה',
    models: [
      { name: "ג'אז", fuelCategory: 'hybrid' },
      { name: 'סיוויק', fuelCategory: 'petrol' },
      { name: 'סיוויק הייבריד', fuelCategory: 'hybrid' },
      { name: 'HR-V', fuelCategory: 'hybrid' },
      { name: 'CR-V', fuelCategory: 'petrol' },
      { name: 'CR-V הייבריד', fuelCategory: 'hybrid' },
      { name: 'ZR-V', fuelCategory: 'hybrid' },
      { name: 'אקורד', fuelCategory: 'petrol' },
      { name: 'e:Ny1', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'ניסאן',
    models: [
      { name: 'מיקרה', fuelCategory: 'petrol' },
      { name: "ג'וק", fuelCategory: 'petrol' },
      { name: "ג'וק הייבריד", fuelCategory: 'hybrid' },
      { name: 'קשקאי', fuelCategory: 'petrol' },
      { name: 'קשקאי e-Power', fuelCategory: 'hybrid' },
      { name: 'X-טרייל', fuelCategory: 'petrol' },
      { name: 'X-טרייל e-Power', fuelCategory: 'hybrid' },
      { name: 'ליף', fuelCategory: 'electric' },
      { name: 'אריה', fuelCategory: 'electric' },
      { name: 'נוט', fuelCategory: 'petrol' },
      { name: 'סנטרה', fuelCategory: 'petrol' },
      { name: 'נוורה', fuelCategory: 'diesel' },
      { name: 'פטרול', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'סוזוקי',
    models: [
      { name: 'סוויפט', fuelCategory: 'petrol' },
      { name: 'סוויפט הייבריד', fuelCategory: 'hybrid' },
      { name: 'בלנו', fuelCategory: 'petrol' },
      { name: 'איגניס', fuelCategory: 'hybrid' },
      { name: 'ויטרה', fuelCategory: 'petrol' },
      { name: 'ויטרה הייבריד', fuelCategory: 'hybrid' },
      { name: 'S-Cross', fuelCategory: 'hybrid' },
      { name: "ג'ימני", fuelCategory: 'petrol' },
      { name: 'SX4', fuelCategory: 'petrol' },
      { name: 'פרונקס', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'סובארו',
    models: [
      { name: 'אימפרזה', fuelCategory: 'petrol' },
      { name: 'XV', fuelCategory: 'petrol' },
      { name: 'Crosstrek', fuelCategory: 'petrol' },
      { name: 'פורסטר', fuelCategory: 'petrol' },
      { name: 'פורסטר e-Boxer', fuelCategory: 'hybrid' },
      { name: 'אאוטבק', fuelCategory: 'petrol' },
      { name: 'סולטרה', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'מיצובישי',
    models: [
      { name: 'ספייס סטאר', fuelCategory: 'petrol' },
      { name: 'אטראז\'', fuelCategory: 'petrol' },
      { name: 'ASX', fuelCategory: 'petrol' },
      { name: 'אקליפס קרוס', fuelCategory: 'petrol' },
      { name: 'אקליפס קרוס PHEV', fuelCategory: 'hybrid' },
      { name: 'אאוטלנדר', fuelCategory: 'petrol' },
      { name: 'אאוטלנדר PHEV', fuelCategory: 'hybrid' },
      { name: 'L200', fuelCategory: 'diesel' },
      { name: 'פאג\'רו', fuelCategory: 'diesel' },
    ],
  },
  {
    name: 'לקסוס',
    models: [
      { name: 'UX', fuelCategory: 'hybrid' },
      { name: 'UX 300e', fuelCategory: 'electric' },
      { name: 'NX', fuelCategory: 'hybrid' },
      { name: 'NX 450h+', fuelCategory: 'hybrid' },
      { name: 'RX', fuelCategory: 'hybrid' },
      { name: 'RX 450h+', fuelCategory: 'hybrid' },
      { name: 'RZ', fuelCategory: 'electric' },
      { name: 'ES', fuelCategory: 'hybrid' },
      { name: 'IS', fuelCategory: 'petrol' },
      { name: 'LS', fuelCategory: 'hybrid' },
      { name: 'LBX', fuelCategory: 'hybrid' },
    ],
  },
  {
    name: 'אינפיניטי',
    models: [
      { name: 'Q30', fuelCategory: 'petrol' },
      { name: 'Q50', fuelCategory: 'petrol' },
      { name: 'QX50', fuelCategory: 'petrol' },
      { name: 'QX55', fuelCategory: 'petrol' },
    ],
  },

  // ══════════════════════ Korean ══════════════════════
  {
    name: 'יונדאי',
    models: [
      { name: 'i10', fuelCategory: 'petrol' },
      { name: 'i20', fuelCategory: 'petrol' },
      { name: 'i30', fuelCategory: 'petrol' },
      { name: 'אלנטרה', fuelCategory: 'petrol' },
      { name: 'אלנטרה הייבריד', fuelCategory: 'hybrid' },
      { name: 'קונה', fuelCategory: 'petrol' },
      { name: 'קונה הייבריד', fuelCategory: 'hybrid' },
      { name: 'קונה חשמלית', fuelCategory: 'electric' },
      { name: 'טוסון', fuelCategory: 'petrol' },
      { name: 'טוסון הייבריד', fuelCategory: 'hybrid' },
      { name: 'טוסון PHEV', fuelCategory: 'hybrid' },
      { name: 'סנטה פה', fuelCategory: 'petrol' },
      { name: 'סנטה פה הייבריד', fuelCategory: 'hybrid' },
      { name: 'באיון', fuelCategory: 'petrol' },
      { name: 'קרטה', fuelCategory: 'petrol' },
      { name: 'איוניק 5', fuelCategory: 'electric' },
      { name: 'איוניק 6', fuelCategory: 'electric' },
      { name: 'סטריה', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'קיה',
    models: [
      { name: 'פיקנטו', fuelCategory: 'petrol' },
      { name: 'ריו', fuelCategory: 'petrol' },
      { name: 'סיד', fuelCategory: 'petrol' },
      { name: 'סיד SW', fuelCategory: 'petrol' },
      { name: "ספורטאז'", fuelCategory: 'petrol' },
      { name: "ספורטאז' הייבריד", fuelCategory: 'hybrid' },
      { name: "ספורטאז' PHEV", fuelCategory: 'hybrid' },
      { name: 'נירו', fuelCategory: 'hybrid' },
      { name: 'נירו EV', fuelCategory: 'electric' },
      { name: 'נירו PHEV', fuelCategory: 'hybrid' },
      { name: 'סטוניק', fuelCategory: 'petrol' },
      { name: 'סורנטו', fuelCategory: 'petrol' },
      { name: 'סורנטו הייבריד', fuelCategory: 'hybrid' },
      { name: 'EV6', fuelCategory: 'electric' },
      { name: 'EV9', fuelCategory: 'electric' },
      { name: 'קרניבל', fuelCategory: 'petrol' },
      { name: 'XCeed', fuelCategory: 'petrol' },
    ],
  },
  {
    name: "ג'נסיס",
    models: [
      { name: 'G70', fuelCategory: 'petrol' },
      { name: 'G80', fuelCategory: 'petrol' },
      { name: 'G80 חשמלית', fuelCategory: 'electric' },
      { name: 'GV60', fuelCategory: 'electric' },
      { name: 'GV70', fuelCategory: 'petrol' },
      { name: 'GV70 חשמלית', fuelCategory: 'electric' },
      { name: 'GV80', fuelCategory: 'petrol' },
    ],
  },

  // ══════════════════════ German ══════════════════════
  {
    name: 'פולקסווגן',
    models: [
      { name: 'פולו', fuelCategory: 'petrol' },
      { name: 'גולף', fuelCategory: 'petrol' },
      { name: 'גולף GTE', fuelCategory: 'hybrid' },
      { name: 'T-Cross', fuelCategory: 'petrol' },
      { name: 'T-Roc', fuelCategory: 'petrol' },
      { name: 'טיגואן', fuelCategory: 'petrol' },
      { name: 'טיגואן eHybrid', fuelCategory: 'hybrid' },
      { name: 'פאסאט', fuelCategory: 'petrol' },
      { name: 'פאסאט GTE', fuelCategory: 'hybrid' },
      { name: 'טוארג', fuelCategory: 'petrol' },
      { name: 'טוארג eHybrid', fuelCategory: 'hybrid' },
      { name: 'ID.3', fuelCategory: 'electric' },
      { name: 'ID.4', fuelCategory: 'electric' },
      { name: 'ID.5', fuelCategory: 'electric' },
      { name: 'ID.7', fuelCategory: 'electric' },
      { name: 'Up', fuelCategory: 'petrol' },
      { name: 'קאדי', fuelCategory: 'diesel' },
      { name: 'טרנספורטר', fuelCategory: 'diesel' },
    ],
  },
  {
    name: 'אאודי',
    models: [
      { name: 'A1', fuelCategory: 'petrol' },
      { name: 'A3', fuelCategory: 'petrol' },
      { name: 'A4', fuelCategory: 'petrol' },
      { name: 'A5', fuelCategory: 'petrol' },
      { name: 'A6', fuelCategory: 'petrol' },
      { name: 'Q2', fuelCategory: 'petrol' },
      { name: 'Q3', fuelCategory: 'petrol' },
      { name: 'Q4 e-tron', fuelCategory: 'electric' },
      { name: 'Q5', fuelCategory: 'petrol' },
      { name: 'Q5 TFSI e', fuelCategory: 'hybrid' },
      { name: 'Q7', fuelCategory: 'petrol' },
      { name: 'Q8', fuelCategory: 'petrol' },
      { name: 'Q8 e-tron', fuelCategory: 'electric' },
      { name: 'e-tron GT', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'BMW',
    models: [
      { name: 'סדרה 1', fuelCategory: 'petrol' },
      { name: 'סדרה 2', fuelCategory: 'petrol' },
      { name: 'סדרה 2 Active Tourer', fuelCategory: 'petrol' },
      { name: 'סדרה 3', fuelCategory: 'petrol' },
      { name: 'סדרה 3 PHEV', fuelCategory: 'hybrid' },
      { name: 'סדרה 4', fuelCategory: 'petrol' },
      { name: 'סדרה 5', fuelCategory: 'petrol' },
      { name: 'סדרה 5 PHEV', fuelCategory: 'hybrid' },
      { name: 'סדרה 7', fuelCategory: 'petrol' },
      { name: 'X1', fuelCategory: 'petrol' },
      { name: 'X1 PHEV', fuelCategory: 'hybrid' },
      { name: 'X2', fuelCategory: 'petrol' },
      { name: 'X3', fuelCategory: 'petrol' },
      { name: 'X3 PHEV', fuelCategory: 'hybrid' },
      { name: 'X5', fuelCategory: 'petrol' },
      { name: 'X5 PHEV', fuelCategory: 'hybrid' },
      { name: 'X7', fuelCategory: 'petrol' },
      { name: 'i3', fuelCategory: 'electric' },
      { name: 'i4', fuelCategory: 'electric' },
      { name: 'i5', fuelCategory: 'electric' },
      { name: 'i7', fuelCategory: 'electric' },
      { name: 'iX', fuelCategory: 'electric' },
      { name: 'iX1', fuelCategory: 'electric' },
      { name: 'iX3', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'מרצדס',
    models: [
      { name: 'A-Class', fuelCategory: 'petrol' },
      { name: 'B-Class', fuelCategory: 'petrol' },
      { name: 'C-Class', fuelCategory: 'petrol' },
      { name: 'C-Class PHEV', fuelCategory: 'hybrid' },
      { name: 'E-Class', fuelCategory: 'petrol' },
      { name: 'E-Class PHEV', fuelCategory: 'hybrid' },
      { name: 'S-Class', fuelCategory: 'petrol' },
      { name: 'CLA', fuelCategory: 'petrol' },
      { name: 'CLE', fuelCategory: 'petrol' },
      { name: 'GLA', fuelCategory: 'petrol' },
      { name: 'GLB', fuelCategory: 'petrol' },
      { name: 'GLC', fuelCategory: 'petrol' },
      { name: 'GLC PHEV', fuelCategory: 'hybrid' },
      { name: 'GLE', fuelCategory: 'petrol' },
      { name: 'GLE PHEV', fuelCategory: 'hybrid' },
      { name: 'GLS', fuelCategory: 'petrol' },
      { name: 'EQA', fuelCategory: 'electric' },
      { name: 'EQB', fuelCategory: 'electric' },
      { name: 'EQC', fuelCategory: 'electric' },
      { name: 'EQE', fuelCategory: 'electric' },
      { name: 'EQS', fuelCategory: 'electric' },
      { name: 'V-Class', fuelCategory: 'diesel' },
      { name: 'ויטו', fuelCategory: 'diesel' },
      { name: 'ספרינטר', fuelCategory: 'diesel' },
    ],
  },
  {
    name: 'אופל',
    models: [
      { name: 'קורסה', fuelCategory: 'petrol' },
      { name: 'קורסה-e', fuelCategory: 'electric' },
      { name: 'אסטרה', fuelCategory: 'petrol' },
      { name: 'אסטרה PHEV', fuelCategory: 'hybrid' },
      { name: 'קרוסלנד', fuelCategory: 'petrol' },
      { name: 'גרנדלנד', fuelCategory: 'petrol' },
      { name: 'גרנדלנד PHEV', fuelCategory: 'hybrid' },
      { name: 'מוקה-e', fuelCategory: 'electric' },
      { name: 'קומבו', fuelCategory: 'diesel' },
    ],
  },
  {
    name: 'פורשה',
    models: [
      { name: 'מאקאן', fuelCategory: 'petrol' },
      { name: 'מאקאן חשמלית', fuelCategory: 'electric' },
      { name: 'קאיין', fuelCategory: 'petrol' },
      { name: 'קאיין E-Hybrid', fuelCategory: 'hybrid' },
      { name: 'טייקאן', fuelCategory: 'electric' },
      { name: '911', fuelCategory: 'petrol' },
      { name: 'פנמרה', fuelCategory: 'petrol' },
      { name: 'פנמרה E-Hybrid', fuelCategory: 'hybrid' },
    ],
  },
  {
    name: 'מיני',
    models: [
      { name: 'Cooper', fuelCategory: 'petrol' },
      { name: 'Cooper S', fuelCategory: 'petrol' },
      { name: 'Cooper SE', fuelCategory: 'electric' },
      { name: 'Countryman', fuelCategory: 'petrol' },
      { name: 'Countryman PHEV', fuelCategory: 'hybrid' },
      { name: 'Countryman SE', fuelCategory: 'electric' },
    ],
  },

  // ══════════════════════ French ══════════════════════
  {
    name: 'רנו',
    models: [
      { name: 'קליאו', fuelCategory: 'petrol' },
      { name: 'קליאו הייבריד', fuelCategory: 'hybrid' },
      { name: 'קפטור', fuelCategory: 'petrol' },
      { name: 'קפטור הייבריד', fuelCategory: 'hybrid' },
      { name: 'מגאן', fuelCategory: 'petrol' },
      { name: 'מגאן E-Tech', fuelCategory: 'electric' },
      { name: "קדג'אר", fuelCategory: 'petrol' },
      { name: "קדג'אר הייבריד", fuelCategory: 'hybrid' },
      { name: 'אוסטרל', fuelCategory: 'hybrid' },
      { name: 'ארקנה', fuelCategory: 'hybrid' },
      { name: 'זואי', fuelCategory: 'electric' },
      { name: 'סניק', fuelCategory: 'electric' },
    ],
  },
  {
    name: "פז'ו",
    models: [
      { name: '208', fuelCategory: 'petrol' },
      { name: 'e-208', fuelCategory: 'electric' },
      { name: '2008', fuelCategory: 'petrol' },
      { name: 'e-2008', fuelCategory: 'electric' },
      { name: '308', fuelCategory: 'petrol' },
      { name: '308 PHEV', fuelCategory: 'hybrid' },
      { name: '3008', fuelCategory: 'petrol' },
      { name: '3008 PHEV', fuelCategory: 'hybrid' },
      { name: '3008 חשמלית', fuelCategory: 'electric' },
      { name: '5008', fuelCategory: 'petrol' },
      { name: '5008 PHEV', fuelCategory: 'hybrid' },
      { name: 'פרטנר', fuelCategory: 'diesel' },
      { name: 'רי פטר', fuelCategory: 'diesel' },
    ],
  },
  {
    name: 'סיטרואן',
    models: [
      { name: 'C3', fuelCategory: 'petrol' },
      { name: 'C3 Aircross', fuelCategory: 'petrol' },
      { name: 'C4', fuelCategory: 'petrol' },
      { name: 'ë-C4', fuelCategory: 'electric' },
      { name: 'C4 X', fuelCategory: 'petrol' },
      { name: 'C5 Aircross', fuelCategory: 'petrol' },
      { name: 'C5 Aircross PHEV', fuelCategory: 'hybrid' },
      { name: 'ברלינגו', fuelCategory: 'diesel' },
      { name: 'ë-Berlingo', fuelCategory: 'electric' },
    ],
  },
  {
    name: "דאצ'יה",
    models: [
      { name: 'סנדרו', fuelCategory: 'petrol' },
      { name: 'סנדרו סטפוויי', fuelCategory: 'petrol' },
      { name: "ג'וגר", fuelCategory: 'hybrid' },
      { name: 'דאסטר', fuelCategory: 'petrol' },
      { name: 'Spring', fuelCategory: 'electric' },
    ],
  },

  // ══════════════════════ Italian ══════════════════════
  {
    name: 'פיאט',
    models: [
      { name: '500', fuelCategory: 'petrol' },
      { name: '500 חשמלית', fuelCategory: 'electric' },
      { name: '500X', fuelCategory: 'petrol' },
      { name: 'פנדה', fuelCategory: 'petrol' },
      { name: 'טיפו', fuelCategory: 'petrol' },
      { name: '600e', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'אלפא רומאו',
    models: [
      { name: "ג'וליאטה", fuelCategory: 'petrol' },
      { name: "ג'וליה", fuelCategory: 'petrol' },
      { name: 'טונלה', fuelCategory: 'petrol' },
      { name: 'טונלה PHEV', fuelCategory: 'hybrid' },
      { name: 'סטלביו', fuelCategory: 'petrol' },
    ],
  },

  // ══════════════════════ American ══════════════════════
  {
    name: 'שברולט',
    models: [
      { name: 'ספארק', fuelCategory: 'petrol' },
      { name: 'קרוז', fuelCategory: 'petrol' },
      { name: 'טראקס', fuelCategory: 'petrol' },
      { name: 'אקווינוקס', fuelCategory: 'petrol' },
      { name: 'אקווינוקס EV', fuelCategory: 'electric' },
      { name: 'טראוורס', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'פורד',
    models: [
      { name: 'פיאסטה', fuelCategory: 'petrol' },
      { name: 'פוקוס', fuelCategory: 'petrol' },
      { name: 'פומה', fuelCategory: 'hybrid' },
      { name: 'קוגה', fuelCategory: 'petrol' },
      { name: 'קוגה PHEV', fuelCategory: 'hybrid' },
      { name: 'מוסטנג Mach-E', fuelCategory: 'electric' },
      { name: 'טורנאו', fuelCategory: 'diesel' },
      { name: 'טרנזיט', fuelCategory: 'diesel' },
      { name: 'ריינג\'ר', fuelCategory: 'diesel' },
    ],
  },
  {
    name: "ג'יפ",
    models: [
      { name: 'רנגייד', fuelCategory: 'petrol' },
      { name: 'קומפאס', fuelCategory: 'petrol' },
      { name: 'קומפאס 4xe', fuelCategory: 'hybrid' },
      { name: "צ'רוקי", fuelCategory: 'petrol' },
      { name: 'גרנד צ\'רוקי', fuelCategory: 'petrol' },
      { name: 'גרנד צ\'רוקי 4xe', fuelCategory: 'hybrid' },
      { name: 'רנגלר', fuelCategory: 'petrol' },
      { name: 'רנגלר 4xe', fuelCategory: 'hybrid' },
      { name: 'גלדיאטור', fuelCategory: 'petrol' },
      { name: 'אבנג\'ר', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'טסלה',
    models: [
      { name: 'Model 3', fuelCategory: 'electric' },
      { name: 'Model Y', fuelCategory: 'electric' },
      { name: 'Model S', fuelCategory: 'electric' },
      { name: 'Model X', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'קרייזלר',
    models: [
      { name: 'פסיפיקה', fuelCategory: 'petrol' },
      { name: 'פסיפיקה PHEV', fuelCategory: 'hybrid' },
    ],
  },

  // ══════════════════════ Swedish ══════════════════════
  {
    name: 'וולוו',
    models: [
      { name: 'XC40', fuelCategory: 'petrol' },
      { name: 'XC40 Recharge', fuelCategory: 'electric' },
      { name: 'XC60', fuelCategory: 'petrol' },
      { name: 'XC60 PHEV', fuelCategory: 'hybrid' },
      { name: 'XC90', fuelCategory: 'petrol' },
      { name: 'XC90 PHEV', fuelCategory: 'hybrid' },
      { name: 'C40 Recharge', fuelCategory: 'electric' },
      { name: 'EX30', fuelCategory: 'electric' },
      { name: 'EX40', fuelCategory: 'electric' },
      { name: 'EX90', fuelCategory: 'electric' },
      { name: 'S60', fuelCategory: 'petrol' },
      { name: 'S90', fuelCategory: 'petrol' },
      { name: 'V60', fuelCategory: 'petrol' },
    ],
  },

  // ══════════════════════ Spanish / Czech ══════════════════════
  {
    name: 'סיאט',
    models: [
      { name: 'איביזה', fuelCategory: 'petrol' },
      { name: 'ארונה', fuelCategory: 'petrol' },
      { name: 'לאון', fuelCategory: 'petrol' },
      { name: 'לאון e-Hybrid', fuelCategory: 'hybrid' },
      { name: 'אטקה', fuelCategory: 'petrol' },
      { name: 'טרקו', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'קופרה',
    models: [
      { name: 'פורמנטור', fuelCategory: 'petrol' },
      { name: 'פורמנטור VZ e-Hybrid', fuelCategory: 'hybrid' },
      { name: 'בורן', fuelCategory: 'electric' },
      { name: 'לאון', fuelCategory: 'petrol' },
      { name: 'טראזם', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'סקודה',
    models: [
      { name: 'פביה', fuelCategory: 'petrol' },
      { name: 'סקאלה', fuelCategory: 'petrol' },
      { name: 'אוקטביה', fuelCategory: 'petrol' },
      { name: 'סופרב', fuelCategory: 'petrol' },
      { name: 'קאמיק', fuelCategory: 'petrol' },
      { name: 'קארוק', fuelCategory: 'petrol' },
      { name: 'קודיאק', fuelCategory: 'petrol' },
      { name: 'אניאק', fuelCategory: 'electric' },
      { name: 'אניאק קופה', fuelCategory: 'electric' },
    ],
  },

  // ══════════════════════ Chinese ══════════════════════
  {
    name: 'BYD',
    models: [
      { name: 'Dolphin', fuelCategory: 'electric' },
      { name: 'ATTO 3', fuelCategory: 'electric' },
      { name: 'Seal', fuelCategory: 'electric' },
      { name: 'Seal U', fuelCategory: 'electric' },
      { name: 'Han', fuelCategory: 'electric' },
      { name: 'Tang', fuelCategory: 'electric' },
      { name: 'Dolphin Mini', fuelCategory: 'electric' },
    ],
  },
  {
    name: "ג'ילי",
    models: [
      { name: 'Geometry C', fuelCategory: 'electric' },
      { name: 'אטלס', fuelCategory: 'petrol' },
      { name: 'אמגרנד', fuelCategory: 'petrol' },
      { name: 'מונג\'ארו', fuelCategory: 'hybrid' },
    ],
  },
  {
    name: "צ'רי",
    models: [
      { name: 'טיגו 4 Pro', fuelCategory: 'petrol' },
      { name: 'טיגו 7 Pro', fuelCategory: 'petrol' },
      { name: 'טיגו 8 Pro', fuelCategory: 'petrol' },
      { name: 'אומודה 5', fuelCategory: 'petrol' },
      { name: 'Arrizo 6', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'MG',
    models: [
      { name: 'MG3 הייבריד', fuelCategory: 'hybrid' },
      { name: 'MG4', fuelCategory: 'electric' },
      { name: 'MG5', fuelCategory: 'electric' },
      { name: 'ZS', fuelCategory: 'petrol' },
      { name: 'ZS EV', fuelCategory: 'electric' },
      { name: 'HS', fuelCategory: 'petrol' },
      { name: 'HS PHEV', fuelCategory: 'hybrid' },
      { name: 'Marvel R', fuelCategory: 'electric' },
    ],
  },
  {
    name: "צ'אנגאן",
    models: [
      { name: 'CS35 Plus', fuelCategory: 'petrol' },
      { name: 'CS55 Plus', fuelCategory: 'petrol' },
      { name: 'CS75 Plus', fuelCategory: 'petrol' },
      { name: 'UNI-T', fuelCategory: 'petrol' },
      { name: 'UNI-K', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'GAC',
    models: [
      { name: 'AION Y', fuelCategory: 'electric' },
      { name: 'AION S', fuelCategory: 'electric' },
      { name: 'AION V', fuelCategory: 'electric' },
      { name: 'GS3', fuelCategory: 'petrol' },
    ],
  },
  {
    name: 'NIO',
    models: [
      { name: 'ET5', fuelCategory: 'electric' },
      { name: 'ET7', fuelCategory: 'electric' },
      { name: 'EL6', fuelCategory: 'electric' },
      { name: 'EL7', fuelCategory: 'electric' },
      { name: 'ES8', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'XPENG',
    models: [
      { name: 'G6', fuelCategory: 'electric' },
      { name: 'G9', fuelCategory: 'electric' },
      { name: 'P7', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'LI AUTO',
    models: [
      { name: 'L7', fuelCategory: 'hybrid' },
      { name: 'L8', fuelCategory: 'hybrid' },
      { name: 'L9', fuelCategory: 'hybrid' },
      { name: 'MEGA', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'ZEEKR',
    models: [
      { name: '001', fuelCategory: 'electric' },
      { name: 'X', fuelCategory: 'electric' },
    ],
  },
  {
    name: 'LYNK & CO',
    models: [
      { name: '01', fuelCategory: 'hybrid' },
      { name: '01 PHEV', fuelCategory: 'hybrid' },
    ],
  },
  {
    name: 'פולסטאר',
    models: [
      { name: 'Polestar 2', fuelCategory: 'electric' },
      { name: 'Polestar 3', fuelCategory: 'electric' },
      { name: 'Polestar 4', fuelCategory: 'electric' },
    ],
  },

  // ══════════════════════ Other ══════════════════════
  {
    name: 'לנד רובר',
    models: [
      { name: 'דיפנדר', fuelCategory: 'petrol' },
      { name: 'דיפנדר PHEV', fuelCategory: 'hybrid' },
      { name: 'דיסקברי', fuelCategory: 'petrol' },
      { name: 'דיסקברי ספורט', fuelCategory: 'petrol' },
      { name: 'ריינג\' רובר איווק', fuelCategory: 'petrol' },
      { name: 'ריינג\' רובר איווק PHEV', fuelCategory: 'hybrid' },
      { name: 'ריינג\' רובר ספורט', fuelCategory: 'petrol' },
      { name: 'ריינג\' רובר ספורט PHEV', fuelCategory: 'hybrid' },
      { name: 'ריינג\' רובר', fuelCategory: 'petrol' },
      { name: 'ריינג\' רובר PHEV', fuelCategory: 'hybrid' },
    ],
  },
  {
    name: "ג'אגואר",
    models: [
      { name: 'E-PACE', fuelCategory: 'petrol' },
      { name: 'F-PACE', fuelCategory: 'petrol' },
      { name: 'I-PACE', fuelCategory: 'electric' },
    ],
  },
];

// ─── Helper functions ─────────────────────────────────────────────────

/** Get sorted list of all manufacturer names */
export function getManufacturerNames(): string[] {
  return VEHICLE_DATABASE.map(m => m.name).sort((a, b) => a.localeCompare(b, 'he'));
}

/** Get models for a specific manufacturer */
export function getModelsForManufacturer(manufacturer: string): VehicleModel[] {
  const mfr = VEHICLE_DATABASE.find(
    m => m.name === manufacturer || m.name.toLowerCase() === manufacturer.toLowerCase()
  );
  return mfr?.models ?? [];
}

/** Get model names for a specific manufacturer (string array for dropdowns) */
export function getModelNames(manufacturer: string): string[] {
  return getModelsForManufacturer(manufacturer).map(m => m.name);
}

/** Get fuel category label in Hebrew */
export function getFuelCategoryLabel(category: FuelCategory): string {
  const labels: Record<FuelCategory, string> = {
    petrol: 'בנזין',
    diesel: 'דיזל',
    hybrid: 'היברידי',
    electric: 'חשמלי',
  };
  return labels[category] ?? category;
}

/** Get fuel category badge color */
export function getFuelCategoryColor(category: FuelCategory): string {
  const colors: Record<FuelCategory, string> = {
    petrol: 'bg-gray-100 text-gray-700',
    diesel: 'bg-amber-100 text-amber-700',
    hybrid: 'bg-blue-100 text-blue-700',
    electric: 'bg-green-100 text-green-700',
  };
  return colors[category] ?? 'bg-gray-100 text-gray-700';
}

/** Check if a manufacturer name exists in the database */
export function isKnownManufacturer(name: string): boolean {
  return VEHICLE_DATABASE.some(
    m => m.name === name || m.name.toLowerCase() === name.toLowerCase()
  );
}
