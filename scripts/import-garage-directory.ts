/**
 * import-garage-directory.ts
 *
 * Populates the GarageDirectory table from the Israeli MOT authorized-garages
 * dataset on data.gov.il (resource bb68386a-a331-4bbc-b668-bba2766d517d).
 *
 * - Idempotent: upserts by licenseNum (mispar_mosah). Re-running does NOT duplicate.
 * - Soft-delete: garages present before but absent from the current pull are marked active=false.
 * - Filters to the approved 50-city list and the 4 profession-code categories only.
 * - Prints a full summary (per-city / per-category counts + any target city not found).
 *
 * Run:  npx tsx scripts/import-garage-directory.ts
 * Dry:  npx tsx scripts/import-garage-directory.ts --dry-run   (fetch + report, no DB writes)
 *
 * NOTE ON CITY NAMES: the app-facing display name (LEFT) maps to the EXACT
 * `yishuv` spelling in the dataset (RIGHT). These RIGHT-hand values were verified
 * against the live dataset on 2026-07-14. Do not edit RIGHT values without
 * re-verifying against data.gov.il — a mismatch silently drops a whole city.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESOURCE_ID = 'bb68386a-a331-4bbc-b668-bba2766d517d';
const API = 'https://data.gov.il/api/3/action/datastore_search';
const PAGE = 5000;
const DRY_RUN = process.argv.includes('--dry-run');

// profession code (cod_miktzoa) -> app category
const CODE_TO_CATEGORY: Record<string, string> = {
  '10': 'MECHANICS',   // בנזין
  '20': 'MECHANICS',   // דיזל
  '23': 'MECHANICS',   // חשמלי/היברידי
  '15': 'MECHANICS',   // אוטוטק רכב קל
  '30': 'ELECTRICITY', // חשמלאות רכב
  '70': 'BODYWORK',    // תיקון מרכבי רכב
  '100': 'BODYWORK',   // צבעות רכב
  '175': 'BODYWORK',   // אוטוטק מרכבים
  '177': 'BODYWORK',   // אוטוטק מרכבים
  '130': 'TIRES',      // תיקון והחלפת צמיגים
};

/**
 * displayCity -> list of exact dataset `yishuv` spellings that map to it.
 * 11 display names differ from the handoff list (spelling variants verified in
 * the live data on 2026-07-14). Two display names merge >1 dataset spelling
 * (Philip's decision 2026-07-14): קרית גת merges 'קריית גת' + 'קרית גת.'.
 */
const CITY_MAP: Record<string, string[]> = {
  'אילת': ['אילת'],
  'דימונה': ['דימונה'],
  'ערד': ['ערד'],
  'באר שבע': ['באר שבע'],
  'אופקים': ['אופקים'],
  'נתיבות': ['נתיבות'],
  'שדרות': ['שדרות'],
  'קרית גת': ['קריית גת', 'קרית גת.'], // merged per Philip
  'קרית מלאכי': ['קריית מלאכי'],
  'אשקלון': ['אשקלון'],
  'אשדוד': ['אשדוד'],
  'יבנה': ['יבנה'],
  'רחובות': ['רחובות'],
  'נס ציונה': ['נס ציונה'],
  'ראשון לציון': ['ראשון לציון'],
  'בת ים': ['בת ים'],
  'חולון': ['חולון'],
  'תל אביב -יפו': ['תל אביב -יפו'],
  'רמת גן': ['רמת גן'],
  'גבעתיים': ['גבעתיים'],
  'בני ברק': ['בני ברק'],
  'פתח תקוה': ['פתח תקווה'],
  'ראש העין': ['ראש העין'],
  'לוד': ['לוד'],
  'רמלה': ['רמלה'],
  'מודיעין': ['מודיעין-מכבים-רעות*'],
  'ירושלים': ['ירושלים'],
  'בית שמש': ['בית שמש'],
  'הרצליה': ['הרצלייה'],
  'רמת השרון': ['רמת השרון'],
  'כפר סבא': ['כפר סבא'],
  'רעננה': ['רעננה'],
  'הוד השרון': ['הוד השרון'],
  'נתניה': ['נתניה'],
  'חדרה': ['חדרה'],
  'אור עקיבא': ['אור עקיבא'],
  'חיפה': ['חיפה'],
  'קרית אתא': ['קריית אתא'],
  'קרית ביאליק': ['קריית ביאליק'],
  'קרית מוצקין': ['קריית מוצקין'],
  'קרית ים': ['קריית ים'],
  'טירת כרמל': ['טירת כרמל'],
  'נשר': ['נשר'],
  'עכו': ['עכו'],
  'נהריה': ['נהרייה'],
  'כרמיאל': ['כרמיאל'],
  'עפולה': ['עפולה'],
  'נצרת': ['נצרת'],
  'טבריה': ['טבריה'],
  'צפת': ['צפת'],
  'קרית שמונה': ['קריית שמונה'],
};

// dataset yishuv value -> app display city (reverse lookup for import)
const DATASET_CITY_TO_DISPLAY: Record<string, string> = {};
for (const [display, spellings] of Object.entries(CITY_MAP)) {
  for (const s of spellings) DATASET_CITY_TO_DISPLAY[s] = display;
}

interface RawRecord {
  mispar_mosah: number;
  shem_mosah: string;
  sug_mosah: string;
  ktovet: string;
  yishuv: string;
  telephone: string | null;
  mikud: string | null;
  cod_miktzoa: number | string;
  miktzoa: string;
}

