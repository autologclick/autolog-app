/**
 * geocode-mot-garages.ts
 *
 * Geocode MOT garages (source='data.gov.il') that have no coordinates, using
 * Google Places Text Search (name+address+city → location). Stores lat/lng
 * permanently so the "near me" feature can compute distances for them, and also
 * captures the matched place_id (bonus for future photo enrichment).
 *
 * Idempotent: only touches rows with lat IS NULL. Runs only when the key is set.
 *
 * Usage: npx tsx scripts/geocode-mot-garages.ts [limit]   # default: all remaining
 */

import prisma from '../src/lib/db';
import { isPlacesConfigured, geocodeGarage } from '../src/lib/integrations/google-places';

const LIMIT = Number(process.argv.find((a) => /^\d+$/.test(a))) || undefined;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!isPlacesConfigured()) { console.error('❌ GOOGLE_PLACES_API_KEY not set — aborting.'); process.exit(1); }

  const rows = await prisma.garageDirectory.findMany({
    where: { source: 'data.gov.il', active: true, lat: null },
    select: { id: true, name: true, address: true, city: true },
    orderBy: { id: 'asc' },
    ...(LIMIT ? { take: LIMIT } : {}),
  });
  console.log(`\n📍 Geocoding ${rows.length} MOT garages via Places Text Search…\n`);

  let ok = 0, fail = 0;
  for (const g of rows) {
    let r = null;
    try { r = await geocodeGarage(g.name, g.address, g.city); } catch (e) { console.log('  ⚠️', g.id, (e as Error).message); }
    if (r) {
      await prisma.garageDirectory.update({ where: { id: g.id }, data: { lat: r.lat, lng: r.lng, placeId: r.placeId } });
      ok++;
    } else {
      fail++;
    }
    if ((ok + fail) % 200 === 0) console.log(`  …${ok + fail}/${rows.length} (ok=${ok}, fail=${fail})`);
    await sleep(130);
  }
  console.log(`\n=== SUMMARY ===\n  processed: ${rows.length}\n  geocoded : ${ok}\n  no match : ${fail}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error('GEOCODE FAILED:', e); process.exit(1); });
