/**
 * Vehicle Name Mapping Utility
 *
 * The Israeli Ministry of Transport (MOT) API returns technical manufacturer
 * names (e.g., "מזדה יפן", "טויוטה טורקיה") and internal model codes
 * (e.g., "BN627", "MZEA11L-DEXNBW") instead of consumer-friendly names.
 *
 * This module normalizes those to commercial names users recognize:
 *   "מזדה יפן" + "BN627" → "מזדה" + "3"
 *   "טויוטה טורקיה" + "MZEA11L-DEXNBW" → "טויוטה" + "קורולה"
 */

// --- Manufacturer normalization ---
// MOT adds origin country suffix; we strip it to the brand name.
// Keys are lowercase for case-insensitive matching.
const MANUFACTURER_MAP: Record<string, string> = {
  // Japanese
  'מזדה יפן': 'מזדה',
  'מזדה תאילנד': 'מזדה',
  'מאזדה יפן': 'מזדה',
  'מאזדה תאילנד': 'מזדה',
  'טויוטה יפן': 'טויוטה',
  'טויוטה טורקיה': 'טויוטה',
  'טויוטה תאילנד': 'טויוטה',
  'טויוטה דרום אפריקה': 'טויוטה',
  'טויוטה אנגליה': 'טויוטה',
  'טויוטה צרפת': 'טויוטה',
  'הונדה יפן': 'הונדה',
  'הונדה תאילנד': 'הונדה',
  'הונדה אנגליה': 'הונדה',
  'ניסאן יפן': 'ניסאן',
  'ניסאן אנגליה': 'ניסאן',
  'ניסאן ספרד': 'ניסאן',
  'ניסאן מקסיקו': 'ניסאן',
  'סוזוקי יפן': 'סוזוקי',
  'סוזוקי הונגריה': 'סוזוקי',
  'סוזוקי הודו': 'סוזוקי',
  'סובארו יפן': 'סובארו',
  'מיצובישי יפן': 'מיצובישי',
  'מיצובישי תאילנד': 'מיצובישי',
  'לקסוס יפן': 'לקסוס',
  'לקסוס': 'לקסוס',
  'אינפיניטי יפן': 'אינפיניטי',
  'דייהטסו יפן': 'דייהטסו',

  // Korean
  'יונדאי קוריאה': 'יונדאי',
  'יונדאי טורקיה': 'יונדאי',
  'יונדאי צ\'כיה': 'יונדאי',
  'יונדאי הודו': 'יונדאי',
  'קיה קוריאה': 'קיה',
  'קיה סלובקיה': 'קיה',
  'ג\'נסיס קוריאה': "ג'נסיס",

  // German
  'פולקסווגן גרמניה': 'פולקסווגן',
  'פולקסוגן גרמניה': 'פולקסווגן',
  'פולקסווגן ספרד': 'פולקסווגן',
  'פולקסווגן פולין': 'פולקסווגן',
  'פולקסווגן מקסיקו': 'פולקסווגן',
  'פולקסווגן דרום אפריקה': 'פולקסווגן',
  'אאודי גרמניה': 'אאודי',
  'אאודי הונגריה': 'אאודי',
  'אאודי מקסיקו': 'אאודי',
  'ב.מ.וו גרמניה': 'BMW',
  'ב.מ.וו. גרמניה': 'BMW',
  'ב מ וו גרמניה': 'BMW',
  'BMW גרמניה': 'BMW',
  'מרצדס גרמניה': 'מרצדס',
  'מרצדס הונגריה': 'מרצדס',
  'מרצדס דרום אפריקה': 'מרצדס',
  'אופל גרמניה': 'אופל',
  'אופל ספרד': 'אופל',
  'אופל פולין': 'אופל',
  'פורשה גרמניה': 'פורשה',
  'מיני אנגליה': 'מיני',
  'מיני הולנד': 'מיני',
  // Cupra (Spain) — sport sub-brand of SEAT
  'קופרה ספרד': 'קופרה',
  'CUPRA ספרד': 'קופרה',
  // DS Automobiles (France, premium PSA brand)
  'DS צרפת': 'DS',
  'DS גרמניה': 'DS',
  // Smart (Germany/China since 2022)
  'סמארט גרמניה': 'סמארט',
  'סמארט סלובניה': 'סמארט',
  'סמארט סין': 'סמארט',

  // French
  'רנו צרפת': 'רנו',
  'רנו ספרד': 'רנו',
  'רנו טורקיה': 'רנו',
  'רנו רומניה': 'רנו',
  'פז\'ו צרפת': "פז'ו",
  'פיז\'ו צרפת': "פז'ו",
  'סיטרואן צרפת': 'סיטרואן',
  'סיטרואן ספרד': 'סיטרואן',
  'דאצ\'יה רומניה': "דאצ'יה",

  // Italian
  'פיאט איטליה': 'פיאט',
  'פיאט פולין': 'פיאט',
  'פיאט טורקיה': 'פיאט',
  'אלפא רומאו איטליה': 'אלפא רומאו',

  // American
  'שברולט קוריאה': 'שברולט',
  'שברולט ארה"ב': 'שברולט',
  'פורד גרמניה': 'פורד',
  'פורד ספרד': 'פורד',
  'פורד ארה"ב': 'פורד',
  'ג\'יפ ארה"ב': "ג'יפ",
  'ג\'יפ איטליה': "ג'יפ",
  'טסלה ארה"ב': 'טסלה',
  'טסלה סין': 'טסלה',
  'קרייזלר ארה"ב': 'קרייזלר',
  'קרייזלר קנדה': 'קרייזלר',

  // Swedish
  'וולוו שבדיה': 'וולוו',
  'וולוו בלגיה': 'וולוו',
  'וולוו סין': 'וולוו',
  // Polestar (Sweden, Volvo's EV sub-brand — produced in China)
  'פולסטאר שבדיה': 'פולסטאר',
  'פולסטאר סין': 'פולסטאר',
  'POLESTAR סין': 'פולסטאר',

  // Spanish / Czech
  'סיאט ספרד': 'סיאט',
  'סקודה צ\'כיה': 'סקודה',

  // Chinese
  'BYD סין': 'BYD',
  'ג\'ילי סין': "ג'ילי",
  'צ\'רי סין': "צ'רי",
  'MG סין': 'MG',
  'CHANGAN סין': 'צ\'אנגאן',
  'GAC סין': 'GAC',
  'NIO סין': 'NIO',
  'XPENG סין': 'XPENG',
  'LI AUTO סין': 'LI AUTO',
  'ZEEKR סין': 'ZEEKR',
  'LYNK&CO סין': 'לינק וקו',
  'LYNK & CO סין': 'לינק וקו',
  'לינק וקו סין': 'לינק וקו',
};

