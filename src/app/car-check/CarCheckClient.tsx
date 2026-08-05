'use client';

import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, AlertTriangle, XCircle, Info, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';

interface Flag { level: 'red' | 'orange' | 'green' | 'info'; title: string; detail: string; }
interface Report {
  plate: string;
  vehicle: { tozeret: string; kinuy: string; degem: string; shnatYitzur: number; tzeva: string; delek: string; baalut: string; tokefTest: string; aliyaLakvish: string; misgeret?: string; zmig?: string; gimur?: string; degemManoa?: string } | null;
  ownershipHistory: { dt: number; type: string }[];
  kmInfo: { km: number; avgPerYear: number } | null;
  specs?: { label: string; value: string }[];
  safety?: string[];
  checkedAt?: string;
  flags: Flag[];
  partial: boolean;
}

const LEVEL_STYLE: Record<Flag['level'], { box: string; icon: React.ReactNode; label: string }> = {
  red: { box: 'bg-red-50 border-red-300', icon: <XCircle size={22} className="text-red-600 shrink-0" />, label: 'דגל אדום' },
  orange: { box: 'bg-amber-50 border-amber-300', icon: <AlertTriangle size={22} className="text-amber-600 shrink-0" />, label: 'שימו לב' },
  green: { box: 'bg-emerald-50 border-emerald-300', icon: <ShieldCheck size={22} className="text-emerald-600 shrink-0" />, label: 'תקין' },
  info: { box: 'bg-blue-50 border-blue-200', icon: <Info size={22} className="text-blue-600 shrink-0" />, label: 'מידע' },
};

function fmtDt(dt: number): string {
  const s = String(dt);
  return s.length === 6 ? `${s.slice(4)}/${s.slice(0, 4)}` : s;
}

