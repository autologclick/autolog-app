/**
 * enrich-google-washes.ts — one-off: pull name/phone/photo for the freshly
 * discovered Google car washes (source='google') via Place Details by place_id.
 * Idempotent; ongoing refresh is handled by enrich-garage-photos.ts.
 */
import prisma from '../src/lib/db';
import { isPlacesConfigured, fetchCarWashDetails } from '../src/lib/integrations/google-places';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!isPlacesConfigured()) { console.error('❌ key not set'); process.exit(1); }
  const rows = await prisma.garageDirectory.findMany({
    where: { source: 'google', active: true, photoFetchedAt: null },
    select: { id: true, name: true, phone: true, placeId: true },
    orderBy: { id: 'asc' },
  });
  console.log(`\n🫧 Enriching ${rows.length} Google car washes by place_id…\n`);
  let name = 0, phone = 0, photo = 0;
  for (const g of rows) {
    let m = null;
    try { m = g.placeId ? await fetchCarWashDetails(g.placeId) : null; } catch (e) { console.log('  ⚠️', g.id, (e as Error).message); }
    if (m?.name) name++;
    if (m?.phone) phone++;
    if (m?.photoRef) photo++;
    await prisma.garageDirectory.update({
      where: { id: g.id },
      data: {
        name: m?.name || g.name,
        phone: m?.phone ?? g.phone,
        photoRef: m?.photoRef ?? null,
        photoAttribution: m?.photoAttribution ?? null,
        photoFetchedAt: new Date(),
      },
    });
    await sleep(120);
  }
  console.log(`\n=== SUMMARY ===\n  processed: ${rows.length}\n  with name: ${name}\n  with phone: ${phone}\n  with photo: ${photo}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
