import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('kama-ole-rechev-bachodesh')!;

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
            רוב בעלי הרכב בישראל מפתיעים לגלות שהרכב שלהם עולה להם הרבה יותר ממה שהם חושבים.
            דלק זה רק ההתחלה — יש ביטוח, טסט, תחזוקה, צמיגים, חנייה ועוד. בואו נפרק את המספרים.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">ההוצאות שכולם יודעים עליהן</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A]">דלק — 800-1,500 ש"ח/חודש</h3>
          <p>
            הוצאת הדלק תלויה בסוג הרכב, סוג הנהיגה (עיר/כביש בינעירוני) וכמות הקילומטרים.
            נהג ממוצע בישראל נוסע כ-15,000 ק"מ בשנה, מה שמתרגם ל-800-1,500 ש"ח בחודש על דלק.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">ביטוח — 400-1,000 ש"ח/חודש</h3>
          <p>
            ביטוח מקיף לרכב ממוצע עולה 4,000-9,000 ש"ח בשנה (לרכבי יוקרה: 8,000-15,000 ש"ח). ביטוח חובה הוא בנוסף — כ-1,200-2,000 ש"ח בשנה.
            ביחד, מדובר ב-450-1,000 ש"ח בחודש לרכב משפחתי, ועד 1,500 ש"ח לרכב יוקרה.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">טסט — כ-30 ש"ח/חודש</h3>
          <p>
            הטסט עולה 220-360 ש"ח בשנה (תלוי באזור ובמכון), מה שיוצא כ-25-30 ש"ח בחודש. זה נשמע מעט, אבל כשמצטרף לכל השאר — זה מצטבר.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">ההוצאות שמפספסים</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A]">טיפולים ותחזוקה — 400-900 ש"ח/חודש</h3>
          <p>
            החלפת שמן כל 10,000-15,000 ק"מ (450-900 ש"ח לטיפול), פילטרים, בלמים (1,200-2,500 ש"ח לסט), צמיגים (1,800-4,500 ש"ח לסט מלא) — כל אלה מצטברים ל-5,000-11,000 ש"ח בשנה לרכב משפחתי. רכבי יוקרה יותר.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">פחת (ירידת ערך) — 500-1,500 ש"ח/חודש</h3>
          <p>
            זו ההוצאה ה"נסתרת" הגדולה ביותר. רכב חדש מאבד 15-25% מערכו בשנה הראשונה.
            רכב שנקנה ב-150,000 ש"ח יכול לאבד 30,000 ש"ח בשנה — 2,500 ש"ח בחודש!
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">חנייה ודוחות — 100-600 ש"ח/חודש</h3>
          <p>
            חנייה שמורה בבניין בתל אביב יכולה לעלות 500-1,200 ש"ח בחודש. דוחות חנייה ומהירות מוסיפים עוד.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-amber-800 mb-2">סיכום: כמה הרכב באמת עולה?</p>
            <div className="text-amber-700 text-sm space-y-1">
              <p>דלק: 1,100 ש"ח | ביטוח: 650 ש"ח | טסט: 30 ש"ח | תחזוקה: 600 ש"ח</p>
              <p>פחת: 1,200 ש"ח | חנייה: 300 ש"ח | אגרה: 150 ש"ח</p>
              <p className="font-bold text-lg pt-2">סה"כ ממוצע: כ-4,000 ש"ח בחודש (רכב משפחתי)</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">איך לחסוך?</h2>
          <p>הצעד הראשון לחיסכון הוא לדעת כמה באמת מוציאים. ואלה כמה טיפים:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>מעקב אחרי כל הוצאה — AutoLog עושה את זה אוטומטית</li>
            <li>השוואת מחירי ביטוח כל שנה — ההבדלים יכולים להגיע לאלפי שקלים</li>
            <li>לא לדחות טיפולים — טיפול מונע זול בהרבה מתיקון חירום</li>
            <li>בדיקת לחץ אוויר בצמיגים — חוסכת 5-10% בדלק</li>
            <li>שקילת מעבר לרכב חשמלי/היברידי — חיסכון של 50-70% בדלק</li>
          </ul>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תדעו בדיוק כמה הרכב עולה</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog עוקבת אחרי כל הוצאה ומראה בדיוק לאן הכסף הולך.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
              התחילו מעקב בחינם
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
          <Link href="/blog/matai-hatest-shel-harechev-sheli" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />מתי הטסט שלי?
          </Link>
          <Link href="/blog/checklist-lifnei-test" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            צ&apos;קליסט לפני טסט
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