async function fetchAll(): Promise<RawRecord[]> {
  const out: RawRecord[] = [];
  let offset = 0;
  for (;;) {
    const url = `${API}?resource_id=${RESOURCE_ID}&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`data.gov.il HTTP ${res.status} at offset ${offset}`);
    const json = await res.json();
    if (!json.success) throw new Error(`data.gov.il returned success=false at offset ${offset}`);
    const recs: RawRecord[] = json.result.records;
    out.push(...recs);
    if (recs.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

interface Grouped {
  licenseNum: number;
  name: string;
  type: string;
  address: string;
  displayCity: string;
  phone: string | null;
  zip: string | null;
  categories: Set<string>;
  professions: { cod: string; name: string }[];
}

async function main() {
  console.log(`\n🔧 Garage Directory import ${DRY_RUN ? '(DRY RUN — no DB writes)' : ''}`);
  console.log('Fetching from data.gov.il…');
  const all = await fetchAll();
  console.log(`  fetched ${all.length} raw rows (garage×profession)`);

  const targetDatasetCities = new Set(Object.values(CITY_MAP).flat());
  const seenTargetCities = new Set<string>();

  // group by mispar_mosah, keeping only target cities + mapped profession codes
  const byLicense = new Map<number, Grouped>();
  for (const r of all) {
    if (r.yishuv) seenTargetCities.add(r.yishuv);
    if (!targetDatasetCities.has(r.yishuv)) continue;

    const code = String(r.cod_miktzoa).trim();
    const category = CODE_TO_CATEGORY[code];
    if (!category) continue; // profession not in scope

    const lic = Number(r.mispar_mosah);
    let g = byLicense.get(lic);
    if (!g) {
      g = {
        licenseNum: lic,
        name: (r.shem_mosah || '').trim(),
        type: (r.sug_mosah || '').trim(),
        address: (r.ktovet || '').trim(),
        displayCity: DATASET_CITY_TO_DISPLAY[r.yishuv],
        phone: r.telephone ? String(r.telephone).trim() : null,
        zip: r.mikud ? String(r.mikud).trim() : null,
        categories: new Set<string>(),
        professions: [],
      };
      byLicense.set(lic, g);
    }
    g.categories.add(category);
    if (!g.professions.some((p) => p.cod === code)) {
      g.professions.push({ cod: code, name: (r.miktzoa || '').trim() });
    }
  }

  const grouped = [...byLicense.values()];
  console.log(`  → ${grouped.length} unique garages after city+category filter`);

  // report: which target cities were / were not present in the dataset pull
  const foundCities = Object.entries(CITY_MAP).filter(([, sp]) => sp.some((s) => seenTargetCities.has(s)));
  const missingCities = Object.entries(CITY_MAP).filter(([, sp]) => !sp.some((s) => seenTargetCities.has(s)));
  if (missingCities.length) {
    console.log('\n⚠️  Target cities NOT found in dataset (spelling drift? report, do not guess):');
    for (const [disp, sp] of missingCities) console.log(`     '${disp}'  (looked for ${sp.map((s) => `'${s}'`).join(' / ')})`);
  } else {
    console.log(`\n✓ all ${foundCities.length} target cities present in dataset`);
  }

  if (DRY_RUN) {
    printSummary(grouped);
    await prisma.$disconnect();
    return;
  }

  // upsert
  const importedLicenses: number[] = [];
  let created = 0;
  let updated = 0;
  for (const g of grouped) {
    const data = {
      name: g.name,
      type: g.type,
      address: g.address,
      city: g.displayCity,
      phone: g.phone,
      zip: g.zip,
      categories: [...g.categories].sort(),
      professions: g.professions,
      active: true,
      source: 'data.gov.il',
    };
    const res = await prisma.garageDirectory.upsert({
      where: { licenseNum: g.licenseNum },
      create: { licenseNum: g.licenseNum, ...data },
      update: data,
    });
    importedLicenses.push(res.licenseNum);
    // upsert doesn't tell us created vs updated directly; count via importedAt heuristic skipped
  }
  created; updated; // (kept for clarity; not distinguished by upsert)

  // soft-delete: MOT-sourced rows that are active but were NOT in this import.
  // Scoped to source='data.gov.il' so it never touches car washes / other sources.
  const softDeleted = await prisma.garageDirectory.updateMany({
    where: { active: true, source: 'data.gov.il', licenseNum: { notIn: importedLicenses } },
    data: { active: false },
  });

  console.log(`\n✅ upserted ${importedLicenses.length} garages; soft-deleted ${softDeleted.count} stale rows.`);
  printSummary(grouped);
  await prisma.$disconnect();
}

function printSummary(grouped: Grouped[]) {
  const perCity = new Map<string, number>();
  const perCat = new Map<string, number>();
  for (const g of grouped) {
    perCity.set(g.displayCity, (perCity.get(g.displayCity) || 0) + 1);
    for (const c of g.categories) perCat.set(c, (perCat.get(c) || 0) + 1);
  }
  console.log('\n=== per category (a garage may count in several) ===');
  for (const [c, n] of [...perCat.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(12)} ${n}`);
  }
  console.log('\n=== per city ===');
  for (const [c, n] of [...perCity.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${c}`);
  }
  console.log(`\n  total unique garages: ${grouped.length}`);
}

main().catch((e) => {
  console.error('IMPORT FAILED:', e);
  process.exit(1);
});