export default function CarCheckClient() {
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);

  async function check() {
    const clean = plate.replace(/\D/g, '');
    if (clean.length < 5) { setError('הזינו מספר רכב תקין'); return; }
    setLoading(true); setError(''); setReport(null);
    try {
      const res = await fetch(`/api/car-check?plate=${clean}`);
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'שגיאה בבדיקה'); return; }
      setReport(j);
    } catch {
      setError('שגיאה בתקשורת. נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  const reds = report?.flags.filter((f) => f.level === 'red').length || 0;
  const oranges = report?.flags.filter((f) => f.level === 'orange').length || 0;

  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
            <ChevronRight size={14} />חזרה לדף הבית
          </Link>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">בדיקת רכב לפני קנייה</h1>
          <p className="text-white/80 text-sm sm:text-base mb-8">
            מזינים מספר רכב ומקבלים בחינם דגלים אדומים מנתוני משרד התחבורה: עבר ליסינג והשכרה, ריקולים שחוסמים העברת בעלות, ק"מ בטסט האחרון ועוד.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && check()}
              inputMode="numeric"
              placeholder="מספר רכב, למשל 12345678"
              className="flex-1 px-4 py-3.5 rounded-xl text-[#122D50] text-lg font-bold text-center outline-none focus:ring-4 focus:ring-white/30"
              dir="ltr"
            />
            <button
              onClick={check}
              disabled={loading}
              className="px-6 py-3.5 bg-cream-500 hover:bg-cream-600 disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center gap-2"
            >
              <Search size={18} />{loading ? 'בודק…' : 'בדיקה'}
            </button>
          </div>
          {error && <p className="mt-4 text-amber-200 font-semibold text-sm">{error}</p>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {!report && !loading && (
          <div className="bg-white rounded-2xl p-6 text-sm text-gray-600 leading-relaxed space-y-2">
            <p className="font-bold text-[#1B4E8A] text-base">מה בודקים כאן?</p>
            <p>הבדיקה מצליבה את מספר הרכב מול מאגרי המידע הממשלתיים הפתוחים (data.gov.il) של משרד התחבורה והבטיחות בדרכים: היסטוריית בעלויות (כולל ליסינג, השכרה וסוחרים), ריקולים שלא טופלו, ירידה מהכביש, יבוא אישי, שינויי מבנה וקריאת המד בטסט האחרון.</p>
            <p className="text-gray-400">הבדיקה משלימה בדיקת קנייה במכון מוסמך — היא לא מחליפה אותה. אין במאגרים הפתוחים נתוני תאונות או שעבודים.</p>
          </div>
        )}

        {report && (
          <div className="space-y-4">
            {report.vehicle && (
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1B4E8A]">
                      {report.vehicle.tozeret} {report.vehicle.kinuy}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      שנת {report.vehicle.shnatYitzur} • {report.vehicle.tzeva} • {report.vehicle.delek} • בעלות: {report.vehicle.baalut}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">עלה לכביש: {report.vehicle.aliyaLakvish} • טסט בתוקף עד: {report.vehicle.tokefTest}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${reds > 0 ? 'bg-red-100 text-red-700' : oranges > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {reds > 0 ? `${reds} דגלים אדומים` : oranges > 0 ? `${oranges} נקודות לתשומת לב` : 'נראה נקי'}
                  </span>
                </div>
              </div>
            )}

            {report.flags.map((f, i) => (
              <div key={i} className={`rounded-2xl border p-5 flex gap-3 ${LEVEL_STYLE[f.level].box}`}>
                {LEVEL_STYLE[f.level].icon}
                <div>
                  <p className="font-bold text-[#122D50]">{f.title}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{f.detail}</p>
                </div>
              </div>
            ))}

            {report.ownershipHistory.length > 0 && (
              <div className="bg-white rounded-2xl p-6">
                <p className="font-bold text-[#1B4E8A] mb-3">שרשרת בעלויות</p>
                <div className="space-y-2">
                  {report.ownershipHistory.map((o, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 w-16">{fmtDt(o.dt)}</span>
                      <span className="font-semibold text-[#122D50]">{o.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.specs && report.specs.length > 0 && (
              <div className="bg-white rounded-2xl p-6">
                <p className="font-bold text-[#1B4E8A] mb-4">מפרט הרכב — מהמאגר הרשמי</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {report.specs.map((s, i) => (
                    <div key={i} className="bg-[#F3F6FA] rounded-xl px-3 py-2">
                      <p className="text-gray-400 text-xs">{s.label}</p>
                      <p className="font-bold text-[#122D50]">{s.value}</p>
                    </div>
                  ))}
                </div>
                {report.vehicle?.zmig && (
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    צמיגים: {report.vehicle.zmig}{report.vehicle.degemManoa ? ` • דגם מנוע: ${report.vehicle.degemManoa}` : ''}{report.vehicle.gimur ? ` • רמת גימור: ${report.vehicle.gimur}` : ''}{report.vehicle.misgeret ? ` • שלדה: ${report.vehicle.misgeret}` : ''}
                  </p>
                )}
                {report.safety && report.safety.length > 0 && (
                  <div className="mt-4">
                    <p className="font-bold text-[#1B4E8A] text-sm mb-2">מערכות בטיחות מהיצרן</p>
                    <div className="flex flex-wrap gap-2">
                      {report.safety.map((s, i) => (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-3">קניתם? נהלו את הרכב באוטולוג</h3>
              <p className="text-white/80 mb-5 text-sm">סורקים את רישיון הרכב — ומקבלים תזכורות טסט וביטוח, מעקב טיפולים והוצאות. בחינם.</p>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
                התחילו בחינם
                <ArrowLeft size={16} />
              </Link>
            </div>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-teal-800 mb-2">רוצים גם היסטוריית תביעות ביטוח?</h3>
            <p className="text-teal-700 text-sm mb-2">הדוח שלנו מבוסס על המאגרים הממשלתיים הפתוחים — והם אינם כוללים תאונות. את היסטוריית התביעות (תאונות, גניבות וירידת ערך, 7 שנים אחורה) אפשר להשלים במאגר INFOCAR של מרכז הסליקה של חברות הביטוח, בעלות של 12 ₪.</p>
            <p className="text-teal-700 text-xs mb-4">שימו לב: את הדוח מפיק בעל הרכב או מי שהוסמך מטעמו. קונים? בקשו מהמוכר להפיק ולשתף אתכם.</p>
            <a href="https://infocar.co.il/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition">
              לבדיקת היסטוריית תביעות ב-INFOCAR
            </a>
            <p className="text-xs text-teal-700 mt-3">
              עוד טפסים וקישורים רשמיים למכירת רכב —{' '}
              <a href="/car-sale-docs" className="underline font-bold">במדריך המלא</a>
            </p>
          </div>

            <div className="text-xs text-gray-400 leading-relaxed space-y-1">
              <p>
                מקור המידע: מאגרי משרד התחבורה והבטיחות בדרכים, מתוך אתר מאגרי המידע הממשלתיים{' '}
                <a href="https://data.gov.il" target="_blank" rel="noopener noreferrer" className="underline">data.gov.il</a>
                {report.checkedAt ? ` (נשלף ב־${new Date(report.checkedAt).toLocaleDateString('he-IL')})` : ''}.
                {' '}המאגרים מתעדכנים על ידי המדינה, רובם מדי יום.
              </p>
              <p>
                המידע מוצג כפי שהוא (as is) וייתכנו בו טעויות, פערים או עיכובי עדכון; בכל מקרה של סתירה גובר הרישום הרשמי במשרד התחבורה. הדוח אינו כולל פרטים מזהים של בעלי הרכב. השירות אינו פועל מטעם משרד התחבורה או מדינת ישראל ואינו זוכה לחסותם. הבדיקה אינה מחליפה בדיקת קנייה במכון מוסמך ואינה מהווה ייעוץ מקצועי או המלצה. {report.partial && 'חלק מהמאגרים לא היו זמינים בבדיקה זו.'}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm mt-8">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
