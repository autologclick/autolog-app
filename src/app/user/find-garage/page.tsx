'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './find-garage.module.css';

// ── categories (app key ↔ demo style) ──
type CatKey = 'MECHANICS' | 'ELECTRICITY' | 'BODYWORK' | 'TIRES' | 'WASH';

interface CatStyle {
  label: string;   // full label on card pills
  chip: string;    // short label on filter chips
  color: string;
  bg: string;
  grad: [string, string];
  icon: React.ReactNode;
}

const CATS: Record<CatKey, CatStyle> = {
  MECHANICS: {
    label: 'מכונאות כללית', chip: 'מכונאות', color: '#2E77D0', bg: '#EAF2FC', grad: ['#1B4E8A', '#2E77D0'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6l-3 3-2.1-.4-.4-2.1 3-3z" />
      </svg>
    ),
  },
  ELECTRICITY: {
    label: 'חשמל', chip: 'חשמל', color: '#E85D04', bg: '#FFF1E6', grad: ['#E85D04', '#F97316'],
    icon: (
      <svg viewBox="0 0 24 24" fill="white">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    ),
  },
  BODYWORK: {
    label: 'פחחות וצבע', chip: 'פחחות', color: '#4A5B70', bg: '#EEF2F7', grad: ['#334155', '#64748B'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <path d="M5 13 7 8.5C7.4 7.6 8.3 7 9.3 7h5.4c1 0 1.9.6 2.3 1.5L19 13m-14 0h14m-14 0v5h1.8M19 13v5h-1.8M7.5 18h9" />
        <circle cx="8" cy="16" r="1" fill="white" />
        <circle cx="16" cy="16" r="1" fill="white" />
      </svg>
    ),
  },
  TIRES: {
    label: "פנצ'רייה / צמיגים", chip: "פנצ'רייה", color: '#16A34A', bg: '#EEFBF2', grad: ['#166534', '#16A34A'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.4" />
        <path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21" />
      </svg>
    ),
  },
  WASH: {
    label: 'שטיפת רכבים', chip: 'שטיפה', color: '#0284C7', bg: '#E0F2FE', grad: ['#075985', '#0EA5E9'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <path d="M5 14 7 9.5C7.4 8.6 8.3 8 9.3 8h5.4c1 0 1.9.6 2.3 1.5L19 14m-14 0h14m-14 0v4h1.8M19 14v4h-1.8M7.5 17h9" />
        <path d="M7 4.5c0 .8-1.2.8-1.2 0S6.4 3 6.4 3s.6.7.6 1.5zM12 4.5c0 .8-1.2.8-1.2 0S11.4 3 11.4 3s.6.7.6 1.5zM17 4.5c0 .8-1.2.8-1.2 0S16.4 3 16.4 3s.6.7.6 1.5z" fill="white" stroke="none" />
      </svg>
    ),
  },
};

const CHIP_ORDER: CatKey[] = ['MECHANICS', 'ELECTRICITY', 'BODYWORK', 'TIRES', 'WASH'];

interface Garage {
  id: number;
  licenseNum: number | null;
  name: string;
  type: string;
  address: string;
  city: string;
  phone: string | null;
  categories: string[];
  professions?: string[];
  lat?: number | null;
  lng?: number | null;
  source?: string;
  rating?: number | null;          // Google rating
  userRatingCount?: number | null; // number of Google reviews
  googleMapsUri?: string | null;   // link to the full reviews on Google
  photoUrl?: string | null;
  photoAttribution?: string | null;
  _distKm?: number | null; // client-only: aerial distance from user (never persisted)
}

/** ★ row for a Google rating, rounded to the nearest half-star. */
function starsFor(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
}

// aerial (haversine) distance in km
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const CITY_LS_KEY = 'autolog:findGarageCity';

function isValidCat(v: string | null | undefined): v is CatKey {
  return v === 'MECHANICS' || v === 'ELECTRICITY' || v === 'BODYWORK' || v === 'TIRES' || v === 'WASH';
}