// --- Model code → commercial name ---
// The MOT API returns alphanumeric codes. We map the most common ones
// found in Israeli vehicle registrations. This covers ~80% of vehicles
// on the road. Unknown codes pass through unchanged.
//
// Organized by manufacturer for maintainability.
const MODEL_MAP: Record<string, Record<string, string>> = {
  'מזדה': {
    // Mazda 2
    'DJ': '2', 'DE': '2', 'DY': '2',
    // Mazda 3
    'BN': '3', 'BM': '3', 'BL': '3', 'BK': '3', 'BP': '3',
    // Mazda 6
    'GL': '6', 'GJ': '6', 'GH': '6', 'GG': '6',
    // CX series
    'KF': 'CX-5', 'KE': 'CX-5',
    'DK': 'CX-3',
    'TC': 'CX-30',
    'KH': 'CX-60',
    'CX9': 'CX-9', 'TB': 'CX-9',
    // MX-5
    'ND': 'MX-5', 'NC': 'MX-5',
  },
  'טויוטה': {
    // Corolla
    'MZEA': 'קורולה', 'NRE': 'קורולה', 'ZRE': 'קורולה', 'NDE': 'קורולה', 'ZZE': 'קורולה', 'NZE': 'קורולה',
    // Yaris
    'MXPA': 'יאריס', 'NHP': 'יאריס', 'NSP': 'יאריס', 'NCP': 'יאריס', 'KSP': 'יאריס',
    'MXPH': 'יאריס קרוס',
    // Camry
    'AXVA': 'קאמרי', 'AXVH': 'קאמרי', 'ASV': 'קאמרי', 'ACV': 'קאמרי', 'GSV': 'קאמרי',
    // RAV4
    'MXAA': 'RAV4', 'AXAH': 'RAV4', 'ALA': 'RAV4', 'ASA': 'RAV4', 'ACA': 'RAV4',
    // C-HR
    'NGX': 'C-HR', 'ZYX': 'C-HR',
    // Highlander
    'AXUH': 'היילנדר',
    // Land Cruiser
    'GRJ': 'לנד קרוזר', 'VDJ': 'לנד קרוזר', 'URJ': 'לנד קרוזר', 'GDJ': 'לנד קרוזר',
    // Prius
    'ZVW': 'פריוס', 'NHW': 'פריוס',
    // Hilux
    'GUN': 'היילקס', 'KUN': 'היילקס',
    // Aygo
    'KGB': 'אייגו',
    // Avensis
    'ADT': 'אוונסיס', 'AZT': 'אוונסיס',
    // Auris
    'NRE18': 'אוריס', 'ZRE18': 'אוריס',
  },
  'יונדאי': {
    // i10
    'AC3': 'i10', 'BA': 'i10', 'PA': 'i10',
    // i20
    'BC3': 'i20', 'GB': 'i20', 'PB': 'i20',
    // i30
    'CN7': 'i30', 'PD': 'i30', 'GD': 'i30', 'FD': 'i30',
    // i35 / Elantra
    'CN7N': 'אלנטרה',
    // Tucson
    'NX4': 'טוסון', 'TL': 'טוסון', 'LM': 'טוסון', 'JM': 'טוסון',
    // Kona
    'OS': 'קונה', 'SX2': 'קונה',
    // Creta
    'GS': 'קרטה', 'SU2': 'קרטה',
    // Santa Fe
    'TM': 'סנטה פה', 'DM': 'סנטה פה', 'CM': 'סנטה פה',
    // Ioniq
    'AE': 'איוניק', 'IONIQ5': 'איוניק 5', 'IONIQ6': 'איוניק 6',
    // Bayon
    'BC3CUV': 'באיון',
  },
  'קיה': {
    // Picanto
    'JA': 'פיקנטו', 'TA': 'פיקנטו', 'SA': 'פיקנטו',
    // Rio
    'YB': 'ריו', 'UB': 'ריו', 'JB': 'ריו',
    // Ceed
    'CD': 'סיד', 'JD': 'סיד',
    // Sportage
    'NQ5': 'ספורטאז\'', 'QL': 'ספורטאז\'', 'SL': 'ספורטאז\'',
    // Niro
    'DE': 'נירו', 'SG2': 'נירו',
    // Sorento
    'MQ4': 'סורנטו', 'UM': 'סורנטו', 'XM': 'סורנטו',
    // Stonic
    'YB CUV': 'סטוניק',
    // EV6
    'CV': 'EV6',
    // Carnival
    'KA4': 'קרניבל',
  },
  'הונדה': {
    // Jazz / Fit
    'GK': 'ג\'אז', 'GE': 'ג\'אז', 'GD': 'ג\'אז',
    // Civic
    'FL': 'סיוויק', 'FK': 'סיוויק', 'FB': 'סיוויק', 'FD': 'סיוויק',
    // HR-V
    'RV': 'HR-V',
    // CR-V
    'RW': 'CR-V', 'RM': 'CR-V', 'RE': 'CR-V',
    // Accord
    'CV1': 'אקורד', 'CU': 'אקורד', 'CL': 'אקורד',
  },
  'ניסאן': {
    // Micra
    'K14': 'מיקרה', 'K13': 'מיקרה', 'K12': 'מיקרה',
    // Juke
    'F16': 'ג\'וק', 'F15': 'ג\'וק',
    // Qashqai
    'J12': 'קשקאי', 'J11': 'קשקאי', 'J10': 'קשקאי',
    // X-Trail
    'T33': 'X-טרייל', 'T32': 'X-טרייל', 'T31': 'X-טרייל',
    // Leaf
    'ZE1': 'ליף', 'ZE0': 'ליף',
    // Note
    'E13': 'נוט', 'E12': 'נוט',
    // Sentra
    'B18': 'סנטרה', 'B17': 'סנטרה',
  },
  'סוזוקי': {
    // Swift
    'AZ': 'סוויפט', 'ZC': 'סוויפט', 'ZD': 'סוויפט',
    // Vitara / Grand Vitara
    'LY': 'ויטרה', 'JB': 'ויטרה', 'JT': 'גרנד ויטרה',
    // Baleno
    'EW': 'בלנו',
    // SX4 / S-Cross
    'YA': 'SX4', 'YB': 'S-Cross',
    // Ignis
    'MF': 'איגניס',
    // Jimny
    'JB74': 'ג\'ימני', 'JB64': 'ג\'ימני',
  },
  'סקודה': {
    // Fabia
    'NJ': 'פביה', 'PJ': 'פביה',
    // Octavia
    'NX': 'אוקטביה', 'NE': 'אוקטביה', '1Z': 'אוקטביה',
    // Superb
    '3V': 'סופרב', '3T': 'סופרב',
    // Karoq
    'NU': 'קארוק',
    // Kodiaq
    'NS': 'קודיאק',
    // Kamiq
    'NW': 'קאמיק',
    // Scala
    'NW S': 'סקאלה',
    // Enyaq
    'IV': 'אניאק',
  },
  'פולקסווגן': {
    // Polo
    'AW': 'פולו', '6R': 'פולו', '6C': 'פולו', '9N': 'פולו',
    // Golf
    'CD': 'גולף', '5G': 'גולף', 'AU': 'גולף', '1K': 'גולף',
    // T-Cross
    'C1': 'T-Cross',
    // T-Roc
    'A1': 'T-Roc',
    // Tiguan
    'AD': 'טיגואן', '5N': 'טיגואן',
    // Passat
    'CB': 'פאסאט', '3G': 'פאסאט', '3C': 'פאסאט',
    // Touareg
    'CR': 'טוארג', '7P': 'טוארג',
    // ID.3 / ID.4
    'ID3': 'ID.3', 'E1': 'ID.3',
    'ID4': 'ID.4', 'E2': 'ID.4',
    // Up
    'AA': 'Up',
    // Caddy
    'SK': 'קאדי', '2K': 'קאדי',
  },
  'BMW': {
    // 1 Series
    'F20': 'סדרה 1', 'F21': 'סדרה 1', 'F40': 'סדרה 1',
    // 2 Series
    'F22': 'סדרה 2', 'F45': 'סדרה 2', 'U06': 'סדרה 2',
    // 3 Series
    'G20': 'סדרה 3', 'G21': 'סדרה 3', 'F30': 'סדרה 3', 'F31': 'סדרה 3',
    // 5 Series
    'G30': 'סדרה 5', 'G31': 'סדרה 5', 'F10': 'סדרה 5',
    // X1
    'F48': 'X1', 'U11': 'X1',
    // X3
    'G01': 'X3', 'F25': 'X3',
    // X5
    'G05': 'X5', 'F15': 'X5',
    // i3 / i4 / iX
    'I01': 'i3',
    'G26': 'i4',
    'I20': 'iX',
  },
  'מרצדס': {
    // A-Class
    'W177': 'A-Class', 'W176': 'A-Class',
    // B-Class
    'W247': 'B-Class', 'W246': 'B-Class',
    // C-Class
    'W206': 'C-Class', 'W205': 'C-Class', 'W204': 'C-Class',
    // E-Class
    'W214': 'E-Class', 'W213': 'E-Class', 'W212': 'E-Class',
    // GLA
    'H247': 'GLA', 'X156': 'GLA',
    // GLB
    'X247': 'GLB',
    // GLC
    'X254': 'GLC', 'X253': 'GLC',
    // GLE
    'V167': 'GLE', 'W166': 'GLE',
    // CLA
    'C118': 'CLA', 'C117': 'CLA',
    // EQA / EQB / EQC
    'H243': 'EQA',
    'X243': 'EQB',
    'N293': 'EQC',
  },
  'רנו': {
    // Clio
    'BF': 'קליאו', 'BH': 'קליאו', 'BR': 'קליאו',
    // Captur
    'HJB': 'קפטור', 'J87': 'קפטור',
    // Megane
    'KFB': 'מגאן', 'BFB': 'מגאן', 'KZ': 'מגאן',
    // Kadjar
    'HFE': 'קדג\'אר',
    // Austral
    'HN': 'אוסטרל',
    // Arkana
    'LJL': 'ארקנה',
    // ZOE
    'BFM': 'זואי',
  },
  "פז'ו": {
    // 208
    'P21': '208', 'P2': '208',
    // 2008
    'P24': '2008', 'PU': '2008',
    // 308
    'P51': '308', 'P5': '308', 'T9': '308',
    // 3008
    'P84': '3008', 'P8': '3008',
    // 5008
    'P87': '5008',
    // Partner
    'B9': 'פרטנר', 'K9': 'רי פטר',
  },
  'סיטרואן': {
    // C3
    'SX': 'C3',
    // C4
    'C41': 'C4',
    // C5 Aircross
    'C5A': 'C5 Aircross',
    // Berlingo
    'B9': 'ברלינגו', 'K9': 'ברלינגו',
  },
  'פיאט': {
    // 500
    '312': '500',
    // Panda
    '312P': 'פנדה', '319': 'פנדה',
    // Tipo
    '356': 'טיפו',
    // Punto
    '199': 'פונטו',
  },
  'סובארו': {
    // Impreza
    'GK': 'אימפרזה', 'GP': 'אימפרזה',
    // XV / Crosstrek
    'GU': 'XV', 'GT': 'XV',
    // Forester
    'SK': 'פורסטר', 'SJ': 'פורסטר', 'SH': 'פורסטר',
    // Outback
    'BT': 'אאוטבק', 'BS': 'אאוטבק', 'BR': 'אאוטבק',
  },
  'BYD': {
    'ATTO3': 'ATTO 3',
    'DOLPHIN': 'Dolphin',
    'SEAL': 'Seal',
    'HAN': 'Han',
    'TANG': 'Tang',
    'SEALION': 'Sealion 7',
    'SONG': 'Song Plus',
  },
  'טסלה': {
    'MODEL3': 'Model 3',
    'MODELY': 'Model Y',
    'MODELS': 'Model S',
    'MODELX': 'Model X',
  },
  'מיצובישי': {
    // Space Star / Mirage — small hatchback (very common in Israel)
    'A03': 'ספייס סטאר', 'XTA03': 'ספייס סטאר', 'A05': 'ספייס סטאר',
    'XTA05': 'ספייס סטאר', 'A04': 'ספייס סטאר',
    // Attrage — sedan version of Space Star
    'A13': 'אטראז\'', 'XTA13': 'אטראז\'', 'A14': 'אטראז\'', 'A15': 'אטראז\'',
    // ASX — compact SUV
    'GA': 'ASX', 'XB': 'ASX', 'XBW': 'ASX', 'XCJW': 'ASX',
    // Outlander — midsize SUV
    'GG': 'אאוטלנדר', 'GF': 'אאוטלנדר', 'CW': 'אאוטלנדר',
    'ZJ': 'אאוטלנדר', 'ZK': 'אאוטלנדר', 'GN': 'אאוטלנדר',
    // Eclipse Cross
    'GK': 'אקליפס קרוס', 'YA': 'אקליפס קרוס',
    // Lancer
    'CY': 'לנסר', 'CZ': 'לנסר', 'CX': 'לנסר', 'CT': 'לנסר',
    // L200 / Triton — pickup
    'KK': 'L200', 'KL': 'L200', 'KR': 'L200', 'KS': 'L200',
    // Pajero / Shogun — full-size SUV
    'V60': 'פאג\'רו', 'V70': 'פאג\'רו', 'V80': 'פאג\'רו',
    'V90': 'פאג\'רו', 'V100': 'פאג\'רו',
    // Colt
    'Z2': 'קולט', 'Z3': 'קולט',
    // i-MiEV — small EV
    'HA': 'i-MiEV',
    // Galant
    'EA': 'גלאנט', 'DJ': 'גלאנט',
  },
  'פורד': {
    // Fiesta
    'JA8': 'פייסטה', 'WS6': 'פייסטה', 'JH8': 'פייסטה',
    // Focus
    'DYB': 'פוקוס', 'CB8': 'פוקוס', 'DA': 'פוקוס',
    // Kuga / Escape
    'C520': 'קוגה', 'CBV': 'קוגה', 'CBS': 'קוגה',
    // Edge
    'CDX': 'אדג\'', 'CD': 'אדג\'',
    // Mondeo
    'CD345': 'מונדאו', 'BA7': 'מונדאו',
    // Mustang
    'S550': 'מוסטנג', 'S197': 'מוסטנג',
    // Explorer
    'U625': 'אקספלורר', 'U502': 'אקספלורר',
    // Transit
    'V363': 'טרנזיט', 'V362': 'טרנזיט',
    // Puma
    'J1U': 'פומה',
    // Ranger
    'P703': 'ריינג\'ר', 'P558': 'ריינג\'ר',
  },
  "ג'יפ": {
    // Grand Cherokee
    'WL': 'גרנד צ\'ירוקי', 'WK': 'גרנד צ\'ירוקי', 'WK2': 'גרנד צ\'ירוקי',
    // Cherokee
    'KL': 'צ\'ירוקי', 'KK': 'צ\'ירוקי',
    // Wrangler
    'JL': 'רנגלר', 'JK': 'רנגלר',
    // Compass
    'MP': 'קומפאס', 'M6': 'קומפאס',
    // Renegade
    'BU': 'רנגייד',
    // Avenger
    'CUV': 'אוונג\'ר',
    // Gladiator
    'JT': 'גלדיאטור',
  },
  'אופל': {
    // Corsa
    'F': 'קורסה', 'E': 'קורסה', 'D': 'קורסה',
    // Astra
    'K': 'אסטרה', 'J': 'אסטרה',
    // Mokka
    'B': 'מוקה',
    // Crossland
    'P17': 'קרוסלנד',
    // Grandland
    'A18': 'גרנדלנד',
    // Insignia
    'Z18': 'אינסיגניה',
    // Combo
    'X19': 'קומבו', 'D2': 'קומבו',
  },
  'אאודי': {
    // A1
    'GB': 'A1', '8X': 'A1',
    // A3
    '8Y': 'A3', '8V': 'A3', '8P': 'A3',
    // A4
    'B9': 'A4', 'B8': 'A4',
    // A5
    'F5': 'A5',
    // A6
    'C8': 'A6', 'C7': 'A6',
    // A7
    'C8 F2': 'A7',
    // A8
    'D5': 'A8',
    // Q2
    'GA': 'Q2',
    // Q3
    'F3': 'Q3', '8U': 'Q3',
    // Q4 e-tron
    'F4': 'Q4 e-tron',
    // Q5
    'FY': 'Q5', '8R': 'Q5',
    // Q7
    '4M': 'Q7',
    // Q8
    '4MN': 'Q8',
    // e-tron / e-tron GT
    'GE': 'e-tron GT',
  },
  "דאצ'יה": {
    // Sandero
    'B8': 'סנדרו', 'SD': 'סנדרו',
    // Duster
    'HM': 'דאסטר', 'HS': 'דאסטר', 'SR': 'דאסטר',
    // Logan
    'L52': 'לוגאן', 'LSR': 'לוגאן',
    // Spring (EV)
    'HV': 'ספרינג',
    // Jogger
    'JJ': 'ג\'וגר',
  },
  'שברולט': {
    'KL1': 'ספארק', // Spark
    'J400': 'קרוז',  // Cruze
    'D2': 'קפטיבה',  // Captiva
    'P0': 'אוורנדה', // Aveo
    'D1': 'מאליבו',  // Malibu
  },
  'MG': {
    'AS23': 'MG3',
    'ZS': 'ZS',
    'HS': 'HS',
    'EHS': 'EHS',
    'MARVELR': 'Marvel R',
    'MG4': 'MG4',
    'MG5': 'MG5',
    'MG7': 'MG7',
    'CYBERSTER': 'Cyberster',
  },
  'סיאט': {
    // Ibiza
    'KJ': 'איביזה', '6F': 'איביזה', '6J': 'איביזה', '6P': 'איביזה',
    // Leon
    'KL': 'ליאון', '5F': 'ליאון', '1P': 'ליאון',
    // Arona
    'KJ7': 'ארונה',
    // Ateca
    '5FP': 'אטקה', 'KH7': 'אטקה',
    // Tarraco
    'KN2': 'טאראקו',
    // Mii
    'KF': 'מיי',
    // Toledo
    'KG': 'טולדו',
    // Alhambra
    '7N': 'אלהמברה',
  },
  'קופרה': {
    // Born (EV)
    'KL1F': 'בורן', 'BORN': 'בורן',
    // Formentor
    'KM7': 'פורמנטור', 'FORMENTOR': 'פורמנטור',
    // Leon (Cupra version)
    'KL8': 'ליאון',
    // Ateca (Cupra version)
    'KH7C': 'אטקה',
    // Tavascan
    'TAVASCAN': 'טבסקאן',
    // Terramar
    'TERRAMAR': 'טראמאר',
  },
  'וולוו': {
    // XC40
    'XC40': 'XC40', '536': 'XC40',
    // XC60
    'XC60': 'XC60', '246': 'XC60',
    // XC90
    'XC90': 'XC90', '256': 'XC90',
    // S60
    'S60': 'S60', '224': 'S60',
    // S90
    'S90': 'S90', '234': 'S90',
    // V60
    'V60': 'V60', '225': 'V60',
    // V90
    'V90': 'V90', '235': 'V90',
    // C40 (EV)
    'C40': 'C40', '536R': 'C40',
    // EX30 / EX90 (newer EVs)
    'EX30': 'EX30',
    'EX90': 'EX90',
  },
  'מיני': {
    // Cooper Hatch
    'F66': 'קופר', 'F56': 'קופר', 'F55': 'קופר', 'R56': 'קופר', 'R53': 'קופר',
    // Cooper Convertible
    'F57': 'קופר קבריולה',
    // Clubman
    'F54': 'קלאבמן', 'R55': 'קלאבמן',
    // Countryman
    'U25': 'קאנטרימן', 'F60': 'קאנטרימן', 'R60': 'קאנטרימן',
    // Aceman (EV)
    'J05': 'אייסמן',
    // Cooper SE (electric)
    'F66E': 'קופר SE',
  },
  'לקסוס': {
    // RX
    'AL20': 'RX', 'AL10': 'RX',
    // NX
    'AZ20': 'NX', 'AZ10': 'NX',
    // UX
    'MZAA': 'UX',
    // IS
    'GSE': 'IS', 'ASE': 'IS',
    // ES
    'AXZH': 'ES', 'AXZA': 'ES',
    // LS
    'VXFA': 'LS',
    // LX
    'VJA': 'LX', 'URJ': 'LX',
    // CT
    'ZWA': 'CT',
    // LBX (newest)
    'LBX': 'LBX',
    // RZ (EV)
    'XEBM': 'RZ',
  },
  'DS': {
    'DS3': 'DS3',
    'DS4': 'DS4',
    'DS5': 'DS5',
    'DS7': 'DS7 Crossback',
    'DS9': 'DS9',
    'CROSSBACK': 'DS7 Crossback',
  },
  'פולסטאר': {
    'POLESTAR1': 'Polestar 1',
    'POLESTAR2': 'Polestar 2',
    'POLESTAR3': 'Polestar 3',
    'POLESTAR4': 'Polestar 4',
    '533': 'Polestar 2',
    '634': 'Polestar 3',
  },
  'ג\'נסיס': {
    'G70': 'G70',
    'G80': 'G80',
    'G90': 'G90',
    'GV60': 'GV60',
    'GV70': 'GV70',
    'GV80': 'GV80',
  },
  'ג\'ילי': {
    'COOLRAY': 'Coolray',
    'TUGELLA': 'Tugella',
    'EMGRAND': 'Emgrand',
    'GEOMETRYC': 'Geometry C',
    'OKAVANGO': 'Okavango',
  },
  'צ\'רי': {
    'TIGGO2': 'Tiggo 2',
    'TIGGO3': 'Tiggo 3',
    'TIGGO4': 'Tiggo 4',
    'TIGGO7': 'Tiggo 7',
    'TIGGO8': 'Tiggo 8',
    'OMODA5': 'Omoda 5',
    'JAECOO7': 'Jaecoo 7',
  },
  'לינק וקו': {
    'LYNK01': '01',
    'LYNK02': '02',
    'LYNK03': '03',
    'LYNK05': '05',
    'LYNK09': '09',
  },
  'סמארט': {
    'FORTWO': 'Fortwo', 'C453': 'Fortwo', 'C451': 'Fortwo',
    'FORFOUR': 'Forfour', 'W453': 'Forfour',
    'SMART1': '#1', 'HX11': '#1',
    'SMART3': '#3',
  },
};

