/**
 * Detect data conflicts between what's already saved on a vehicle
 * vs what an AI scan just extracted from a document.
 *
 * Two severity levels:
 *   - 'critical' → license plate mismatch. Block the auto-fill, force user
 *                  to explicitly choose which value wins.
 *   - 'soft'     → company / station name mismatch. Show an inline banner
 *                  above the field; default to keeping the existing value
 *                  unless the user clicks "replace".
 *
 * All functions return `null` when there's no conflict, so the caller can
 * `if (conflict)` cleanly.
 */

// ─────────────────────────────────────────────────────────────────────
// Normalization helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Israeli license plates can be written as 12-345-67, 1234567, 123-45-678,
 * 12345678, with or without dashes/spaces. We strip everything that isn't
 * a digit and compare on the canonical digits-only form.
 */
function normalizePlate(plate: string | null | undefined): string {
  if (!plate) return '';
  return plate.replace(/\D/g, '');
}

/**
 * Hebrew company names often have minor variants:
 *   "הראל" vs "הראל ביטוח" vs "הראל חברה לביטוח" vs "הראל ביטוח בע״מ"
 *   "כלל" vs "כלל ביטוח" vs "כלל חברה לביטוח"
 *
 * We normalize by lowercasing, stripping the common suffixes/punctuation,
 * then collapsing whitespace. The result is what we compare.
 */
function normalizeCompanyName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    // Strip common suffixes that don't carry meaning
    .replace(/\bביטוח\b/g, '')
    .replace(/\bחברה לביטוח\b/g, '')
    .replace(/\bבע״מ\b/g, '')
    .replace(/\bבע"מ\b/g, '')
    .replace(/\bבעמ\b/g, '')
    .replace(/\bלביטוח\b/g, '')
    .replace(/\binsurance\b/g, '')
    .replace(/\bco\.?\b/g, '')
    .replace(/\bltd\.?\b/g, '')
    // Strip punctuation
    .replace(/[.,'"״׳()]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────
// Conflict types
// ─────────────────────────────────────────────────────────────────────

export interface CriticalConflict {
  severity: 'critical';
  field: 'licensePlate';
  fieldLabelHe: string;
  existing: string;
  scanned: string;
}

export interface SoftConflict {
  severity: 'soft';
  field: 'insuranceCompany' | 'testStation' | 'garageName';
  fieldLabelHe: string;
  existing: string;
  scanned: string;
}

export type Conflict = CriticalConflict | SoftConflict;

// ─────────────────────────────────────────────────────────────────────
// Detection functions
// ─────────────────────────────────────────────────────────────────────

/**
 * Compare the license plate from a scanned document to the plate that's
 * already saved on the vehicle. Returns a critical conflict if they
 * disagree by even one digit.
 *
 * If either side is empty/missing, there's nothing to conflict with → null.
 */
export function detectPlateConflict(
  existingPlate: string | null | undefined,
  scannedPlate: string | null | undefined,
): CriticalConflict | null {
  const a = normalizePlate(existingPlate);
  const b = normalizePlate(scannedPlate);
  // Need both sides to have at least 5 digits before we trust the comparison.
  // Short fragments are noise (e.g. AI extracted just "123" from a logo).
  if (a.length < 5 || b.length < 5) return null;
  if (a === b) return null;
  return {
    severity: 'critical',
    field: 'licensePlate',
    fieldLabelHe: 'מספר רכב',
    existing: existingPlate || '',
    scanned: scannedPlate || '',
  };
}

/**
 * Compare a free-text string field (company name, station name) using
 * fuzzy normalization. Returns a soft conflict if they don't match after
 * stripping common suffixes and whitespace.
 *
 * Special case: if the existing value is empty, there's no conflict —
 * the user hasn't claimed a value yet, so the scan can freely fill in.
 */
export function detectStringConflict(
  field: SoftConflict['field'],
  fieldLabelHe: string,
  existing: string | null | undefined,
  scanned: string | null | undefined,
): SoftConflict | null {
  if (!scanned || !scanned.trim()) return null;
  if (!existing || !existing.trim()) return null; // empty existing → no conflict
  const a = normalizeCompanyName(existing);
  const b = normalizeCompanyName(scanned);
  if (!a || !b) return null;
  if (a === b) return null;
  // Also treat "one contains the other" as a match — "הראל" is a substring
  // of "הראל ביטוח חיים" so they're talking about the same insurer.
  if (a.includes(b) || b.includes(a)) return null;
  return {
    severity: 'soft',
    field,
    fieldLabelHe,
    existing,
    scanned,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Bulk helper — run all the relevant checks for a scanned insurance/test
// document and return whichever conflicts (if any) need to be surfaced.
// ─────────────────────────────────────────────────────────────────────

export interface ScanContext {
  existingPlate?: string | null;
  existingCompany?: string | null;
  existingStation?: string | null;
}

export interface ScannedData {
  licensePlate?: string | null;
  businessName?: string | null;
}

export function detectAllConflicts(
  existing: ScanContext,
  scanned: ScannedData,
  scanType: 'insurance' | 'test' | 'license',
): { critical: CriticalConflict | null; soft: SoftConflict | null } {
  const critical = detectPlateConflict(existing.existingPlate, scanned.licensePlate);

  let soft: SoftConflict | null = null;
  if (scanType === 'insurance' && existing.existingCompany) {
    soft = detectStringConflict(
      'insuranceCompany',
      'חברת ביטוח',
      existing.existingCompany,
      scanned.businessName,
    );
  } else if (scanType === 'test' && existing.existingStation) {
    soft = detectStringConflict(
      'testStation',
      'מכון רישוי',
      existing.existingStation,
      scanned.businessName,
    );
  }

  return { critical, soft };
}
