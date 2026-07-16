/**
 * fix-google-cities.ts
 *
 * The discovery script assigned each Google car wash the city it was SEARCHED
 * under, but Text Search bleeds across city borders (e.g. "אוטו רונן" surfaced
 * under the Holon query though it sits in Rishon LeZion). This pass corrects the
 * city from the ACTUAL coordinates via Nominatim reverse geocoding, normalizes
 * to the 51 display cities, and deactivates anything that resolves OUTSIDE them.
 *
 * Only touches source='google'. Cached to scripts/.gplaces-geocache.json.
 */

import prisma from '../src/lib/db';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const UA = 'autolog-carwash-import/1.0 (info@trademax.co.il)';
const GEOCACHE = join(__dirname, '.gplaces-geocache.json');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DISPLAY_CITIES = [
  'אילת', 'דימונה', 'ערד', 'באר שבע', 'אופקים', 'נתיבות', 'שדרות', 'קרית גת', 'קרית מלאכי', 'אשקלון',
  'אשדוד', 'יבנה', 'רחובות', 'נס ציונה', 'ראשון לציון', 'בת ים', 'חולון', 'תל אביב -יפו', 'רמת גן', 'גבעתיים',
  'בני ברק', 'פתח תקוה', 'ראש העין', 'לוד', 'רמלה', 'מודיעין', 'ירושלים', 'בית שמש', 'הרצליה', 'רמת השרון',
  'כפר סבא', 'רעננה', 'הוד השרון', 'נתניה', 'חדרה', 'אור עקיבא', 'חיפה', 'קרית אתא', 'קרית ביאליק', 'קרית מוצקין',
  'קרית ים', 'טירת כרמל', 'נשר', 'עכו', 'נהריה', 'כרמיאל', 'עפולה', 'נצרת', 'טבריה', 'צפת', 'קרית שמונה',
];
function canon(s: string): string {
  return (s || '').replace(/["'.׳״]/g, '').replace(/[\s\-־‐-―]/g, '').replace(/יי/g, 'י').replace(/וו/g, 'ו').trim();
}
const canonToDisplay: Record<string, string> = {};
for (const c of DISPLAY_CITIES) canonToDisplay[canon(c)] = c;
const ALIASES: Record<string, string> = {
  [canon('מודיעין מכבים רעות')]: 'מודיעין', [canon('מודיעין-מכבים-רעות')]: 'מודיעין',
  [canon('תל אביב')]: 'תל אביב -יפו', [canon('תל אביב יפו')]: 'תל אביב -יפו',
};
function normalizeCity(c: string | undefined): string | null {
  if (!c) return null;
  const k = canon(c);
  return ALIASES[k] || canonToDisplay[k] || null;
}

type Cache = Record<string, string | null>;
const loadCache = (): Cache => { try { return existsSync(GEOCACHE) ? JSON.parse(readFileSync(GEOCACHE, 'utf8')) : {}; } catch { return {}; } };
const saveCache = (c: Cache) => { try { writeFileSync(GEOCACHE, JSON.stringify(c)); } catch { /* ignore */ } };

async function reverseCity(lat: number, lon: number): Promise<string | null> {
  const url = `${NOMINATIM}?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=he&zoom=12`;
  for (let a = 0; a < 2; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) { await sleep(1500); continue; }
      const j = await res.json();
      const ad = j.address || {};
      return ad.city || ad.town || ad.municipality || ad.village || ad.suburb || null;
    } catch { await sleep(1500); }
  }
  return null;
}

async function main() {
  const rows = await prisma.garageDirectory.findMany({
    where: { source: 'google', lat: { not: null }, lng: { not: null } },
    select: { id: true, city: true, lat: true, lng: true },
    orderBy: { id: 'asc' },
  });
  console.log(`\n📍 Reverse-geocoding ${rows.length} Google car washes to correct cities…\n`);

  const cache = loadCache();
  let reassigned = 0, deactivated = 0, kept = 0, newCalls = 0;

  for (const r of rows) {
    const key = `${r.id}`;
    let raw: string | null;
    if (key in cache) raw = cache[key];
    else {
      raw = await reverseCity(r.lat as number, r.lng as number);
      cache[key] = raw; newCalls++;
      if (newCalls % 25 === 0) { saveCache(cache); console.log(`  …geocoded ${newCalls} new`); }
      await sleep(1100);
    }
    const city = normalizeCity(raw ?? undefined);
    if (!city) {
      await prisma.garageDirectory.update({ where: { id: r.id }, data: { active: false } });
      deactivated++;
    } else if (city !== r.city) {
      await prisma.garageDirectory.update({ where: { id: r.id }, data: { city, active: true } });
      reassigned++; kept++;
    } else {
      kept++;
    }
  }
  saveCache(cache);

  console.log(`\n=== SUMMARY ===`);
  console.log(`  processed   : ${rows.length}`);
  console.log(`  kept (in 51): ${kept}  (reassigned city: ${reassigned})`);
  console.log(`  deactivated (outside 51 cities): ${deactivated}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error('FIX FAILED:', e); process.exit(1); });
