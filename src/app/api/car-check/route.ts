import { NextRequest, NextResponse } from 'next/server';
import { checkCustomerLookupRateLimit } from '@/lib/rate-limit';

// בדיקת רכב לפני קנייה — מאגד נתונים ממאגרי משרד התחבורה (data.gov.il)
// cache תוצאות לפי מספר רכב — מגן על מאגרי הממשלה בעומס ומאיץ תשובות
// המאגרים מתעדכנים לכל היותר פעם ביום, לכן 6 שעות בטוחות
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const PARTIAL_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 2000;
const reportCache = new Map<string, { at: number; ttl: number; body: unknown }>();

const CKAN = 'https://data.gov.il/api/3/action/datastore_search';
const RES = {
  main: '053cea08-09bc-40ec-8f7a-156f0677aff3',      // מאגר רכב ראשי
  ownership: 'bb2355dc-9ec7-4f06-9c3f-3344672171da', // היסטוריית בעלויות
  tech: '56063a99-8a3e-4ff4-912e-5966c0279bad',      // מספר מנוע + ק"מ טסט + שינויי מבנה
  recall: '36bf1404-0be4-49d2-82dc-2f1ead4a8b93',    // ריקולים שלא בוצעו
  bitul: '851ecab1-0622-4dbe-a6c7-f950cf82abf9',     // ירידה מהכביש - ביטול סופי
  yevu: '03adc637-b6fe-402b-9937-7c3d3afc9140',      // יבוא אישי
  inactive1: 'f6efe89a-fb3d-43a4-bb61-9bf12a9b9099', // לא פעילים (עם קוד דגם)
  inactive2: '6f6acd03-f351-4a8f-8ecf-df792f4f573a', // לא פעילים (חסרי קוד דגם)
  moto: 'bf9df4e2-d90d-4c0a-a400-19e15af8e95f',      // דו-גלגלי פעיל
  heavy: 'cd3acc5c-03c3-4c89-9c54-d40f93c0d790',     // מעל 3.5 טון
  models: '142afde2-6228-49f9-8a29-9b6c3a0cbe40',    // מפרטי דגמים רשמיים
};

type Rec = Record<string, unknown>;

