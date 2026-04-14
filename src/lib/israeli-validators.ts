/**
 * Israeli-specific validators: ח.פ (business number), ת.ז (ID), phone numbers.
 */

/**
 * Israeli ID / ח.פ checksum using the Israeli Luhn-like algorithm.
 * Accepts 9 digits (pads leading zeros up to 9).
 */
export function isValidIsraeliIdChecksum(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 5 || digits.length > 9) return false;
  const padded = digits.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(padded[i], 10);
    const multiplier = (i % 2) + 1; // 1,2,1,2,1,2,1,2,1
    let product = digit * multiplier;
    if (product > 9) product -= 9;
    sum += product;
  }
  return sum % 10 === 0;
}

/**
 * ח.פ is a 9-digit business number. Uses same checksum as ת.ז.
 */
export function isValidBusinessNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 9) return false;
  return isValidIsraeliIdChecksum(digits);
}

/**
 * Israeli phone format:
 *  - 10 digits starting with 05 (mobile) or
 *  - 02/03/04/08/09/07x landline (9-10 digits), with or without dashes.
 */
export function isValidIsraeliPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && /^05\d{8}$/.test(digits)) return true;
  if (digits.length === 9 && /^0[2-4,8-9]\d{7}$/.test(digits)) return true;
  if (digits.length === 10 && /^07\d{8}$/.test(digits)) return true;
  return false;
}