/**
 * Normalize the manufacturer name from MOT API format to commercial name.
 * "מזדה יפן" → "מזדה", "טויוטה טורקיה" → "טויוטה"
 */
export function normalizeManufacturer(rawManufacturer: string): string {
  if (!rawManufacturer) return rawManufacturer;

  const trimmed = rawManufacturer.trim();

  // Direct match
  if (MANUFACTURER_MAP[trimmed]) {
    return MANUFACTURER_MAP[trimmed];
  }

  // Case-insensitive match
  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(MANUFACTURER_MAP)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }

  // Fallback: if the name contains a known brand + extra words, extract the brand
  // This handles unmapped country suffixes like "מזדה צ'כיה" → "מזדה"
  const knownBrands = [
    'טויוטה', 'מזדה', 'מאזדה', 'הונדה', 'ניסאן', 'סוזוקי', 'יונדאי', 'קיה',
    'סקודה', 'פולקסווגן', 'פולקסוגן', 'אאודי', 'מרצדס', 'אופל', 'פורשה',
    'רנו', "פז'ו", 'סיטרואן', "דאצ'יה", 'פיאט', 'שברולט', 'פורד',
    "ג'יפ", 'טסלה', 'וולוו', 'סיאט', 'סובארו', 'מיצובישי', 'לקסוס',
    'ב.מ.וו', 'BMW', 'BYD', 'MG', "ג'ילי", "צ'רי",
    'מיני', 'אלפא רומאו', "ג'נסיס", 'אינפיניטי',
  ];

  for (const brand of knownBrands) {
    if (trimmed.startsWith(brand) && trimmed.length > brand.length) {
      // Make sure the extra chars are a space + country name, not part of the brand
      const rest = trimmed.slice(brand.length);
      if (rest.startsWith(' ')) {
        return brand === 'מאזדה' ? 'מזדה' : brand;
      }
    }
  }

  return trimmed;
}

