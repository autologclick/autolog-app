/**
 * enrich-car-washes.ts
 *
 * Enrich ALL OSM car washes NOW via Google Places Nearby Search (match by
 * coordinates + type=car_wash). Pulls real name, phone and photo for every
 * match; leaves the generic "שטיפת רכב" name only where Google has no car wash
 * at that spot.
 *
 * Runs only when GOOGLE_PLACES_API_KEY is set. Idempotent (safe to re-run;
 * refreshes photoRef, which is required by Google's photo caching rules).
 *
 * Usage: npx tsx scripts/enrich-car-washes.ts
 */

import prisma from '../src/lib/db';
import { isPlacesConfigured, enrichCarWashByCoords } from '../src/lib/integrations/google-places';

const GENERIC = 'שטיפת רכב';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!isPlacesConfigured()) {
    console.error('❌ GOOGLE_PLACES_API_KEY not set — aborting.');
    process.exit(1);
  }

  const washes = await prisma.garageDirectory.findMany({
    where: { active: true, source: 'openstreetmap', lat: { not: null }, lng: { not: null } },
    select: { id: true, name: true, phone: true, city: true, lat: true, lng: true },
    orderBy: [{ city: 'asc' }, { id: 'asc' }],
  });
  console.log(`\n🫧 Enriching ${washes.length} car washes via Google Places (by coordinates)…\n`);

  let matched = 0, gainedName = 0, realNameNow = 0, withPhone = 0, withPhoto = 0;

  for (const w of washes) {
    let m = null;
    try {
      m = await enrichCarWashByCoords(w.lat as number, w.lng as number);
    } catch (e) {
      console.log(`  ⚠️ ${w.city} #${w.id} — ${(e as Error).message}`);
    }

    const newName = m?.name || w.name;
    const newPhone = m?.phone ?? w.phone;
    if (m?.placeId) matched++;
    if (m?.name && w.name === GENERIC) gainedName++;
    if (newName !== GENERIC) realNameNow++;
    if (newPhone) withPhone++;
    if (m?.photoRef) withPhoto++;

    await prisma.garageDirectory.update({
      where: { id: w.id },
      data: {
        name: newName,
        phone: newPhone,
        placeId: m?.placeId ?? null,
        photoRef: m?.photoRef ?? null,
        photoAttribution: m?.photoAttribution ?? null,
        photoFetchedAt: new Date(),
      },
    });

    await sleep(120);
  }

  console.log('=== SUMMARY ===');
  console.log(`  processed          : ${washes.length}`);
  console.log(`  matched in Google  : ${matched}`);
  console.log(`  real name now      : ${realNameNow}  (gained from Google: ${gainedName})`);
  console.log(`  with phone         : ${withPhone}`);
  console.log(`  with photo         : ${withPhoto}`);
  console.log(`  still generic      : ${washes.length - realNameNow}`);

  // Rishon LeZion detail
  const rishon = await prisma.garageDirectory.findMany({
    where: { active: true, source: 'openstreetmap', city: 'ראשון לציון' },
    select: { name: true, phone: true, photoRef: true, address: true },
    orderBy: { name: 'asc' },
  });
  console.log(`\n=== ראשון לציון (${rishon.length}) ===`);
  for (const r of rishon) {
    console.log(`  ${r.photoRef ? '📷' : '  '} ${r.phone ? '📞' : '  '}  ${r.name}${r.address ? ' — ' + r.address : ''}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error('ENRICH FAILED:', e); process.exit(1); });
