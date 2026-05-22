/**
 * Israeli roadside assistance providers (שירותי דרך).
 *
 * These are the companies that show up as "שירותי דרך" on a Israeli
 * insurance policy (almost always on ביטוח מקיף). When the user gets
 * stuck on the road, they call THIS number — not the insurance company.
 *
 * Phone format: kept in human-readable form (with * shortcodes) plus a
 * canonical E.164 number for `tel:` links that work on every dialer.
 */

export interface RoadServiceProvider {
  /** Internal id — must stay stable, used for storage. */
  id: string;
  /** Hebrew display name */
  name: string;
  /** Star shortcode as Israelis know it */
  displayPhone: string;
  /** E.164 number for tel: links (without the * shortcode) */
  dialablePhone: string;
  /** Alternative spellings the AI might find on a policy */
  aliases: string[];
}

export const ROAD_SERVICES: ReadonlyArray<RoadServiceProvider> = [
  {
    id: 'shagrir',
    name: 'שגריר',
    displayPhone: '*8888',
    dialablePhone: '+97238888888',
    aliases: ['שגריר', 'Shagrir', 'שגריר שירותי דרך'],
  },
  {
    id: 'drachim',
    name: 'דרכים',
    displayPhone: '*3500',
    dialablePhone: '+97233500000',
    aliases: ['דרכים', 'Drachim', 'דרכים שירותי דרך'],
  },
  {
    id: 'memsi',
    name: 'ממסי (איגוד הנהיגה)',
    displayPhone: '*6286',
    dialablePhone: '+97236286286',
    aliases: ['ממסי', 'איגוד הנהיגה', 'Memsi', 'MEMSI', 'איגוד נהיגה'],
  },
  {
    id: 'sat',
    name: 'ש.א.ת',
    displayPhone: '*7100',
    dialablePhone: '+97237100000',
    aliases: ['ש.א.ת', 'שאת', 'SAT', 'S.A.T'],
  },
  {
    id: 'paz',
    name: 'פז שירות',
    displayPhone: '*3220',
    dialablePhone: '+97233220000',
    aliases: ['פז', 'פז שירות', 'Paz', 'PAZ'],
  },
  {
    id: 'tahbura',
    name: 'תחבורה',
    displayPhone: '*5060',
    dialablePhone: '+97235060000',
    aliases: ['תחבורה', 'Tahbura'],
  },
  {
    id: 'idi_derech',
    name: 'ביטוח ישיר דרך',
    displayPhone: '*3370',
    dialablePhone: '+97233370000',
    aliases: ['ביטוח ישיר', 'IDI דרך', 'ישיר דרך'],
  },
];

const BY_ID = new Map(ROAD_SERVICES.map((p) => [p.id, p]));

/** Lookup by internal id. */
export function getRoadServiceById(id: string | null | undefined): RoadServiceProvider | null {
  if (!id) return null;
  return BY_ID.get(id) || null;
}

/**
 * Fuzzy match — given free text (e.g. extracted by AI from a policy),
 * try to identify which roadside provider is referenced. Returns the
 * provider id on match, null otherwise.
 *
 * We match on aliases case-insensitively after normalizing whitespace
 * and trimming punctuation. The AI sometimes returns "שירות שגריר 8888"
 * or just "Shagrir" — both should map to `shagrir`.
 */
export function matchRoadServiceFromText(rawText: string | null | undefined): string | null {
  if (!rawText) return null;
  const normalized = rawText.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return null;
  for (const provider of ROAD_SERVICES) {
    for (const alias of provider.aliases) {
      if (normalized.includes(alias.toLowerCase())) return provider.id;
    }
  }
  return null;
}