/**
 * Normalize the model code from MOT API format to commercial name.
 * Extracts the prefix from long codes like "BN627" → prefix "BN" → "3" (for Mazda)
 * Also handles full code matches like "MZEA11L-DEXNBW" → prefix "MZEA" → "קורולה"
 */
export function normalizeModel(rawModel: string, manufacturer: string): string {
  if (!rawModel || !manufacturer) return rawModel;

  const trimmedModel = rawModel.trim();
  const normalizedMfr = normalizeManufacturer(manufacturer);
  const mfrModels = MODEL_MAP[normalizedMfr];

  if (!mfrModels) return trimmedModel;

  // 1. Exact match (full code)
  const upperModel = trimmedModel.toUpperCase();
  for (const [code, name] of Object.entries(mfrModels)) {
    if (code.toUpperCase() === upperModel) {
      return name;
    }
  }

  // 2. Strip trailing digits/dashes and try prefix matching
  //    "BN627" → try "BN627", "BN62", "BN6", "BN"
  //    "MZEA11L-DEXNBW" → try "MZEA11L-DEXNBW", "MZEA11L-DEXNB", ... "MZEA"
  const cleanModel = trimmedModel.replace(/[-_\s]/g, '').toUpperCase();
  for (let len = cleanModel.length; len >= 2; len--) {
    const prefix = cleanModel.slice(0, len);
    for (const [code, name] of Object.entries(mfrModels)) {
      if (code.toUpperCase() === prefix) {
        return name;
      }
    }
  }

  // 3. Check if model code starts with any known prefix
  for (const [code, name] of Object.entries(mfrModels)) {
    if (cleanModel.startsWith(code.toUpperCase())) {
      return name;
    }
  }

  return trimmedModel;
}

