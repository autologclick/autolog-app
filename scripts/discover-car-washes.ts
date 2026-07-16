/**
 * discover-car-washes.ts
 *
 * Discover car washes via Google Places Text Search (type=car_wash) across every
 * city already in our directory, and merge them with the existing OSM car washes
 * WITHOUT duplicates (dedupe by place_id, then by coordinate proximity).
 *
 * We persist PERMANENTLY only place_id + coordinates (+ city, category). The real
 * name / phone / photo are pulled later by the existing refresh mechanism
 * (enrich-garage-photos.ts → fetchCarWashDetails by place_id) within Google's
 * photo-caching limits.
 *
 * Runs only when GOOGLE_PLACES_API_KEY is set.
 *
 * Usage:
 *   npx tsx scripts/discover-car-washes.ts --dry-run            # all cities, no writes
 *   npx tsx scripts/discover-car-washes.ts --dry-run --city "ראשון לציון"
 *   npx tsx scripts/discover-car-washes.ts                      # real: insert new rows
 */

import prisma from '../src/lib/db';
import { isPlacesConfigured, searchCarWashesInCity } from '../src/lib/integrations/google-places';

const DRY_RUN = process.argv.includes('--dry-run');
const cityArgIdx = process.argv.indexOf('--city');
const ONE_CITY = cityArgIdx >= 0 ? process.argv[cityArgIdx + 1] : null;
const MAX_PAGES = 3;
const DEDUPE_METERS = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// haversine distance in meters
function distM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function main() {
  if (!isPlacesConfigured()) {
    console.error('❌ GOOGLE_PLACES_API_KEY not set — aborting.');
    process.exit(1);
  }

  // cities to scan = distinct active cities we already serve
  let cities: string[];
  if (ONE_CITY) {
    cities = [ONE_CITY];
  } else {
    const rows = await prisma.garageDirectory.findMany({
      where: { active: true }, select: { city: true }, distinct: ['city'], orderBy: { city: 'asc' },
    });
    cities = rows.map((r) => r.city);
  }

  // existing WASH rows for dedupe (all sources)
  const existing = await prisma.garageDirectory.findMany({
    where: { categories: { has: 'WASH' } },
    select: { placeId: true, lat: true, lng: true },
  });
  const existingPlaceIds = new Set(existing.map((e) => e.placeId).filter(Boolean) as string[]);
  const existingCoords = existing.filter((e) => e.lat != null && e.lng != null).map((e) => ({ lat: e.lat as number, lng: e.lng as number }));

  console.log(`\n🔎 Discovering car washes across ${cities.length} cities ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log(`   existing WASH rows: ${existing.length} (with place_id: ${existingPlaceIds.size})\n`);

  let apiCalls = 0;
  const newWashes: { placeId: string; lat: number; lng: number; city: string; name: string | null }[] = [];
  const seenPlaceIds = new Set<string>(existingPlaceIds);
  const perCity: { city: string; found: number; added: number }[] = [];

  for (const city of cities) {
    let found = 0, added = 0;
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const { results, nextPageToken } = await searchCarWashesInCity(city, pageToken);
      apiCalls++;
      for (const r of results) {
        found++;
        if (seenPlaceIds.has(r.placeId)) continue; // dup by place_id
        const near = existingCoords.some((c) => distM(r.lat, r.lng, c.lat, c.lng) < DEDUPE_METERS)
          || newWashes.some((n) => distM(r.lat, r.lng, n.lat, n.lng) < DEDUPE_METERS);
        if (near) { seenPlaceIds.add(r.placeId); continue; } // dup by proximity
        seenPlaceIds.add(r.placeId);
        newWashes.push({ placeId: r.placeId, lat: r.lat, lng: r.lng, city, name: r.name });
        added++;
      }
      if (!nextPageToken) break;
      pageToken = nextPageToken;
      await sleep(1500); // page tokens need a moment to become valid
    }
    perCity.push({ city, found, added });
    if (found) console.log(`  ${String(added).padStart(3)}+ / ${String(found).padStart(3)}  ${city}`);
    await sleep(120);
  }

  console.log(`\n=== DISCOVERY SUMMARY ===`);
  console.log(`  Text Search API calls : ${apiCalls}`);
  console.log(`  new car washes (post-dedupe) : ${newWashes.length}`);
  const rishonNew = newWashes.filter((w) => w.city === 'ראשון לציון');
  console.log(`  new in ראשון לציון : ${rishonNew.length}`);
  const ronen = newWashes.find((w) => (w.name || '').includes('אוטו רונן') || (w.name || '').toLowerCase().includes('ronen'));
  console.log(`  test case "אוטו רונן" discovered: ${ronen ? 'YES → ' + ronen.name + ' (' + ronen.city + ')' : 'not in NEW list (may already exist)'}`);

  if (DRY_RUN) {
    console.log('\n(dry run — nothing written)');
    await prisma.$disconnect();
    return;
  }

  // real: insert new rows — only place_id + coords persisted; name/phone/photo via refresh
  const professions = [{ cod: 'car_wash', name: 'שטיפת רכב' }];
  let inserted = 0;
  for (const w of newWashes) {
    await prisma.garageDirectory.upsert({
      where: { extId: `gplace:${w.placeId}` },
      create: {
        extId: `gplace:${w.placeId}`,
        placeId: w.placeId,
        name: 'שטיפת רכב',   // placeholder; filled by refresh (fetchCarWashDetails)
        type: 'שטיפת רכב',
        address: '',
        city: w.city,
        phone: null,
        lat: w.lat,
        lng: w.lng,
        categories: ['WASH'],
        professions,
        active: true,
        source: 'google',
        photoFetchedAt: null, // → picked up by the refresh mechanism
      },
      update: { lat: w.lat, lng: w.lng, city: w.city, active: true },
    });
    inserted++;
  }
  console.log(`\n✅ inserted/updated ${inserted} Google car washes (source='google').`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error('DISCOVER FAILED:', e); process.exit(1); });
