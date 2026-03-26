/**
 * Safely parse a JSON string, returning the original value if parsing fails.
 * Useful for fields stored as JSON strings in the database.
 */
export function safeJsonParse(value: string | null): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
