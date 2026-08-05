import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'מכירת רכב: כל הטפסים והקישורים הרשמיים במקום אחד (2026) | אוטולוג',
  description:
    'ייפוי כוח לאדם פרטי ולתאגיד, העברת בעלות מקוונת, בדיקת שעבודים ברשם המשכונות והיסטוריית תביעות ביטוח — כל הקישורים הרשמיים למכירת רכב, עם הסבר קצר מתי צריך כל אחד.',
  alternates: { canonical: '/car-sale-docs' },
  openGraph: {
    title: 'מכירת רכב: כל הטפסים והקישורים הרשמיים במקום אחד',
    url: 'https://autolog.click/car-sale-docs',
    type: 'article',
    images: [{ url: '/og/car-sale-docs.png', width: 1200, height: 630 }],
  },
};

const DOCS = [
  {
    title: 'טופס ייפוי כוח — אדם פרטי',
    href: 'https://www.gov.il/he/service/ownership-vehicles-transfer',
    source: 'משרד התחבורה',
    desc: 'כשמישהו אחר מבצע עבורכם פעולה במרשם כלי הרכב — העברת בעלות, חידוש רישיון או כל פעולה במשרד הרישוי או בדואר. ממלאים, חותמים, ומצרפים צילום תעודת זהות. להורדה: בתחתית עמוד השירות, בקטע "קבצים מצורפים".',
  },
  {
    title: 'טופס ייפוי כוח — תאגיד',
    href: 'https://www.gov.il/he/service/ownership-vehicles-transfer',
    source: 'משרד התחבורה',
    desc: 'לרכב הרשום על שם חברה או עמותה. נדרש אישור עורך דין או רואה חשבון על מורשי החתימה בתאגיד ועל תוקף החתימה. להורדה: בתחתית עמוד השירות, בקטע "קבצים מצורפים".',
  },
  {
    title: 'העברת בעלות מקוונת',
    href: 'https://www.gov.il/he/service/ownership-vehicles-transfer',
    source: 'gov.il — השירות הרשמי',
    desc: 'המוכר והקונה מעבירים בעלות מהבית, בלי תור בדואר: מזדהים באזור האישי הממשלתי, משלמים אגרה, והרישום מתעדכן. עובד לרכב פרטי על שם אדם, חברה או סוחר.',
  },
  {
    title: 'עיון בשעבודים ומשכונות',
    href: 'https://www.gov.il/he/service/pawn_perusal',
    source: 'רשם המשכונות, משרד המשפטים',
    desc: 'חובה לכל קונה: בדיקה מקוונת שהרכב לא ממושכן לבנק או לחברת מימון לפני שמעבירים שקל. הבדיקה לפי מספר רכב ותעודת זהות של המוכר, באגרה סמלית.',
  },
  {
    title: 'היסטוריית תביעות ביטוח (INFOCAR)',
    href: 'https://infocar.co.il/',
    source: 'מרכז הסליקה של חברות הביטוח',
    desc: 'דוח רשמי על תביעות ששולמו ב-7 השנים האחרונות: תאונות, אובדן גמור, גניבות וירידת ערך. עולה 12 ₪ ומופק על ידי בעל הרכב — קונים, בקשו מהמוכר להפיק ולשתף.',
  },
];

export default function CarSaleDocsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-[#1B4E8A] text-white py-10 px-4 text-center">
        <p className="text-sm text-white/70 mb-2">
          <Link href="/" className="underline">אוטולוג</Link> · מדריך חינם
        </p>
        <h1 className="text-3xl font-bold max-w-2xl mx-auto">
          מכירת רכב: כל הטפסים והקישורים הרשמיים במקום אחד
        </h1>
        <p className="text-white/80 mt-3 max-w-xl mx-auto text-sm">
          ייפוי כוח, העברת בעלות, בדיקת שעבודים והיסטוריית תביעות — בלי לחפש בעשרה אתרים. קישורים רשמיים בלבד, מעודכן 2026.
        </p>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {DOCS.map((d, i) => (
          <section key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <a
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-teal-600 underline"
            >
              {d.title}
            </a>
            <p className="text-xs text-gray-400 mt-0.5">{d.source}</p>
            <p className="text-sm text-gray-600 mt-2">{d.desc}</p>
          </section>
        ))}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#1B4E8A] mb-3">איך מוכרים רכב נכון — בקצרה</h2>
          <ol className="list-decimal pr-5 space-y-2 text-sm text-gray-600">
            <li>המוכר מכין שקיפות מלאה: דף מכירה עם נתונים רשמיים והיסטוריית טיפולים, ודוח תביעות מ-INFOCAR.</li>
            <li>הקונה בודק: שעבודים ברשם המשכונות ובדיקת רכב לפי מספר רישוי.</li>
            <li>סוגרים מחיר ומעבירים בעלות אונליין — בלי תור, עם תעודת זהות וכרטיס אשראי.</li>
            <li>אם מישהו אחר מטפל בניירת — ממלאים ייפוי כוח (פרטי או תאגיד).</li>
          </ol>
        </section>

        <section className="bg-teal-50 border border-teal-200 rounded-2xl p-6">
          <h2 className="font-bold text-teal-800 mb-1">מוכרים רכב? צרו דף מכירה שקוף באוטולוג</h2>
          <p className="text-sm text-teal-700 mb-4">
            נתונים רשמיים ממשרד התחבורה, היסטוריית הטיפולים שתיעדתם וכפתור יצירת קשר — בקישור אחד ששולחים לקונים בוואטסאפ. חינם.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/user/sell?utm_source=sale_docs"
              className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition text-sm"
            >
              צרו דף מכירה לרכב
            </Link>
            <Link
              href="/car-check?utm_source=sale_docs"
              className="px-5 py-2.5 bg-white text-teal-700 border border-teal-300 font-bold rounded-xl hover:bg-teal-100 transition text-sm"
            >
              בדיקת רכב לפני קנייה — חינם
            </Link>
          </div>
        </section>

        <p className="text-xs text-gray-400 pb-6">
          הקישורים מובילים למקורות הרשמיים (gov.il ומרכז הסליקה) והטפסים עשויים להתעדכן בהם מעת לעת. המידע בעמוד זה אינו ייעוץ משפטי.
        </p>
      </main>
    </div>
  );
}
