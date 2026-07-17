/**
 * backfill-ratings.ts
 *
 * One-off: pull Google rating + userRatingCount + googleMapsUri for every active
 * row that already has a place_id (MOT garages, OSM car washes, Google car
 * washes). Uses Place Details by id — exact and cheap, no search needed.
 *
 * Ongoing refresh is handled by the daily cron (enrich-garage-photos.ts), which
 * now pulls the same fields on the same 30-day cache cycle as the photo.
 *
 * Idempotent — safe to re-run; it simply refreshes the values.
 *
 * Usage: npx tsx scripts/backfill-ratings.ts [limit]
 */

import prisma from '../src/lib/db';
import { isPlacesConfigured, fetchPlacePhoto } from '../src/lib/integrations/google-places';

const LIMIT = Number(process.argv.find((a) => /^\d+$/.test(a))) || undefined;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!isPlacesConfigured()) {
    console.error('❌ GOOGLE_PLACES_API_KEY not set — aborting.');
    process.exit(1);
  }

  const rows = await prisma.garageDirectory.findMany({
    where: { active: true, placeId: { not: null } },
    select: { id: true, name: true, city: true, placeId: true },
    orderBy: { id: 'asc' },
    ...(LIMIT ? { take: LIMIT } : {}),
  });
  console.log(`\n⭐ Backfilling ratings for ${rows.length} places…\n`);

  let withRating = 0, noRating = 0, failed = 0;

  for (const g of rows) {
    let d = null;
    try {
      d = await fetchPlacePhoto(g.placeId as string); // Place Details: photo + rating + mapsUri
    } catch (e) {
      console.log(`  ⚠️  ${g.name} — ${(e as Error).message}`);
    }

    if (!d) {
      failed++;
    } else {
      await prisma.garageDirectory.update({
        where: { id: g.id },
        data: {
          rating: d.rating,
          userRatingCount: d.userRatingCount,
          googleMapsUri: d.googleMapsUri,
        },
      });
      if (d.rating != null) withRating++; else noRating++;
    }

    const done = withRating + noRating + failed;
    if (done % 250 === 0) console.log(`  …${done}/${rows.length} (rated=${withRating})`);
    await sleep(110);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`  processed  : ${rows.length}`);
  console.log(`  with rating: ${withRating}`);
  console.log(`  no rating  : ${noRating}  (place exists but Google has no rating)`);
  console.log(`  failed     : ${failed}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error('BACKFILL FAILED:', e); process.exit(1); });
