import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getResourceId, getApiUrl } from '@/lib/mot-config';
import { createRequestLogger } from '@/lib/logger';

// Israel Ministry of Transport - Vehicle data lookup via data.gov.il CKAN API
// Resource ID and API URL are managed in mot-config.ts and can be updated dynamically

// Field mapping from Hebrew API to our app
interface GovVehicleData {
  mispar_rechev: number;        // מספר רכב - License plate
  tozeret_cd: number;           // קוד תוצר - Manufacturer code
  sug_degem: string;            // סוג דגם - Model type
  tozeret_nm: string;           // שם תוצר - Manufacturer name
  degem_cd: number;             // קוד דגם - Model code
  degem_nm: string;             // שם דגם - Model name
  ramat_gimur: string;          // רמת גימור - Trim level
  ramat_eivzur_betihuty: number;// רמת אבזור בטיחותי - Safety equipment level
  kvutzat_zihum: number;        // קבוצת זיהום - Pollution group
  shnat_yitzur: number;         // שנת ייצור - Year of manufacture
  degem_manoa: string;          // דגם מנוע - Engine model
  mivchan_acharon_dt: string;   // תאריך מבחן אחרון - Last test date
  tokef_dt: string;             // תוקף - Validity date (test expiry)
  baalut: string;               // בעלות - Ownership type
  misgeret: string;             // מספר מסגרת - VIN/Frame number
  tzeva_cd: number;             // קוד צבע - Color code
  tzeva_rechev: string;         // צבע רכב - Vehicle color
  zmig_kidmi: string;           // צמיג קדמי - Front tire
  zmig_ahori: string;           // צמיג אחורי - Rear tire
  sug_delek_nm: string;         // סוג דלק - Fuel type
  horaat_reshum: number;        // הוראת רישום - Registration instruction
  moed_aliya_lakvish: string;   // מועד עלייה לכביש - First registration date
  kinpiof_cd: string;           // קוד כינוף - Body type code
}

export async function GET(req: NextRequest) {
  const logger = createRequestLogger('api', req);

  try {
    const url = new URL(req.url);
    const plateNumber = url.searchParams.get('plate');

    if (!plateNumber) {
      logger.warn('Vehicle lookup: missing plate number');
      return errorResponse('נא להזין מספר רישוי');
    }

    // Clean the plate number - remove dashes, spaces
    const cleanPlate = plateNumber.replace(/[-\s]/g, '');
    logger.debug('Vehicle lookup initiated', { plateNumber: cleanPlate });

    // Query data.gov.il CKAN API (resource ID loaded from config)
    const apiUrl = `${getApiUrl()}?resource_id=${getResourceId()}&q=${cleanPlate}&limit=5`;

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      logger.error('Gov API error', {
        status: response.status,
        plateNumber: cleanPlate,
      });
      return errorResponse('שגיאה בשליפת נתונים ממשרד התחבורה', 502);
    }

    const data = await response.json();

    if (!data.success || !data.result?.records?.length) {
      logger.warn('Vehicle not found', { plateNumber: cleanPlate });
      return errorResponse('רכב לא נמצא במאגר משרד התחבורה', 404);
    }

    // Find exact match by plate number
    const record = data.result.records.find(
      (r: GovVehicleData) => String(r.mispar_rechev) === cleanPlate
    ) || data.result.records[0];

    // Map to our format
    const vehicleInfo = {
      licensePlate: String(record.mispar_rechev),
      manufacturer: record.tozeret_nm || '',
      model: record.degem_nm || '',
      year: record.shnat_yitzur || null,
      color: record.tzeva_rechev || '',
      fuelType: record.sug_delek_nm || '',
      vin: record.misgeret || '',
      engineModel: record.degem_manoa || '',
      trimLevel: record.ramat_gimur || '',
      ownership: record.baalut || '',
      lastTestDate: record.mivchan_acharon_dt || null,
      testExpiryDate: record.tokef_dt || null,
      firstRegistrationDate: record.moed_aliya_lakvish || null,
      frontTire: record.zmig_kidmi || '',
      rearTire: record.zmig_ahori || '',
      pollutionGroup: record.kvutzat_zihum || null,
      safetyLevel: record.ramat_eivzur_betihuty || null,
      source: 'data.gov.il - משרד התחבורה',
    };

    logger.info('Vehicle lookup successful', {
      plateNumber: cleanPlate,
      manufacturer: record.tozeret_nm,
      model: record.degem_nm,
    });

    return jsonResponse({ vehicle: vehicleInfo });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      logger.warn('Vehicle API timeout', {
        error: error.name,
      });
      return errorResponse('שרת משרד התחבורה לא מגיב, נסה שוב', 504);
    }
    logger.error('Vehicle lookup error', {
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse('שגיאה בחיפוש רכב', 500);
  }
}
