import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api-helpers';
import { getMotConfig, saveMotConfig } from '@/lib/mot-config';
import { createRequestLogger } from '@/lib/logger';
import {
  HealthCheckResult,
  HealthCheckStep,
  testResourceId,
  searchForVehicleResource,
} from '@/lib/services/mot-health-service';

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
  const checks: HealthCheckStep[] = [];

  logger.info('MOT health check started', { currentResourceId: config.resourceId });

  // Step 1: Test current resource ID
  const currentResult = await testResourceId(config.apiUrl, config.resourceId);
  checks.push({ step: 'test_current_resource', resourceId: config.resourceId, ...currentResult });

  if (currentResult.success) {
    logger.info('MOT API health check passed', {
      resourceId: config.resourceId,
      recordCount: currentResult.recordCount,
    });
    saveMotConfig({
      lastCheck: new Date().toISOString(),
      lastCheckStatus: 'ok',
      lastCheckMessage: `API תקין. ${currentResult.recordCount} רשומות זמינות. שדות: ${currentResult.fields?.join(', ')}`,
    });

    return jsonResponse(buildResult(config, checks, 'ok', 'API משרד התחבורה תקין ופעיל'));
  }

  // Step 2: Current resource failed — try alternatives
  logger.warn('MOT API health check failed, trying alternatives', {
    failedResourceId: config.resourceId,
  });
  checks.push({ step: 'current_failed', message: 'Resource ID הנוכחי לא עובד, מחפש חלופי...' });

  for (const altId of config.alternativeResourceIds) {
    if (altId === config.resourceId) continue;

    const altResult = await testResourceId(config.apiUrl, altId);
    checks.push({ step: 'test_alternative', resourceId: altId, ...altResult });

    if (altResult.success) {
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

      return jsonResponse(
        buildResult(config, checks, 'updated', `Resource ID עודכן בהצלחה ל-${altId}`, altId),
      );
    }
  }

  // Step 3: No alternatives work — search for new resource via CKAN
  checks.push({ step: 'searching_new', message: 'מחפש Resource ID חדש ב-data.gov.il...' });

  const newResourceId = await searchForVehicleResource(config.apiUrl);
  if (newResourceId) {
    const newResult = await testResourceId(config.apiUrl, newResourceId);
    checks.push({ step: 'test_discovered', resourceId: newResourceId, ...newResult });

    if (newResult.success) {
      saveMotConfig({
        resourceId: newResourceId,
        lastCheck: new Date().toISOString(),
        lastCheckStatus: 'ok',
        lastCheckMessage: `Resource ID חדש נמצא ועודכן: ${newResourceId}`,
        alternativeResourceIds: [...new Set([...config.alternativeResourceIds, newResourceId])],
      });

      return jsonResponse(
        buildResult(config, checks, 'discovered', `Resource ID חדש נמצא ועודכן: ${newResourceId}`, newResourceId),
      );
    }
  }

  // Step 4: Nothing works
  saveMotConfig({
    lastCheck: new Date().toISOString(),
    lastCheckStatus: 'error',
    lastCheckMessage: 'לא נמצא Resource ID תקין. נדרשת בדיקה ידנית.',
  });

  return jsonResponse(
    buildResult(config, checks, 'error', 'API משרד התחבורה לא זמין. נדרשת בדיקה ידנית.'),
    503,
  );
}

// =============================================
// Helper
// =============================================

function buildResult(
  config: { resourceId: string; apiUrl: string },
  checks: HealthCheckStep[],
  status: HealthCheckResult['status'],
  message: string,
  newResourceId?: string,
): HealthCheckResult {
  return {
    timestamp: new Date().toISOString(),
    currentResourceId: config.resourceId,
    apiUrl: config.apiUrl,
    status,
    message,
    checks,
    ...(newResourceId ? { newResourceId } : {}),
  };
}
