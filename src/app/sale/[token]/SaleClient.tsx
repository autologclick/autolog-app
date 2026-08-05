'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Flag = { level: 'red' | 'orange' | 'green' | 'info'; title: string; detail: string };
type Treatment = { title: string; type: string; date: string; mileage: number | null; garageName: string | null };
type SaleData = {
  vehicle: {
    licensePlate: string;
    manufacturer: string;
    model: string;
    year: number;
    color: string | null;
    testExpiryDate: string | null;
    previousOwners: number | null;
  };
  sections: { details?: boolean; carCheck?: boolean; treatments?: boolean; contact?: boolean };
  treatments: Treatment[];
  sellerPhone: string | null;
  hasInfocar?: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  maintenance: 'טיפול שוטף',
  repair: 'תיקון',
  oil_change: 'החלפת שמן',
  tires: 'צמיגים',
  brakes: 'בלמים',
  electrical: 'חשמל',
  ac: 'מיזוג',
  bodywork: 'פחחות וצבע',
  inspection: 'בדיקה',
  other: 'אחר',
};

const FLAG_STYLES: Record<string, string> = {
  red: 'bg-red-50 border-red-200 text-red-800',
  orange: 'bg-amber-50 border-amber-200 text-amber-800',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
};

function formatPlate(p: string) {
  if (p.length === 8) return `${p.slice(0, 3)}-${p.slice(3, 5)}-${p.slice(5)}`;
  if (p.length === 7) return `${p.slice(0, 2)}-${p.slice(2, 5)}-${p.slice(5)}`;
  return p;
}

export default function SaleClient({ token }: { token: string }) {
  const [data, setData] = useState<SaleData | null>(null);
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sale/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'שגיאה');
        setData(d);
        if (d.sections?.carCheck && d.vehicle?.licensePlate) {
          fetch(`/api/car-check?plate=${d.vehicle.licensePlate}`)
            .then((cr) => (cr.ok ? cr.json() : null))
            .then((cd) => setFlags(cd?.flags ?? []))
            .catch(() => setFlags([]));
        }
      })
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1B4E8A] mb-2">דף המכירה אינו זמין</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/car-check?utm_source=salepage" className="text-teal-600 font-bold underline">
            בדקו רכב בעצמכם — חינם
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">טוען…</p>
      </div>
    );
  }

  const v = data.vehicle;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-[#1B4E8A] text-white py-6 px-4 text-center">
        <p className="text-sm text-white/70 mb-1">תעודת זהות לרכב · מופק באוטולוג</p>
        <h1 className="text-2xl font-bold">
          {v.manufacturer} {v.model} {v.year}
        </h1>
        <p className="text-white/80 mt-1" dir="ltr">{formatPlate(v.licensePlate)}</p>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#1B4E8A] mb-3">פרטי הרכב</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-400">יצרן ודגם</dt><dd className="font-bold">{v.manufacturer} {v.model}</dd></div>
            <div><dt className="text-gray-400">שנה</dt><dd className="font-bold">{v.year}</dd></div>
            {v.color && <div><dt className="text-gray-400">צבע</dt><dd className="font-bold">{v.color}</dd></div>}
            {v.testExpiryDate && (
              <div><dt className="text-gray-400">טסט בתוקף עד</dt><dd className="font-bold">{new Date(v.testExpiryDate).toLocaleDateString('he-IL')}</dd></div>
            )}
            {typeof v.previousOwners === 'number' && (
              <div><dt className="text-gray-400">בעלים קודמים</dt><dd className="font-bold">{v.previousOwners}</dd></div>
            )}
          </dl>
        </section>

        {data.sections.carCheck && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-[#1B4E8A] mb-1">בדיקה מול המאגרים הממשלתיים</h2>
            <p className="text-xs text-gray-400 mb-3">נשלף עכשיו, בזמן אמת, ממאגרי משרד התחבורה</p>
            {flags === null ? (
              <p className="text-gray-400 text-sm">בודק…</p>
            ) : flags.length === 0 ? (
              <p className="text-gray-500 text-sm">לא התקבלו נתונים כרגע — נסו לרענן בעוד רגע.</p>
            ) : (
              <ul className="space-y-2">
                {flags.map((f, i) => (
                  <li key={i} className={`border rounded-xl px-4 py-3 text-sm ${FLAG_STYLES[f.level] || FLAG_STYLES.info}`}>
                    <span className="font-bold">{f.title}</span>
                    {f.detail && <span className="block text-xs mt-1 opacity-80">{f.detail}</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-400 mt-3">
              רוצים את הדוח המלא?{' '}
              <Link href={`/car-check?utm_source=salepage`} className="text-teal-600 underline">
                בדיקת רכב חינם באוטולוג
              </Link>
            </p>
          </section>
        )}

        {data.sections.treatments && data.treatments.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-[#1B4E8A] mb-3">היסטוריית טיפולים מתועדת</h2>
            <ul className="space-y-3">
              {data.treatments.map((t, i) => (
                <li key={i} className="border-r-2 border-teal-500 pr-3">
                  <p className="font-bold text-sm">{t.title}</p>
                  <p className="text-xs text-gray-500">
                    {TYPE_LABELS[t.type] || t.type}
                    {t.date ? ` · ${t.date}` : ''}
                    {t.mileage ? ` · ${t.mileage.toLocaleString()} ק"מ` : ''}
                    {t.garageName ? ` · ${t.garageName}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.hasInfocar && (
          <a
            href={`/api/sale/${token}/infocar`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-white border border-teal-300 text-teal-700 font-bold rounded-2xl py-4 hover:bg-teal-50 transition"
          >
            ×¦×¤××× ×××× ×××¡×××¨×××ª ××ª×××¢××ª (INFOCAR) ×©××¢×× ×××××¨
          </a>
        )}

        {data.sellerPhone && (
          <a
            href={`https://wa.me/972${data.sellerPhone.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent('היי, ראיתי את דף המכירה של הרכב באוטולוג ואשמח לפרטים')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-green-600 text-white font-bold rounded-2xl py-4 hover:bg-green-700 transition"
          >
            דברו עם המוכר בוואטסאפ
          </a>
        )}

        <section className="bg-[#1B4E8A] text-white rounded-2xl p-6 text-center">
          <h2 className="font-bold text-lg mb-1">קונים רכב? נהלו אותו חכם</h2>
          <p className="text-white/80 text-sm mb-4">תזכורות טסט וביטוח, מעקב טיפולים והוצאות — בחינם.</p>
          <Link
            href="/?utm_source=salepage&utm_medium=share&utm_campaign=vehicle_id"
            className="inline-block px-6 py-3 bg-white text-[#1B4E8A] font-bold rounded-xl hover:bg-gray-100 transition"
          >
            להתחיל באוטולוג — חינם
          </Link>
        </section>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        המידע הרשמי נשלף ממאגרי משרד התחבורה בזמן הצפייה · היסטוריית הטיפולים דווחה על ידי בעל הרכב
      </footer>
    </div>
  );
}
