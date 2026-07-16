/**
 * import-car-washes.ts
 *
 * One-time import of car washes from OpenStreetMap (Overpass API, amenity=car_wash
 * within Israel) into the GarageDirectory table as category WASH.
 *
 * OSM data is ODbL — permanent storage is allowed; we display the required
 * "© OpenStreetMap contributors" credit in the UI.
 *
 * OSM rarely carries addr:city (~4%), but every element has coordinates, so we
 * derive the city via Nominatim reverse geocoding (Philip's decision) and then
 * normalize the result to the same 51 display cities used by the MOT import.
 *
 * - Idempotent: upserts by extId ("osm:<type>/<id>"). Re-running does not duplicate.
 * - Soft-delete scoped to source='openstreetmap' (never touches MOT rows).
 * - Reverse-geocode results are cached to scripts/.carwash-geocache.json so the
 *   dry-run and the real run don't hit Nominatim twice.
 *
 * Run:  npx tsx scripts/import-car-washes.ts --dry-run   # fetch + geocode + report, NO writes
 *       npx tsx scripts/import-car-washes.ts             # real import
 */

import prisma from '../src/lib/db';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const UA = 'autolog-carwash-import/1.0 (info@trademax.co.il)';
const GEOCACHE = join(__dirname, '.carwash-geocache.json');

const OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="IL"][admin_level=2]->.il;
(
  node["amenity"="car_wash"](area.il);
  way["amenity"="car_wash"](area.il);
  relation["amenity"="car_wash"](area.il);
);
out center tags;`;

// The 51 target display cities (identical to the MOT import's CITY_MAP keys).
const DISPLAY_CITIES = [
  'אילת', 'דימונה', 'ערד', 'באר שבע', 'אופקים', 'נתיבות', 'שדרות', 'קרית גת', 'קרית מלאכי', 'אשקלון',
  'אשדוד', 'יבנה', 'רחובות', 'נס ציונה', 'ראשון לציון', 'בת ים', 'חולון', 'תל אביב -יפו', 'רמת גן', 'גבעתיים',
  'בני ברק', 'פתח תקוה', 'ראש העין', 'לוד', 'רמלה', 'מודיעין', 'ירושלים', 'בית שמש', 'הרצליה', 'רמת השרון',
  'כפר סבא', 'רעננה', 'הוד השרון', 'נתניה', 'חדרה', 'אור עקיבא', 'חיפה', 'קרית אתא', 'קרית ביאליק', 'קרית מוצקין',
  'קרית ים', 'טירת כרמל', 'נשר', 'עכו', 'נהריה', 'כרמיאל', 'עפולה', 'נצרת', 'טבריה', 'צפת', 'קרית שמונה',
];

// Canonicalize a Hebrew city name so spelling variants collapse:
// strip quotes/periods, remove spaces/hyphens/maqaf, fold double yod/vav.
function canon(s: string): string {
  return (s || '')
    .replace(/["'.׳״]/g, '')
    .replace(/[\s\-־‐-―]/g, '') // spaces + ASCII hyphen + Hebrew maqaf + all Unicode dashes (en/em)
    .replace(/יי/g, 'י')
    .replace(/וו/g, 'ו')
    .trim();
}

const canonToDisplay: Record<string, string> = {};
for (const c of DISPLAY_CITIES) canonToDisplay[canon(c)] = c;

// Explicit aliases for names Nominatim returns differently (extended after dry-run).
const ALIASES: Record<string, string> = {
  [canon('מודיעין מכבים רעות')]: 'מודיעין',
  [canon('מודיעין-מכבים-רעות')]: 'מודיעין',
  [canon('תל אביב')]: 'תל אביב -יפו',
  [canon('תל אביב יפו')]: 'תל אביב -יפו',
};

function normalizeCity(nominatimCity: string | undefined): string | null {
  if (!nominatimCity) return null;
  const k = canon(nominatimCity);
  return ALIASES[k] || canonToDisplay[k] || null;
}

interface OverpassEl {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchOverpass(): Promise<OverpassEl[]> {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: 'data=' + encodeURIComponent(OVERPASS_QUERY),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = await res.json();
  return json.elements || [];
}

type GeoCache = Record<string, string | null>; // extId -> raw nominatim city (or null)
function loadCache(): GeoCache { try { return existsSync(GEOCACHE) ? JSON.parse(readFileSync(GEOCACHE, 'utf8')) : {}; } catch { return {}; } }
function saveCache(c: GeoCache) { try { writeFileSync(GEOCACHE, JSON.stringify(c, null, 0)); } catch { /* ignore */ } }

async function reverseCity(lat: number, lon: number): Promise<string | null> {
  const url = `${NOMINATIM}?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=he&zoom=12`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) { await sleep(1500); continue; }
      const j = await res.json();
      const a = j.address || {};
      return a.city || a.town || a.municipality || a.village || a.suburb || null;
    } catch {
      await sleep(1500);
    }
  }
  return null;
}

interface Wash {
  extId: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  lat: number;
  lng: number;
  named: boolean;
}

async function main() {
  console.log(`\n🫧 Car-wash import ${DRY_RUN ? '(DRY RUN — no DB writes)' : ''}`);
  console.log('Fetching from OpenStreetMap Overpass…');
  const els = await fetchOverpass();
  console.log(`  fetched ${els.length} car_wash elements`);

  const cache = loadCache();
  let geocoded = 0;
  const washes: Wash[] = [];
  const unmatchedCities = new Map<string, number>();
  let noCoord = 0;

  for (const e of els) {
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (lat == null || lon == null) { noCoord++; continue; }

    const extId = `osm:${e.type}/${e.id}`;
    const t = e.tags || {};

    // reverse geocode (cached)
    let rawCity: string | null;
    if (extId in cache) {
      rawCity = cache[extId];
    } else {
      rawCity = await reverseCity(lat, lon);
      cache[extId] = rawCity;
      geocoded++;
      if (geocoded % 20 === 0) { saveCache(cache); console.log(`  …geocoded ${geocoded} new`); }
      await sleep(1100); // Nominatim: max 1 req/sec
    }

    const city = normalizeCity(rawCity ?? undefined);
    if (!city) {
      const key = rawCity || '(no city)';
      unmatchedCities.set(key, (unmatchedCities.get(key) || 0) + 1);
      continue;
    }

    const nameTag = t.name || t['name:he'] || t['name:en'] || '';
    const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
    washes.push({
      extId,
      name: nameTag || 'שטיפת רכב',
      address: street || '',
      city,
      phone: t.phone || t['contact:phone'] || null,
      lat, lng: lon,
      named: !!nameTag,
    });
  }
  saveCache(cache);

  // report
  const perCity = new Map<string, number>();
  for (const w of washes) perCity.set(w.city, (perCity.get(w.city) || 0) + 1);
  const named = washes.filter((w) => w.named).length;
  const withPhone = washes.filter((w) => w.phone).length;

  console.log(`\n=== MAPPED TO ONE OF THE 51 CITIES: ${washes.length} / ${els.length} ===`);
  console.log(`  named: ${named} · generic "שטיפת רכב": ${washes.length - named} · with phone: ${withPhone} · no coords: ${noCoord}`);
  console.log('\n=== per city ===');
  for (const [c, n] of [...perCity.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${c}`);
  console.log('\n=== NOT mapped (Nominatim city → count) — outside the 51 or unresolved ===');
  for (const [c, n] of [...unmatchedCities.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${c}`);

  if (DRY_RUN) {
    console.log('\n(dry run — nothing written)');
    await prisma.$disconnect();
    return;
  }

  // real upsert
  const professions = [{ cod: 'car_wash', name: 'שטיפת רכב' }];
  const importedExtIds: string[] = [];
  for (const w of washes) {
    const data = {
      name: w.name,
      type: 'שטיפת רכב',
      address: w.address,
      city: w.city,
      phone: w.phone,
      lat: w.lat,
      lng: w.lng,
      categories: ['WASH'],
      professions,
      active: true,
      source: 'openstreetmap',
    };
    await prisma.garageDirectory.upsert({
      where: { extId: w.extId },
      create: { extId: w.extId, ...data },
      update: data,
    });
    importedExtIds.push(w.extId);
  }

  // soft-delete OSM rows that vanished from the source
  const softDeleted = await prisma.garageDirectory.updateMany({
    where: { active: true, source: 'openstreetmap', extId: { notIn: importedExtIds } },
    data: { active: false },
  });

  console.log(`\n✅ upserted ${importedExtIds.length} car washes; soft-deleted ${softDeleted.count} stale rows.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error('CAR-WASH IMPORT FAILED:', e); process.exit(1); });
