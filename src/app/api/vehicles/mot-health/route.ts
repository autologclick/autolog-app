import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getMotConfig, saveMotConfig } from '@/lib/mot-config';
import { createRequestLogger } from '@/lib/logger';

// Known search terms to validate the API is returning vehicle data
const TEST_FIELDS = ['mispar_rechev', 'tozeret_nm', 'degem_nm', 'shnat_yitzur'];

// Known package/dataset IDs on data.gov.il for vehicle data
const VEHICLE_DATASET_SEARCH_TERMS = [
  'רכב פרטי',
  'רישוי רכב',
  'כלי רכב',
];

/**
 * GET /api/vehicles/mot-health
 *
 * Checks if the Ministry of Transport API is working correctly.
 * If the current resource ID is broken, it searches for the correct one
 * and auto-updates the config.
 */
export async function GET(req: NextRequest) {
  const logger = createRequestLogger('api', req);
  const config = getMotConfig();
  const results: any = {
    timestamp: new Date().toISOString(),
    currentResourceId: config.resourceId,
    apiUrl: config.apiUrl,
    checks: [],
  };

  logger.info('MOT health check started', { currentResourceId: config.resourceId });

  // Step 1: Test current resource ID
  const currentWorking = await testResourceId(config.apiUrl, config.resourceId);
  results.checks.push({
    step: 'test_current_resource',
    resourceId: config.resourceId,
    ...currentWorking,
  });

  if (currentWorking.success) {
    // Current resource is working fine
    logger.info('MOT API health check passed', {
      resourceId: config.resourceId,
      recordCount: currentWorking.recordCount,
    });
    saveMotConfig({
      lastCheck: new Date().toISOString(),
      lastCheckStatus: 'ok',
      lastCheckMessage: `API תקין. ${currentWorking.recordCount} רשומות זמינות. שדות: ${currentWorking.fields?.join(', ')}`,
    });
    results.status = 'ok';
    results.message = 'API משרד התחבורה תקין ופעיל';
    return jsonResponse(results);
  }

  // Step 2: Current resource failed - try alternatives
  logger.warn('MOT API health check failed, trying alternatives', {
    failedResourceId: config.resourceId,
  });
  results.checks.push({ step: 'current_failed', message: 'Resource ID הנוכחי לא עובד, מחפש חלופי...' });

  for (const altId of config.alternativeResourceIds) {
    if (altId === config.resourceId) continue; // Skip the one we already tried

    const altResult = await testResourceId(config.apiUrl, altId);
    results.checks.push({
      step: 'test_alternative',
      resourceId: altId,
      ...altResult,
    });

    if (altResult.success) {
      // Found a working alternative - update config
      logger.info('MOT API alternative resource found and updated', {
        oldResourceId: config.resourceId,
        newResourceId: altId,
        recordCount: altResult.recordCount,
      });
      saveMotConfig({
        resourceId: altId,
        lastCheck: new Date().toISOString(),
        lastCheckStatus: 'ok',
        lastCheckMessage: `עודכן Resource ID ל-${altId}. ${altResult.recordCount} רשומות.`,
      });
      results.status = 'updated';
      results.message = `Resource ID עודכן בהצלחה ל-${altId}`;
      results.newResourceId = altId;
      return jsonResponse(results);
    }
  }

  // Step 3: No alternatives work - search for new resource via CKAN package search
  results.checks.push({ step: 'searching_new', message: 'מחפש Resource ID חדש ב-data.gov.il...' });

  const newResourceId = await searchForVehicleResource(config.apiUrl);
  if (newResourceId) {
    const newResult = await testResourceId(config.apiUrl, newResourceId);
    results.checks.push({
      step: 'test_discovered',
      resourceId: newResourceId,
      ...newResult,
    });

    if (newResult.success) {
      saveMotConfig({
        resourceId: newResourceId,
        lastCheck: new Date().toISOString(),
        lastCheckStatus: 'ok',
        lastCheckMessage: `Resource ID חדש נמצא ועודכן: ${newResourceId}`,
        alternativeResourceIds: [...Array.from(new Set([...config.alternativeResourceIds, newResourceId]))],
      });
      results.status = 'discovered';
      results.message = `Resource ID חדש נמצא ועודכן: ${newResourceId}`;
      results.newResourceId = newResourceId;
      return jsonResponse(results);
    }
  }

  // Step 4: Nothing works
  saveMotConfig({
    lastCheck: new Date().toISOString(),
    lastCheckStatus: 'error',
    lastCheckMessage: 'לא נמצא Resource ID תקין. נדרשת בדיקה ידנית.',
  });
  results.status = 'error';
  results.message = 'API משרד התחבורה לא זמין. נדרשת בדיקה ידנית.';
  return jsonResponse(results, 503);
}

/**
 * Test if a resource ID returns valid vehicle data
 */
async function testResourceId(apiUrl: string, resourceId: string) {
  try {
    const url = `${apiUrl}?resource_id=${resourceId}&limit=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}`, recordCount: 0 };
    }

    const data = await res.json();

    if (!data.success) {
      return { success: false, error: 'API returned success=false', recordCount: 0 };
    }

    const records = data.result?.records || [];
    const fields = data.result?.fields?.map((f: any) => f.id) || [];
    const total = data.result?.total || 0;

    // Check that the expected fields are present
    const hasRequiredFields = TEST_FIELDS.every(f => fields.includes(f));

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
      const hasPlate = record.mispar_rechev !== undefined;
      const hasManufacturer = record.tozeret_nm !== undefined;
      if (!hasPlate || !hasManufacturer) {
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
      samplePlate: records[0]?.mispar_rechev || null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.name === 'TimeoutError' ? 'Timeout' : err?.message || 'Unknown error',
      recordCount: 0,
    };
  }
}

/**
 * Search data.gov.il for the vehicle dataset resource ID
 */
async function searchForVehicleResource(apiUrl: string): Promise<string | null> {
  const logger = createRequestLogger('api');

  try {
    // Use CKAN package_search to find vehicle-related datasets
    const searchUrl = apiUrl.replace('/datastore_search', '/../package_search');
    const baseUrl = 'https://data.gov.il/api/3/action/package_search';

    for (const term of VEHICLE_DATASET_SEARCH_TERMS) {
      try {
        const res = await fetch(`${baseUrl}?q=${encodeURIComponent(term)}&rows=10`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) continue;
        const data = await res.json();

        if (!data.success || !data.result?.results) continue;

        // Look through results for a resource with vehicle data
        for (const pkg of data.result.results) {
          if (!pkg.resources) continue;
          for (const resource of pkg.resources) {
            if (resource.format === 'CSV' || resource.datastore_active) {
              // Test this resource to see if it has vehicle data
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