function FindGarageInner() {
  const searchParams = useSearchParams();
  const initialCat = isValidCat(searchParams.get('category')) ? (searchParams.get('category') as CatKey) : 'MECHANICS';

  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);
  const [city, setCity] = useState<string>('');
  const [category, setCategory] = useState<CatKey>(initialCat);
  const [q, setQ] = useState('');
  const [sortByRating, setSortByRating] = useState(false);
  const [detail, setDetail] = useState<Garage | null>(null);

  const [items, setItems] = useState<Garage[]>([]);
  const [saved, setSaved] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState<Set<number>>(new Set());

  // "near me" — precise position is client-only (never sent to server). `approx`
  // marks an IP-based estimate (the server resolves that from the request IP).
  const [userPos, setUserPos] = useState<{ lat: number; lng: number; approx?: boolean } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  const [showGeoHelp, setShowGeoHelp] = useState(false);

  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved]);

  // ── load cities + saved on mount ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch('/api/garage-directory/cities'),
          fetch('/api/saved-garages'),
        ]);
        const cJson = cRes.ok ? await cRes.json() : { cities: [] };
        const sJson = sRes.ok ? await sRes.json() : { items: [] };
        if (!alive) return;
        const cityList: { city: string; count: number }[] = cJson.cities || [];
        setCities(cityList);
        setSaved(sJson.items || []);
        const stored = typeof window !== 'undefined' ? localStorage.getItem(CITY_LS_KEY) : null;
        const pick = stored && cityList.some((c) => c.city === stored) ? stored : cityList[0]?.city || '';
        setCity(pick);
      } catch {
        if (alive) setCities([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── fetch garages whenever city/category changes ──
  useEffect(() => {
    if (!city) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/garage-directory?city=${encodeURIComponent(city)}&category=${category}&limit=500${sortByRating ? '&sort=rating' : ''}`,
        );
        const json = res.ok ? await res.json() : { items: [] };
        if (!alive) return;
        setItems(json.items || []);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [city, category, sortByRating]);

  const onCityChange = (v: string) => {
    setCity(v);
    try { localStorage.setItem(CITY_LS_KEY, v); } catch { /* ignore */ }
  };

  const toggleSave = (g: Garage) => {
    if (savedIds.has(g.id)) {
      setSaved((s) => s.filter((x) => x.id !== g.id));
      fetch(`/api/saved-garages/${g.id}`, { method: 'DELETE' }).catch(() => {});
    } else {
      setSaved((s) => [g, ...s]);
      fetch('/api/saved-garages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garageDirectoryId: g.id }),
      }).catch(() => {});
    }
  };

  const removeSaved = (id: number) => {
    setSaved((s) => s.filter((x) => x.id !== id));
    fetch(`/api/saved-garages/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  // ── graded "near me" fallback ──
  // 1) precise browser geolocation → 2) coarse IP location (server) → 3) city order.
  const ipFallback = async () => {
    try {
      const res = await fetch('/api/geo/ip');
      if (res.ok) {
        const d = await res.json();
        if (Number.isFinite(d.latitude) && Number.isFinite(d.longitude)) {
          setUserPos({ lat: d.latitude, lng: d.longitude, approx: true });
          // switch the picker to the nearest of our cities so results are local
          if (d.nearestCity && cities.some((c) => c.city === d.nearestCity)) {
            setCity(d.nearestCity);
            try { localStorage.setItem(CITY_LS_KEY, d.nearestCity); } catch { /* ignore */ }
          }
          setGeoMsg('');
          setGeoLoading(false);
          return;
        }
      }
      setGeoMsg('לא הצלחנו לזהות מיקום — הצג לפי עיר או בחר עיר ידנית');
      setGeoLoading(false);
    } catch {
      setGeoMsg('לא הצלחנו לזהות מיקום — מציג לפי עיר');
      setGeoLoading(false);
    }
  };

  const requestNearMe = () => {
    if (userPos) { setUserPos(null); setGeoMsg(''); setShowGeoHelp(false); return; } // toggle off
    setGeoLoading(true);
    if (typeof navigator === 'undefined' || !navigator.geolocation) { ipFallback(); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, approx: false });
        setGeoMsg('');
        setShowGeoHelp(false);
        setGeoLoading(false);
      },
      () => {
        // denied / blocked / timeout — fall back to coarse IP location + offer how-to
        setShowGeoHelp(true);
        ipFallback();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  // ── free-text filter (partial, Hebrew) + optional distance sort ──
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list: Garage[] = term
      ? items.filter((g) => {
          const hay = [
            g.name,
            g.address,
            g.city,
            ...(g.professions || []),
            ...g.categories.filter(isValidCat).map((k) => CATS[k].label),
          ].join(' ').toLowerCase();
          return hay.includes(term);
        })
      : items;

    if (userPos) {
      list = list.map((g) => ({
        ...g,
        _distKm: g.lat != null && g.lng != null ? distanceKm(userPos.lat, userPos.lng, g.lat, g.lng) : null,
      }));
    }
    // distance ordering only when we're not explicitly sorting by rating
    // (the rating order comes from the server)
    if (userPos && !sortByRating) {
      // nearest first; rows without coordinates keep their name order at the end
      list = [...list].sort((a, b) => {
        if (a._distKm == null && b._distKm == null) return 0;
        if (a._distKm == null) return 1;
        if (b._distKm == null) return -1;
        return a._distKm - b._distKm;
      });
    }
    return list;
  }, [items, q, userPos, sortByRating]);

  const anyDistances = !!userPos && filtered.some((g) => g._distKm != null);

  const telUrl = (g: Garage) => `tel:${(g.phone || '').replace(/[^0-9+]/g, '')}`;
  // navigate by exact coordinates when we have them (car washes), else by address text
  const wazeUrl = (g: Garage) =>
    g.lat != null && g.lng != null
      ? `https://waze.com/ul?ll=${g.lat},${g.lng}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(`${g.address} ${g.city}`)}`;

  return (
    <div className={styles.wrap} dir="rtl">
      <div className={styles.top}>
        <div className={styles.brand}><span className={styles.dot}>🔧</span> שירותי רכב</div>
      </div>

      <div className={styles.searchBox}>
        <span className={styles.ic}>🔍</span>
        <input
          className={styles.search}
          type="search"
          inputMode="search"
          placeholder="חיפוש: שם מוסך, כתובת, עיר או מקצוע…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="חיפוש חופשי"
        />
        {q && <button className={styles.searchClear} onClick={() => setQ('')} aria-label="נקה חיפוש">✕</button>}
      </div>

      <div className={styles.controls}>
        <select value={city} onChange={(e) => onCityChange(e.target.value)} aria-label="בחר עיר">
          {cities.map((c) => (
            <option key={c.city} value={c.city}>📍 {c.city}</option>
          ))}
        </select>
        <button
          className={`${styles.nearBtn} ${userPos ? styles.on : ''}`}
          onClick={requestNearMe}
          disabled={geoLoading}
          title="מיין לפי מרחק ממני"
        >
          {geoLoading ? '⏳ מאתר…' : userPos ? '📍 לפי מרחק ✕' : '🎯 קרוב אליי'}
        </button>
        <button
          className={`${styles.sortBtn} ${sortByRating ? styles.on : ''}`}
          onClick={() => setSortByRating((v) => !v)}
          title="מיין לפי דירוג בגוגל"
        >
          {sortByRating ? '⭐ לפי דירוג ✕' : '⭐ דירוג'}
        </button>
      </div>

      <div className={styles.chips}>
        {CHIP_ORDER.map((k) => (
          <button
            key={k}
            className={`${styles.chip} ${category === k ? styles.on : ''}`}
            onClick={() => setCategory(k)}
          >
            {CATS[k].chip}
          </button>
        ))}
      </div>

      <div className={styles.countLine}>
        <span>{loading ? '' : `${filtered.length} תוצאות`}</span>
        {geoMsg ? (
          <span className={styles.geoMsg}>{geoMsg}</span>
        ) : userPos ? (
          <span className={styles.geoMsg}>
            {userPos.approx ? '📶 מיקום משוער לפי האינטרנט' : anyDistances ? '📍 ממוין לפי מרחק ממך' : 'מרחק זמין כרגע לשטיפות רכב'}
          </span>
        ) : null}
      </div>

      {showGeoHelp && (
        <details className={styles.geoHelp}>
          <summary>❓ איך להפעיל מיקום מדויק?</summary>
          <div className={styles.geoHelpBody}>
            <p><b>אנדרואיד (Chrome):</b> הגדרות המכשיר ← מיקום ← הפעל. בדפדפן: ⋮ ← הגדרות אתר ← מיקום ← אפשר, ואז לרענן את הדף.</p>
            <p><b>אייפון (Safari):</b> הגדרות ← פרטיות ואבטחה ← שירותי מיקום ← הפעל (וגם עבור הדפדפן ← &quot;בעת השימוש&quot;). בדף: אייקון aA בשורת הכתובת ← הגדרות אתר ← מיקום ← אפשר.</p>
          </div>
        </details>
      )}

      {loading ? (
        <div className={styles.loading}>טוען מוסכים…</div>
      ) : filtered.length ? (
        <div className={styles.list}>
          {filtered.map((g) => {
            const firstCat = g.categories.find(isValidCat) as CatKey | undefined;
            const main = CATS[firstCat || category];
            const showPhoto = g.photoUrl && !photoFailed.has(g.id);
            const isSaved = savedIds.has(g.id);
            return (
              <div
                key={g.id}
                className={styles.row}
                onClick={() => setDetail(g)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setDetail(g); }}
              >
                <div className={styles.thumb} style={{ background: `linear-gradient(135deg,${main.grad[0]},${main.grad[1]})` }}>
                  {showPhoto ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.thumbImg}
                        src={g.photoUrl as string}
                        alt={g.name}
                        loading="lazy"
                        onError={() => setPhotoFailed((s) => new Set(s).add(g.id))}
                      />
                      {g.photoAttribution && <span className={styles.thumbAttr}>© {g.photoAttribution}</span>}
                    </>
                  ) : (
                    main.icon
                  )}
                </div>

                <div className={styles.info}>
                  <div className={styles.rowName}>{g.name}</div>
                  {g.rating != null && (
                    <div className={styles.rate}>
                      <span className={styles.rateNum}>{g.rating.toFixed(1)}</span>
                      <span className={styles.stars}>{starsFor(g.rating)}</span>
                      {g.userRatingCount != null && (
                        <span className={styles.rateCount}>({g.userRatingCount})</span>
                      )}
                    </div>
                  )}
                  <div className={styles.rowCats}>
                    {g.categories.filter(isValidCat).map((k) => (
                      <span key={k} className={styles.cat} style={{ color: CATS[k].color, background: CATS[k].bg }}>{CATS[k].label}</span>
                    ))}
                  </div>
                  <div className={styles.rowAddr}>
                    {g._distKm != null && <span className={styles.dist}>📍 {g._distKm.toFixed(1)} ק״מ</span>}
                    🏠 {[g.address, g.city].filter(Boolean).join(', ')}
                    {g.licenseNum ? ` · רישיון ${g.licenseNum}` : ''}
                  </div>
                </div>

                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  {g.phone && <a className={`${styles.iconBtn} ${styles.call}`} href={telUrl(g)} title={`חיוג ${g.phone}`} aria-label="חיוג">📞</a>}
                  <a className={styles.iconBtn} href={wazeUrl(g)} target="_blank" rel="noopener noreferrer" title="ניווט ב-Waze" aria-label="ניווט">🧭</a>
                  <button
                    className={`${styles.iconBtn} ${styles.save} ${isSaved ? styles.on : ''}`}
                    onClick={() => toggleSave(g)}
                    title={isSaved ? 'הסר משמורים' : 'שמור'}
                    aria-label={isSaved ? 'הסר משמורים' : 'שמור'}
                  >♥</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.big}>🔧</div>
          <div>{q ? 'לא נמצאו מוסכים שתואמים לחיפוש.' : 'אין מוסכים בקטגוריה זו בעיר שנבחרה.'}</div>
        </div>
      )}

      <div className={styles.footer}>
        נתוני מוסכים: מאגר משרד התחבורה (data.gov.il) · מתעדכן חודשית<br />
        שטיפות רכב: © OpenStreetMap contributors (ODbL)
      </div>


      {/* Garage detail sheet — the "garage page": prominent Google rating + reviews link */}
      {detail && (() => {
        const dCat = (detail.categories.find(isValidCat) as CatKey | undefined) || category;
        const dMain = CATS[dCat];
        const dPhoto = detail.photoUrl && !photoFailed.has(detail.id);
        return (
          <div className={styles.drawer} onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
            <div className={styles.sheet}>
              <div className={styles.sheetHead}>
                <h3>פרטי {detail.categories.includes('WASH') ? 'שטיפה' : 'מוסך'}</h3>
                <button className={styles.sheetClose} onClick={() => setDetail(null)} aria-label="סגור">✕</button>
              </div>
              <div className={styles.sheetBody}>
                <div className={styles.detailHead}>
                  <div className={styles.detailThumb} style={{ background: `linear-gradient(135deg,${dMain.grad[0]},${dMain.grad[1]})` }}>
                    {dPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detail.photoUrl as string} alt={detail.name} />
                    ) : dMain.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className={styles.detailName}>{detail.name}</div>
                    <div className={styles.rowCats} style={{ marginTop: 6 }}>
                      {detail.categories.filter(isValidCat).map((k) => (
                        <span key={k} className={styles.cat} style={{ color: CATS[k].color, background: CATS[k].bg }}>{CATS[k].label}</span>
                      ))}
                    </div>
                    <div className={styles.detailAddr}>
                      🏠 {[detail.address, detail.city].filter(Boolean).join(', ')}
                      {detail.licenseNum ? ` · רישיון ${detail.licenseNum}` : ''}
                      {detail._distKm != null ? ` · ${detail._distKm.toFixed(1)} ק״מ` : ''}
                    </div>
                  </div>
                </div>

                {detail.rating != null ? (
                  <div className={styles.bigRate}>
                    <span className={styles.bigRateNum}>{detail.rating.toFixed(1)}</span>
                    <span>
                      <span className={styles.bigStars}>{starsFor(detail.rating)}</span>
                      <div className={styles.bigRateCount}>
                        {detail.userRatingCount != null ? `${detail.userRatingCount} ביקורות בגוגל` : 'דירוג מגוגל'}
                      </div>
                    </span>
                    {detail.googleMapsUri && (
                      <a className={styles.reviewsLink} href={detail.googleMapsUri} target="_blank" rel="noopener noreferrer">
                        קרא ביקורות ב-Google ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <div className={styles.noRate}>אין עדיין דירוג בגוגל למקום הזה.</div>
                )}

                <div className={styles.detailCta}>
                  {detail.phone && <a className={`${styles.btn} ${styles.call}`} href={telUrl(detail)}>📞 {detail.phone}</a>}
                  <a className={`${styles.btn} ${styles.nav}`} href={wazeUrl(detail)} target="_blank" rel="noopener noreferrer">🧭 ניווט</a>
                  <button
                    className={`${styles.btn} ${styles.nav}`}
                    onClick={() => toggleSave(detail)}
                  >{savedIds.has(detail.id) ? '♥ הסר' : '♡ שמור'}</button>
                </div>

                <div className={styles.attrib}>
                  דירוגים, ביקורות{detail.photoAttribution ? ' ותמונות' : ''} — מקור: Google
                  {detail.photoAttribution ? ` · תמונה: © ${detail.photoAttribution}` : ''}
                  <br />Powered by Google
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {saved.length > 0 && (
        <button className={styles.savedFab} onClick={() => setDrawerOpen(true)}>♥ נשמרו {saved.length}</button>
      )}

      {drawerOpen && (
        <div className={styles.drawer} onClick={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <h3>מוסכים שנשמרו ({saved.length})</h3>
              <button className={styles.sheetClose} onClick={() => setDrawerOpen(false)} aria-label="סגור">✕</button>
            </div>
            <div className={styles.sheetBody}>
              {saved.length ? saved.map((g) => (
                <div key={g.id} className={styles.srow}>
                  <span>{g.name}<br /><small>{g.address}, {g.city}</small></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {g.phone && <a href={telUrl(g)}>📞 חייג</a>}
                    <button className={styles.srowRemove} onClick={() => removeSaved(g.id)} title="הסר">✕</button>
                  </span>
                </div>
              )) : <div className={styles.srowEmpty}>אין עדיין מוסכים שמורים</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FindGaragePage() {
  return (
    <Suspense fallback={<div className={styles.wrap} dir="rtl"><div className={styles.loading}>טוען…</div></div>}>
      <FindGarageInner />
    </Suspense>
  );
}
