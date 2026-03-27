/**
 * MOT Health Service - Tests Ministry of Transport API connectivity
 * and discovers working resource IDs for vehicle data.
 */

import { createRequestLogger } from '@/lib/logger';

// =============================================
// Constants
// =============================================

/** Required fields that indicate valid vehicle data */
const REQUIRED_VEHICLE_FIELDS = ['mispar_rechev', 'tozeret_nm', 'degem_nm', 'shnat_yitzur'];

/** Search terms used to find vehicle datasets on data.gov.il */
const VEHICLE_DATASET_SEARCH_TERMS = [
  'רכב פרטי',
  'רישוי רכב',
  'כלי רכב',
];

// =============================================
// Types
// =============================================

export type HealthStatus = 'ok' | 'updated' | 'discovered' | 'error';

export interface ResourceTestResult {
  success: boolean;
  error?: string;
  fields?: string[];
  recordCount: number;
  samplePlate?: string | null;
}

export interface HealthCheckStep {
  step: string;
  resourceId?: string;
  message?: string;
  success?: boolean;
  error?: string;
  fields?: string[];
  recordCount?: number;
  samplePlate?: string | null;
}

export interface HealthCheckResult {
  timestamp: string;
  currentResourceId: string;
  apiUrl: string;
  status: HealthStatus;
  message: string;
  newResourceId?: string;
  checks: HealthCheckStep[];
}

// =============================================
// Resource testing
// =============================================

interface CkanField {
  id: string;
  type?: string;
}

interface CkanRecord {
  mispar_rechev?: string;
  tozeret_nm?: string;
  [key: string]: unknown;
}

interface CkanDatastoreResponse {
  success: boolean;
  result?: {
    records?: CkanRecord[];
    fields?: CkanField[];
    total?: number;
  };
}

interface CkanPackageResource {
  id: string;
  format?: string;
  datastore_active?: boolean;
}

interface CkanPackageResult {
  resources?: CkanPackageResource[];
}

interface CkanPackageSearchResponse {
  success: boolean;
  result?: {
    results?: CkanPackageResult[];
  };
}

/**
 * Test if a resource ID returns valid vehicle data from the MOT API.
 */
export async function testResourceId(
  apiUrl: string,
  resourceId: string,
): Promise<ResourceTestResult> {
  try {
    const url = `${apiUrl}?resource_id=${resourceId}&limit=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}`, recordCount: 0 };
    }

    const data: CkanDatastoreResponse = await res.json();

    if (!data.success) {
      return { success: false, error: 'API returned success=false', recordCount: 0 };
    }

    const records = data.result?.records ?? [];
    const fields = data.result?.fields?.map((f) => f.id) ?? [];
    const total = data.result?.total ?? 0;

    // Check that the expected fields are present
    const hasRequiredFields = REQUIRED_VEHICLE_FIELDS.every((f) => fields.includes(f));
    if (!hasRequiredFields) {
      return {
        success: false,
        error: `חסרים שדות נדרשים. שדות שנמצאו: ${fields.join(', ')}`,
        fields,
        recordCount: total,
      };
    }

    // Validate that we get actual vehicle data
    if (records.length > 0) {
      const record = records[0];
      if (record.mispar_rechev === undefined || record.tozeret_nm === undefined) {
        return {
          success: false,
          error: 'הנתונים לא מכילים מספר רכב או יצרן',
          fields,
          recordCount: total,
        };
      }
    }

    return {
      success: true,
      fields,
      recordCount: total,
      samplePlate: records[0]?.mispar_rechev ?? null,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      error: isTimeout ? 'Timeout' : message,
      recordCount: 0,
    };
  }
}

// =============================================
// Resource discovery
// =============================================

/**
 * Search data.gov.il CKAN API for vehicle dataset resource IDs.
 */
export async function searchForVehicleResource(apiUrl: string): Promise<string | null> {
  const logger = createRequestLogger('api');
  const baseUrl = 'https://data.gov.il/api/3/action/package_search';

  try {
    for (const term of VEHICLE_DATASET_SEARCH_TERMS) {
      try {
        const res = await fetch(`${baseUrl}?q=${encodeURIComponent(term)}&rows=10`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) continue;
        const data: CkanPackageSearchResponse = await res.json();
        if (!data.success || !data.result?.results) continue;

        for (const pkg of data.result.results) {
          if (!pkg.resources) continue;
          for (const resource of pkg.resources) {
            if (resource.format === 'CSV' || resource.datastore_active) {
              const test = await testResourceId(apiUrl, resource.id);
              if (test.success) {
                logger.info('New vehicle resource found', {
                  resourceId: resource.id,
                  searchTerm: term,
                });
                return resource.id;
              }
            }
          }
        }
      } catch (e) {
        logger.debug('Error searching with term', {
          searchTerm: term,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
        continue;
      }
    }
  } catch (err) {
    logger.error('Error searching for vehicle resource', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    });
  }

  return null;
}
