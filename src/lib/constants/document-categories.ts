/**
 * Document classification for the documents UI.
 *
 * Documents in AutoLog fall into two distinct categories that should be
 * treated very differently in the UI:
 *
 *   VALIDITY  — documents with a legal "valid until" date. Driving with an
 *               expired vehicle license / insurance / test is a real problem.
 *               These SHOULD display a green/amber/red status indicator,
 *               and SHOULD trigger reminders before expiry.
 *               Examples: vehicle_license, insurance_*, test_certificate.
 *
 *   ARCHIVAL  — historical records that don't have an expiry concept.
 *               A 2-year-old receipt is still a perfectly valid receipt.
 *               These should display only a neutral date, with NO red "❌"
 *               or alarm coloring, and should NEVER trigger expiry alerts.
 *               Examples: receipt, invoice, photo, service_record.
 *
 * Document.type is a free-form string (not a DB enum) for flexibility,
 * so this helper is the single source of truth for the classification.
 * When adding a new document type to the AI scanner or upload form,
 * register it here so the UI handles it correctly.
 */

export type DocumentTypeKind = 'validity' | 'archival';

/** Types that have a meaningful legal expiry — show status, send reminders. */
const VALIDITY_TYPES = new Set<string>([
  'vehicle_license',
  'driving_license',
  'license',            // legacy alias
  'registration',       // legacy alias
  'insurance',
  'insurance_compulsory',
  'insurance_comprehensive',
  'insurance_third_party',
  'test_certificate',
  'warranty',
]);

/**
 * Returns true for documents that have no real "expiry" — receipts, invoices,
 * service records, photos, etc. The UI must NOT show "expired/valid" status
 * for these and must NOT send reminder notifications.
 *
 * For unknown / blank types we default to ARCHIVAL — this is the safer side
 * of the trade-off: a misclassified validity doc just loses its color badge
 * (recoverable, low harm), but a misclassified archival doc would generate
 * false "expired" alarms that erode trust in real alerts.
 */
export function isArchivalDocument(type: string | null | undefined): boolean {
  if (!type) return true;
  const normalized = type.toLowerCase().trim();
  return !VALIDITY_TYPES.has(normalized);
}

/** Convenience inverse: true when the type has a legal validity period. */
export function isValidityDocument(type: string | null | undefined): boolean {
  return !isArchivalDocument(type);
}

/** Returns the category as a string for analytics / conditional logic. */
export function documentKind(type: string | null | undefined): DocumentTypeKind {
  return isArchivalDocument(type) ? 'archival' : 'validity';
}