/**
 * Generate a user-friendly nickname from manufacturer and model.
 * "מזדה" + "3" → "מזדה 3"
 */
export function generateNickname(manufacturer: string, model: string): string {
  const mfr = normalizeManufacturer(manufacturer);
  const mdl = normalizeModel(model, manufacturer);
  return `${mfr} ${mdl}`.trim();
}

/**
 * Heuristic: did normalizeModel actually find a friendly name, or did the
 * raw MOT code pass through unchanged?
 *
 * We treat the result as a "raw code" when:
 *   - it still contains digits AND uppercase letters (e.g. "XTA03", "BN627")
 *   - it has no spaces (commercial names usually have spaces or are pure words)
 *
 * Used by the API layer to decide whether to fall back to a friendlier
 * display string like "מיצובישי 2019" instead of showing an ugly code.
 */
export function looksLikeMotCode(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Already-friendly Hebrew names — never a code
  if (/[א-ת]/.test(trimmed)) return false;
  const hasDigit = /\d/.test(trimmed);
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasSpace = /\s/.test(trimmed);
  // Codes like "XTA03", "BN627", "MZEA11L" — letters + digits, no spaces
  if (hasDigit && hasUpper && !hasSpace) return true;
  // Codes like "U625", "G20", "F56" — short alphanumeric without spaces
  if (hasDigit && hasUpper && trimmed.length <= 6 && !hasSpace) return true;
  return false;
}

