'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SalePageCard from '@/components/SalePageCard';

type Vehicle = {
  id: string;
  nickname: string | null;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
};

export default function SellPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => (r.ok ? r.json() : { vehicles: [] }))
      .then((d) => setVehicles(d.vehicles ?? []))
      .catch(() => setVehicles([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-24" dir="rtl">
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-1">מכירת רכב</h1>
        <p className="text-sm text-gray-500 mb-4">
          דף מכירה משותף לכל רכב: נתונים רשמיים, היסטוריית טיפולים ויצירת קשר — שקיפות שמוכרת מהר יותר ובמחיר טוב יותר.
        </p>

        {vehicles === null ? (
          <p className="text-gray-400 text-sm">טוען…</p>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-500 mb-3">עוד אין רכבים בחשבון.</p>
            <Link href="/user/vehicles" className="text-teal-600 font-bold underline">
              הוסיפו רכב
            </Link>
          </div>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="mb-2">
              <h2 className="font-bold text-gray-700 mt-4">
                {v.nickname || `${v.manufacturer} ${v.model}`} · {v.year}
              </h2>
              <SalePageCard vehicleId={v.id} label={`${v.manufacturer} ${v.model} ${v.year}`} />
            </div>
          ))
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-6">
          <h2 className="font-bold text-gray-800 mb-1">מסמכים וכלים רשמיים למכירה</h2>
          <p className="text-xs text-gray-400 mb-4">
            קישורים רשמיים בלבד — משרד התחבורה, רשם המשכונות ומרכז הסליקה של חברות הביטוח
          </p>
          <ul className="space-y-4 text-sm">
            <li>
              <a
                href="https://www.gov.il/he/service/ownership-vehicles-transfer"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-teal-600 underline"
              >
                טופס ייפוי כוח — אדם פרטי
              </a>
              <p className="text-xs text-gray-500 mt-0.5">
                כשמישהו אחר מבצע עבורכם את פעולת הרישוי — במשרד הרישוי או בדואר · הורדה בקטע "קבצים מצורפים"
              </p>
            </li>
            <li>
              <a
                href="https://www.gov.il/he/service/ownership-vehicles-transfer"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-teal-600 underline"
              >
                טופס ייפוי כוח — תאגיד
              </a>
              <p className="text-xs text-gray-500 mt-0.5">
                לרכב על שם חברה — בצירוף אישור עו״ד או רו״ח על מורשי החתימה · הורדה בקטע "קבצים מצורפים"
              </p>
            </li>
            <li>
              <a
                href="https://www.gov.il/he/service/ownership-vehicles-transfer"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-teal-600 underline"
              >
                העברת בעלות מקוונת (gov.il)
              </a>
              <p className="text-xs text-gray-500 mt-0.5">
                השירות הרשמי — המוכר והקונה מעבירים בעלות מהבית, עם תעודת זהות וכרטיס אשראי
              </p>
            </li>
            <li>
              <a
                href="https://www.gov.il/he/service/pawn_perusal"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-teal-600 underline"
              >
                עיון בשעבודים ומשכונות (רשם המשכונות)
              </a>
              <p className="text-xs text-gray-500 mt-0.5">
                לקונים: ודאו שהרכב נקי משעבוד לפני שמשלמים — בדיקה מקוונת באגרה סמלית
              </p>
            </li>
            <li>
              <a
                href="https://infocar.co.il/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-teal-600 underline"
              >
                היסטוריית תביעות ביטוח (INFOCAR)
              </a>
              <p className="text-xs text-gray-500 mt-0.5">
                דוח תאונות, גניבות וירידת ערך ממרכז הסליקה — 12 ₪, מופק על ידי בעל הרכב
              </p>
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4 pt-3 border-t border-gray-100">
            וגם באוטולוג:{' '}
            <Link href="/user/vehicles/transfer" className="text-teal-600 underline">העברת בעלות</Link>
            {' '}·{' '}
            <Link href="/car-check" className="text-teal-600 underline">בדיקת רכב לפני קנייה</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
