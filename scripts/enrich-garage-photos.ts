/**
 * enrich-garage-photos.ts
 *
 * Daily batch enrichment for GarageDirectory via Google Places (New).
 * Picks garages that are un-enriched OR stale (photoFetchedAt older than the
 * 30-day cache window — Google forbids storing photo bytes, so the photo
 * reference must be refreshed periodically). This keeps every row — MOT garages
 * AND car washes — covered over time within Google's caching limits.
 *
 * Per-source matching:
 *   - OSM car washes (source=openstreetmap, has coords) → Nearby Search by
 *     COORDINATES (type=car_wash): pulls real name + phone + photo.
 *   - MOT garages → Text Search by name+address+city: photo only (official
 *     name/phone come from the ministry and are not overwritten).
 *
 * Runs ONLY when GOOGLE_PLACES_API_KEY is set (exits otherwise).
 *
 * Usage:
 *   npx tsx scripts/enrich-garage-photos.ts [limit]        # default 200; refreshes stale + new
 *   npx tsx scripts/enrich-garage-photos.ts 200 --refresh  # ignore freshness, re-do everything
 */

import prisma from '../src/lib/db';
import { Prisma } from '@prisma/client';
import { isPlacesConfigured, enrichGaragePhoto, enrichCarWashByCoords, fetchCarWashDetails, PHOTO_CACHE_DAYS } from '../src/lib/integrations/google-places';

const LIMIT = Number(process.argv.find((a) => /^\d+$/.test(a))) || 200;
const REFRESH = process.argv.includes('--refresh');
const GENERIC_WASH = 'שטיפת רכב';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!isPlacesConfigured()) {
    console.error('❌ GOOGLE_PLACES_API_KEY is not set — aborting (nothing changed).');
    process.exit(1);
  }

  const cutoff = new Date(Date.now() - PHOTO_CACHE_DAYS * 24 * 60 * 60 * 1000);
  const where: Prisma.GarageDirectoryWhereInput = REFRESH
    ? { active: true }
    : { active: true, OR: [{ photoFetchedAt: null }, { photoFetchedAt: { lt: cutoff } }] };

  const rows = await prisma.garageDirectory.findMany({
    where,
    select: { id: true, name: true, address: true, city: true, phone: true, source: true, lat: true, lng: true, placeId: true },
    orderBy: { photoFetchedAt: { sort: 'asc', nulls: 'first' } }, // never-enriched + oldest first
    take: LIMIT,
  });

  console.log(`\n📷 Enriching ${rows.length} rows (limit=${LIMIT}, refresh=${REFRESH}, stale-cutoff=${cutoff.toISOString().slice(0, 10)})…\n`);

  let withPhoto = 0, matchedNoPhoto = 0, unmatched = 0;

  for (const g of rows) {
    const isOsmWash = g.source === 'openstreetmap' && g.lat != null && g.lng != null;
    const isGoogleWash = g.source === 'google' && !!g.placeId;
    try {
      if (isOsmWash || isGoogleWash) {
        // Google-discovered → exact Place Details by id; OSM → nearest car wash by coords
        const m = isGoogleWash
          ? await fetchCarWashDetails(g.placeId as string)
          : await enrichCarWashByCoords(g.lat as number, g.lng as number);
        await prisma.garageDirectory.update({
          where: { id: g.id },
          data: {
            name: m?.name || g.name,          // fill/refresh real name; keep generic if no match
            phone: m?.phone ?? g.phone,
            placeId: m?.placeId ?? g.placeId,  // never drop a permanently-stored place_id
            photoRef: m?.photoRef ?? null,
            photoAttribution: m?.photoAttribution ?? null,
            photoFetchedAt: new Date(),
          },
        });
        if (m?.photoRef) withPhoto++; else if (m?.placeId) matchedNoPhoto++; else unmatched++;
      } else {
        const r = await enrichGaragePhoto(g.name, g.address, g.city);
        await prisma.garageDirectory.update({
          where: { id: g.id },
          data: {
            placeId: r?.placeId ?? null,
            photoRef: r?.photoRef ?? null,
            photoAttribution: r?.photoAttribution ?? null,
            photoFetchedAt: new Date(),
          },
        });
        if (r?.photoRef) withPhoto++; else if (r?.placeId) matchedNoPhoto++; else unmatched++;
      }
    } catch (e) {
      unmatched++;
      console.log(`  ⚠️  ${g.name} (${g.city}) — ${(e as Error).message}`);
    }
    await sleep(150);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`  processed  : ${rows.length}`);
  console.log(`  with photo : ${withPhoto}`);
  console.log(`  fallback   : ${matchedNoPhoto + unmatched}  (matched-no-photo: ${matchedNoPhoto}, unmatched: ${unmatched})`);
  GENERIC_WASH; // (referenced for intent; name kept generic when a wash has no Google match)

  await prisma.$disconnect();
}

main().catch((e) => { console.error('ENRICH FAILED:', e); process.exit(1); });