/**
 * Build the best human-readable display name for a vehicle, with a
 * graceful fallback when the model can't be translated to a commercial
 * name. Used at the API layer.
 *
 * Examples:
 *   normalizeModel returned "ספייס סטאר"  → "ספייס סטאר" (use as-is)
 *   normalizeModel returned "XTA03"        → "" (don't show the code at all
 *                                                — the manufacturer + year +
 *                                                plate already identifies it)
 */
export function friendlyModel(rawModel: string | null | undefined, manufacturer: string | null | undefined): string {
  if (!rawModel) return '';
  if (!manufacturer) return rawModel;
  const normalized = normalizeModel(rawModel, manufacturer);
  // If the result still looks like a raw MOT code, hide it rather than
  // confuse the user with "XTA03". The other fields (mfr, year, plate)
  // are enough to identify the vehicle.
  if (looksLikeMotCode(normalized)) return '';
  return normalized;
}

/**
 * Apply all normalizations to a vehicle lookup result.
 * Call this on the raw MOT API response before sending to the client.
 */
export function normalizeVehicleNames(vehicle: {
  manufacturer: string;
  model: string;
  [key: string]: unknown;
}): {
  manufacturer: string;
  model: string;
  commercialName: string;
  rawManufacturer: string;
  rawModel: string;
  [key: string]: unknown;
} {
  const rawManufacturer = vehicle.manufacturer;
  const rawModel = vehicle.model;
  const manufacturer = normalizeManufacturer(rawManufacturer);
  const model = normalizeModel(rawModel, rawManufacturer);

  return {
    ...vehicle,
    manufacturer,
    model,
    commercialName: `${manufacturer} ${model}`.trim(),
    rawManufacturer,
    rawModel,
  };
}