async function qOnce(resourceId: string, plate: number, limit: number): Promise<Rec[]> {
  const filters = encodeURIComponent(JSON.stringify({ mispar_rechev: plate }));
  const url = `${CKAN}?resource_id=${resourceId}&filters=${filters}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(7000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`gov api ${res.status}`);
  const j = await res.json();
  return (j?.result?.records as Rec[]) || [];
}

// המאגר הממשלתי נופל לסירוגין — ניסיון חוזר אוטומטי
async function q(resourceId: string, plate: number, limit = 50): Promise<Rec[]> {
  try {
    return await qOnce(resourceId, plate, limit);
  } catch {
    await new Promise((r) => setTimeout(r, 500));
    return qOnce(resourceId, plate, limit);
  }
}

async function qSpec(tozeretCd: number, degemCd: number, shnatYitzur: number): Promise<Rec | null> {
  const filters = encodeURIComponent(JSON.stringify({ tozeret_cd: tozeretCd, degem_cd: degemCd, shnat_yitzur: shnatYitzur }));
  const url = `${CKAN}?resource_id=${RES.models}&filters=${filters}&limit=1`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(7000), cache: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    return ((j?.result?.records || [])[0] as Rec) || null;
  } catch {
    return null;
  }
}

interface Flag {
  level: 'red' | 'orange' | 'green' | 'info';
  title: string;
  detail: string;
}

function settled<T>(r: PromiseSettledResult<T>, fallback: T): T {
  return r.status === 'fulfilled' ? r.value : fallback;
}

export async function GET(req: NextRequest) {
  const rateLimit = await checkCustomerLookupRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'יותר מדי בדיקות ברצף. נסו שוב בעוד דקה.' }, { status: 429 });
  }

  const plateRaw = (req.nextUrl.searchParams.get('plate') || '').replace(/\D/g, '');
  if (plateRaw.length < 5 || plateRaw.length > 8) {
    return NextResponse.json({ error: 'מספר רכב לא תקין' }, { status: 400 });
  }
  const plate = parseInt(plateRaw, 10);

  const hit = reportCache.get(plateRaw);
  if (hit && Date.now() - hit.at < hit.ttl) {
    return NextResponse.json(hit.body);
  }

  const results = await Promise.allSettled([
    q(RES.main, plate, 1),
    q(RES.ownership, plate, 60),
    q(RES.tech, plate, 1),
    q(RES.recall, plate, 5),
    q(RES.bitul, plate, 5),
    q(RES.yevu, plate, 5),
  ]);
  const main = settled(results[0], [] as Rec[]);
  let ownership = settled(results[1], [] as Rec[]);
  let tech = settled(results[2], [] as Rec[]);
  const recall = settled(results[3], [] as Rec[]);
  const bitul = settled(results[4], [] as Rec[]);
  const yevu = settled(results[5], [] as Rec[]);

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed >= 5) {
    return NextResponse.json({ error: 'מאגרי הממשלה לא זמינים כרגע. נסו שוב בעוד כמה דקות.' }, { status: 502 });
  }

  let v = main[0];
  const b = bitul[0];
  let vclass = 'רכב פרטי/מסחרי';
  const flags: Flag[] = [];
  const now = new Date();

  if (!v && !b) {
    // הרכב לא במאגר הפעיל — בודקים מושבתים, דו-גלגלי ורכב כבד
    const alt = await Promise.allSettled([
      q(RES.inactive1, plate, 1),
      q(RES.inactive2, plate, 1),
      q(RES.moto, plate, 1),
      q(RES.heavy, plate, 1),
    ]);
    const ina1 = settled(alt[0], [] as Rec[]);
    const ina2 = settled(alt[1], [] as Rec[]);
    const moto = settled(alt[2], [] as Rec[]);
    const heavy = settled(alt[3], [] as Rec[]);

    if (ina1[0] || ina2[0]) {
      const r = (ina1[0] || ina2[0]) as Rec;
      v = r;
      vclass = 'רכב לא פעיל';
      flags.push({ level: 'red', title: 'הרכב אינו פעיל — הרישיון פקע לפני יותר מ-13 חודשים', detail: 'הרכב מופיע במאגר כלי הרכב הלא פעילים של משרד התחבורה. רכב שעמד תקופה ארוכה בלי רישיון דורש בדיקה מכנית יסודית, תשלום אגרות ומבחן רישוי לפני חזרה לכביש. אם מוכרים לכם אותו כרכב "רגיל" — זה דגל אדום חמור.' });
    } else if (moto[0]) {
      v = moto[0];
      vclass = 'דו-גלגלי';
      flags.push({ level: 'info', title: 'כלי רכב דו-גלגלי', detail: 'חלק מבדיקות ההיסטוריה (ק"מ בטסט, שרשרת בעלויות) זמינות במאגרים הפתוחים רק לרכב פרטי — מומלץ להשלים בדיקה פיזית ובדיקת מסמכים.' });
      const mm = String((moto[0] as Rec)['mispar_manoa'] || '');
      if (mm) flags.push({ level: 'info', title: 'מספר מנוע רשום', detail: `${mm} — השוו למספר הפיזי על המנוע.` });
    } else if (heavy[0]) {
      v = heavy[0];
      vclass = 'רכב כבד (מעל 3.5 טון)';
      flags.push({ level: 'info', title: 'רכב כבד', detail: 'רכב מעל 3.5 טון. בדיקות ההיסטוריה המלאות זמינות במאגרים הפתוחים בעיקר לרכב פרטי.' });
    } else {
      return NextResponse.json({ error: 'הרכב לא נמצא באף מאגר (פרטי, מושבת, דו-גלגלי או כבד). בדקו את המספר — או שמדובר ברכב צבאי/משטרתי/צמ"ה שאינו מפורסם.' }, { status: 404 });
    }
  }

  // אם הרכב פעיל אבל ההיסטוריה חסרה — כנראה כשל רגעי במאגר, מנסים שוב
  if (v && vclass === 'רכב פרטי/מסחרי' && ownership.length === 0 && !tech[0]) {
    const retry = await Promise.allSettled([q(RES.ownership, plate, 60), q(RES.tech, plate, 1)]);
    ownership = settled(retry[0], ownership);
    tech = settled(retry[1], tech);
    if (ownership.length === 0 && !tech[0]) {
      flags.push({ level: 'info', title: 'נתוני ההיסטוריה לא התקבלו הפעם', detail: 'שרשרת הבעלויות והק"מ לא הוחזרו מהמאגר הממשלתי. זה קורה לרכבים שהחליפו מספר רישוי בעבר — או בעומס רגעי של המאגר. נסו לרענן בעוד דקה.' });
    }
  }

  // --- דגלים אדומים ---
  if (b) {
    flags.push({ level: 'red', title: 'הרכב ירד מהכביש (ביטול סופי)', detail: `הרכב מופיע במאגר כלי הרכב שרישומם בוטל סופית. תאריך ביטול: ${String((b as Rec)['bitul_dt'] || 'לא ידוע')}. אסור לקנות רכב כזה לנסיעה.` });
  }
  if (recall.length > 0) {
    flags.push({ level: 'red', title: 'ריקול פתוח שלא טופל', detail: 'הרכב קיבל קריאת שירות (ריקול) מהיבואן ולא ביצע אותה מעל חצי שנה. לפי משרד התחבורה, לרכב כזה לא ניתן לחדש רישיון ולא ניתן לבצע העברת בעלות עד לתיקון.' });
  } else if (v) {
    flags.push({ level: 'green', title: 'אין ריקול פתוח', detail: 'הרכב לא מופיע במאגר הריקולים שלא בוצעו.' });
  }

  // --- היסטוריית בעלויות ---
  const ownSorted = ownership
    .map((o) => ({ dt: Number(o['baalut_dt'] || 0), type: String(o['baalut'] || '') }))
    .sort((a, c) => a.dt - c.dt);
  if (ownSorted.length > 0) {
    const types = ownSorted.map((o) => o.type);
    const commercial = types.filter((t) => ['ליסינג', 'השכרה', 'מונית', 'לימוד נהיגה', 'החכר'].some((k) => t.includes(k)));
    if (commercial.length > 0) {
      flags.push({ level: 'orange', title: `עבר ${[...new Set(commercial)].join(' / ')}`, detail: 'הרכב היה בבעלות מסחרית בעבר — בדרך כלל קילומטראז׳ גבוה וריבוי נהגים. ודאו שהמחיר משקף זאת.' });
    }
    const dealer = types.filter((t) => t.includes('סוחר'));
    if (dealer.length > 0) {
      flags.push({ level: 'orange', title: 'הרכב עבר דרך סוחר', detail: 'לפחות אחת מהעברות הבעלות הייתה לסוחר רכב. שווה לשאול את המוכר על גלגולי הרכב.' });
    }
    if (ownSorted.length >= 4) {
      flags.push({ level: 'orange', title: `${ownSorted.length} החלפות בעלות`, detail: 'מספר גבוה של ידיים. ודאו שהסיפור של המוכר מסתדר עם ההיסטוריה.' });
    }
    const curOwnership = String((v && v['baalut']) || '');
    const originMkoriut = String((tech[0] && tech[0]['mkoriut_nm']) || '');
    const contradictsClean = ['ליסינג', 'השכרה', 'מונית', 'החכר', 'סוחר'].some(
      (k) => curOwnership.includes(k) || originMkoriut.includes(k)
    );
    if (ownSorted.length <= 2 && commercial.length === 0 && dealer.length === 0 && !contradictsClean) {
      flags.push({ level: 'green', title: 'היסטוריית בעלות נקייה', detail: `${ownSorted.length} בעלויות, כולן פרטיות.` });
    }
  }

  // --- נתונים טכניים: ק"מ, מנוע, שינויים ---
  const t = tech[0];
  let kmInfo: Rec | null = null;
  if (t) {
    const km = Number(t['kilometer_test_aharon'] || 0);
    const year = v ? Number(v['shnat_yitzur'] || 0) : 0;
    const age = year > 0 ? Math.max(1, now.getFullYear() - year) : 0;
    if (km > 0 && age > 0) {
      const avg = Math.round(km / age);
      kmInfo = { km, avgPerYear: avg };
      if (avg > 30000) {
        flags.push({ level: 'orange', title: `קילומטראז׳ גבוה: כ-${avg.toLocaleString()} ק"מ בשנה`, detail: `בטסט האחרון נרשמו ${km.toLocaleString()} ק"מ. שחיקה מוגברת — ודאו טיפולים בהתאם.` });
      } else if (avg < 6000 && age >= 4) {
        flags.push({ level: 'orange', title: 'קילומטראז׳ נמוך באופן חריג', detail: `בטסט האחרון נרשמו ${km.toLocaleString()} ק"מ בלבד. השוו מול מד הק"מ בפועל — פער כלפי מטה במודעה הוא סימן להרצת מד.` });
      } else {
        flags.push({ level: 'green', title: `ק"מ בטסט האחרון: ${km.toLocaleString()}`, detail: `ממוצע כ-${avg.toLocaleString()} ק"מ בשנה — סביר. השוו את המספר במודעה למספר הזה.` });
      }
    }
    if (Number(t['gapam_ind']) === 1) {
      flags.push({ level: 'orange', title: 'הוסבה מערכת גפ"מ (גז)', detail: 'ברכב מותקנת/הותקנה מערכת גז. ודאו תקינות ואישורים.' });
    }
    if (String(t['mkoriut_nm'] || '').includes('החכר')) {
      flags.push({ level: 'orange', title: 'מקור הרכב בהחכרה (ליסינג)', detail: 'הרכב נרשם במקור כרכב החכר — גם אם הבעלות הנוכחית פרטית.' });
    }
    flags.push({ level: 'info', title: 'מספר מנוע רשום', detail: `${String(t['mispar_manoa'] || 'לא זמין')} — בקנייה, השוו את המספר הפיזי על המנוע למספר הזה. אי-התאמה = מנוע שהוחלף בלי דיווח.` });
  }

  // --- יבוא אישי ---
  if (yevu.length > 0) {
    flags.push({ level: 'orange', title: 'רכב ביבוא אישי', detail: 'הרכב יובא ביבוא אישי (לא דרך היבואן הרשמי). בדקו אחריות, זמינות חלפים ושווי שוק בהתאם.' });
  }

  // --- בעלות נוכחית ---
  if (v) {
    const curBaalut = String(v['baalut'] || '');
    if (['ליסינג', 'השכרה', 'מונית'].some((k) => curBaalut.includes(k))) {
      flags.push({ level: 'orange', title: `הבעלות הנוכחית: ${curBaalut}`, detail: 'הרכב עדיין רשום כרכב מסחרי.' });
    }
    if (curBaalut.includes('סוחר')) {
      flags.push({ level: 'info', title: 'הבעלות הנוכחית רשומה על סוחר רכב', detail: 'אם אתם קונים ממגרש/סוחר — זה צפוי. אם המוכר מציג את עצמו כבעלים פרטי — זה דגל אדום.' });
    }
  }

  if (failed > 0) {
    flags.push({ level: 'orange', title: 'חלק מהמאגרים הממשלתיים לא ענו', detail: 'ייתכן שחסרים נתונים בדוח זה. מומלץ לרענן ולבדוק שוב בעוד כמה דקות.' });
  }

  // מפרט מלא מהמאגר הרשמי של הדגמים
  const specs: { label: string; value: string }[] = [];
  let safety: string[] = [];
  if (v && vclass === 'רכב פרטי/מסחרי') {
    const sp = await qSpec(Number(v['tozeret_cd'] || 0), Number(v['degem_cd'] || 0), Number(v['shnat_yitzur'] || 0));
    if (sp) {
      const add = (label: string, val: unknown, suffix = '') => {
        if (val !== null && val !== undefined && String(val) !== '' && String(val) !== '0') specs.push({ label, value: `${val}${suffix}` });
      };
      add('מרכב', sp['merkav']);
      add('הנעה', sp['hanaa_nm']);
      add('נפח מנוע', sp['nefah_manoa'], ' סמ"ק');
      add('כוח סוס', sp['koah_sus']);
      add('משקל כולל', sp['mishkal_kolel'], ' ק"ג');
      add('דלתות', sp['mispar_dlatot']);
      add('מושבים', sp['mispar_moshavim']);
      add('כריות אוויר', sp['mispar_kariot_avir']);
      add('רמת אבזור בטיחותי', sp['ramat_eivzur_betihuty']);
      add('קבוצת זיהום', sp['kvutzat_zihum']);
      add('מדד ירוק', sp['madad_yarok']);
      add('פליטת CO2', sp['kamut_CO2'], ' גר׳/ק"מ');
      add('תקינה', sp['sug_tkina_nm']);
      if (Number(sp['automatic_ind']) === 1) specs.push({ label: 'תיבת הילוכים', value: 'אוטומטית' });
      const feats: [string, string][] = [
        ['abs_ind', 'ABS'], ['bakarat_yatzivut_ind', 'בקרת יציבות'], ['bakarat_stiya_menativ_ind', 'בקרת סטייה מנתיב'],
        ['nitur_merhak_milfanim_ind', 'ניטור מרחק מלפנים'], ['zihuy_holchey_regel_ind', 'זיהוי הולכי רגל'],
        ['maarechet_ezer_labalam_ind', 'מערכת עזר לבלם'], ['hayshaney_lahatz_avir_batzmigim_ind', 'חיישני לחץ אוויר'],
        ['hayshaney_hagorot_ind', 'חיישני חגורות'], ['teura_automatit_benesiya_kadima_ind', 'תאורה אוטומטית'],
        ['shlita_automatit_beorot_gvohim_ind', 'שליטה באורות גבוהים'], ['zihuy_matzav_hitkarvut_mesukenet_ind', 'התרעת התנגשות'],
        ['zihuy_tamrurey_tnua_ind', 'זיהוי תמרורים'], ['matzlemat_reverse_ind', 'מצלמת רוורס'],
        ['bakarat_shyut_adaptivit_ind', 'שיוט אדפטיבי'], ['bakarat_stiya_activ_s', 'בקרת סטייה אקטיבית'],
        ['zihuy_rechev_do_galgali', 'זיהוי דו-גלגלי'], ['zihuy_beshetah_nistar_ind', 'זיהוי שטח מת'],
      ];
      safety = feats.filter(([k]) => Number(sp[k]) === 1).map(([, n]) => n);
    }
  }

  const order = { red: 0, orange: 1, green: 2, info: 3 } as const;
  flags.sort((a, c) => order[a.level] - order[c.level]);

  const body = {
    plate: plateRaw,
    vehicleClass: vclass,
    vehicle: v ? {
      tozeret: String(v['tozeret_nm'] || ''),
      kinuy: String(v['kinuy_mishari'] || v['degem_nm'] || ''),
      degem: String(v['degem_nm'] || ''),
      shnatYitzur: Number(v['shnat_yitzur'] || 0),
      tzeva: String(v['tzeva_rechev'] || vclass),
      delek: String(v['sug_delek_nm'] || ''),
      baalut: String(v['baalut'] || (vclass === 'רכב לא פעיל' ? 'לא פעיל' : '')),
      tokefTest: String(v['tokef_dt'] || '—'),
      aliyaLakvish: String(v['moed_aliya_lakvish'] || ''),
      misgeret: String(v['misgeret'] || ''),
      zmig: String(v['zmig_kidmi'] || ''),
      gimur: String(v['ramat_gimur'] || ''),
      degemManoa: String(v['degem_manoa'] || ''),
    } : null,
    ownershipHistory: ownSorted,
    kmInfo,
    specs,
    safety,
    flags,
    partial: failed > 0,
    checkedAt: now.toISOString(),
  };
  // שומרים ב-cache רק דוח מלא (ללא כשלי מאגר), עם פינוי הרשומה הישנה ביותר
  if (reportCache.size >= CACHE_MAX) {
    const oldest = reportCache.keys().next().value;
    if (oldest !== undefined) reportCache.delete(oldest);
  }
  reportCache.set(plateRaw, { at: Date.now(), ttl: failed === 0 ? CACHE_TTL_MS : PARTIAL_TTL_MS, body });
  return NextResponse.json(body);
}
