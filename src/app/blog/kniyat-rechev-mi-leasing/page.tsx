import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('kniyat-rechev-mi-leasing')!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `https://autolog.click/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    authors: [post.author],
    locale: 'he_IL',
    siteName: 'אוטולוג',
    images: ogImageForPost(post.slug),
  },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
            <ChevronRight size={14} />חזרה לבלוג
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">{post.category}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B4E8A] leading-tight mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{post.readingTime}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            שוק היד השנייה בישראל מוצף ברכבי ליסינג בני שלוש במחירים שנראים טובים מכדי להיות אמיתיים — זולים ב-10-20% מרכב פרטי מקביל. יש סיבה למחיר, ויש גם דרך לקנות חכם. המדריך המלא.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">למה רכב ליסינג זול יותר?</h2>
          <p>
            חברות הליסינג מוכרות אלפי רכבים בכל חודש בסוף תקופת החכירה, והשוק יודע שמדובר ברכבים שנסעו הרבה ועברו הרבה ידיים. הביקוש הנמוך יותר מתורגם למחיר נמוך יותר — וזה בדיוק המקום שבו קונה מיודע יכול לעשות עסקה מצוינת, וקונה תמים יכול ליפול.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">היתרונות האמיתיים</h2>
          <ul className="list-disc pr-5 space-y-2">
            <li>טיפולים לפי ספר, בזמן, במוסך מורשה — חברות ליסינג לא מדלגות על טיפולים, והכול מתועד במחשב.</li>
            <li>מחיר כניסה נמוך משמעותית מרכב פרטי מקביל.</li>
            <li>שקיפות: היסטוריית הטיפולים והתאונות זמינה מהחברה, בניגוד למוכר פרטי שיכול להסתיר.</li>
            <li>בלי סיפורי בעלות מפוקפקים — הבעלים הרשום הוא חברה מסודרת.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">החסרונות והסיכונים</h2>
          <ul className="list-disc pr-5 space-y-2">
            <li>קילומטראז' גבוה: רכב ליסינג עושה בממוצע 30-40 אלף ק"מ בשנה — פי שניים מרכב פרטי.</li>
            <li>ריבוי נהגים: ברכבי מאגר (פול) נהגו עשרות עובדים שלא שילמו על התיקונים מכיסם.</li>
            <li>בלאי פנים מואץ: ריפודים, לוח מחוונים ותא מטען שראו שימוש אינטנסיבי.</li>
            <li>ערך מכירה עתידי נמוך יותר — הסטיגמה תלווה את הרכב גם כשתמכרו אותו.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מה חובה לבדוק לפני קנייה?</h2>
          <ul className="list-disc pr-5 space-y-2">
            <li>לדרוש את היסטוריית הטיפולים המלאה מחברת הליסינג — אם מסרבים, ללכת.</li>
            <li>בדיקת קנייה במכון מוסמך (350-600 ש"ח) — לא לוותר עליה גם אם הרכב נראה מצוין.</li>
            <li>לברר אם הרכב היה צמוד לנהג אחד (עדיף) או רכב מאגר.</li>
            <li>לבדוק מצב צמיגים, בלמים ומצבר — החלפות קרובות הן כלי מיקוח של אלפי שקלים.</li>
            <li>להשוות את המחיר למחירון: הנחת ליסינג אמיתית היא 10-20% ממחיר רכב פרטי מקביל.</li>
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-amber-800 mb-2">כלל אצבע לעסקה טובה:</p>
            <div className="text-amber-700 text-sm space-y-1">
              <p>היסטוריית טיפולים מלאה ומתועדת + בדיקת מכון נקייה + הנחה של 12% לפחות ממחירון רכב פרטי מקביל.</p>
              <p className="font-bold pt-2">חסר אחד מהשלושה? תמשיכו לרכב הבא.</p>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-teal-800 mb-2">בודקים רכב שיוצא מליסינג? עשו את זה בקליק:</p>
            <p className="text-teal-700 text-sm mb-4">בדיקת רכב לפני קנייה של אוטולוג שולפת לפי מספר הרכב את היסטוריית הבעלויות, הק"מ, הריקולים ומפרט הבטיחות — ישירות ממאגרי משרד התחבורה, בחינם.</p>
            <Link href="/car-check" className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition">
              לבדיקת רכב לפני קנייה ←
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">אז כדאי או לא?</h2>
          <p>
            כדאי — בתנאים. רכב ליסינג שהיה צמוד לנהג יחיד, עם היסטוריה מלאה ובדיקת מכון נקייה, במחיר שמשקף את הקילומטראז', הוא לרוב עסקה טובה יותר מרכב פרטי עם עבר מעורפל. רכב מאגר עם 140 אלף ק"מ שמתומחר כמו פרטי — זו לא מציאה, זו מלכודת.
          </p>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">קניתם? תעבירו את הרכב לאוטולוג</h3>
            <p className="text-white/80 mb-5 text-sm">סורקים את רישיון הרכב עם המצלמה — והרכב נטען אוטומטית עם תזכורות טסט, ביטוח וטיפולים. בחינם.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
              הוסיפו רכב בחינם
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Article',
          headline: post.title, description: post.description,
          datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
          author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
          publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
        })}} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog/bdika-lifnei-kniyat-rechev-tel-aviv" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />בדיקה לפני קנייה בתל אביב
          </Link>
          <Link href="/blog/haavarat-baalut-al-rechev-2026" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            העברת בעלות על רכב
            <ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
