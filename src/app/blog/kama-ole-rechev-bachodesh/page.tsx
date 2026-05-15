import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

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
  },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#fef7ed]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
            <ChevronRight size={14} />חזרה לבלוג
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">{post.category}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e3a5f] leading-tight mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{post.readingTime}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            רוב בעלי הרכב בישראל מפתיעים לגלות שהרכב שלהם עולה להם הרבה יותר ממה שהם חושבים.
            דלק זה רק ההתחלה — יש ביטוח, טסט, תחזוקה, צמיגים, חנייה ועוד. בואו נפרק את המספרים.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">ההוצאות שכולם יודעים עליהן</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">דלק — 800-1,500 ש"ח/חודש</h3>
          <p>
            הוצאת הדלק תלויה בסוג הרכב, סוג הנהיגה (עיר/כביש בינעירוני) וכמות הקילומטרים.
            נהג ממוצע בישראל נוסע כ-15,000 ק"מ בשנה, מה שמתרגם ל-800-1,500 ש"ח בחודש על דלק.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">ביטוח — 250-600 ש"ח/חודש</h3>
          <p>
            ביטוח מקיף לרכב ממוצע עולה 3,000-7,000 ש"ח בשנה. ביטוח חובה הוא בנוסף — כ-1,200-1,800 ש"ח בשנה.
            ביחד, מדובר ב-350-700 ש"ח בחודש.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">טסט — כ-25 ש"ח/חודש</h3>
          <p>
            הטסט עולה 250-350 ש"ח בשנה, מה שיוצא כ-25 ש"ח בחודש. זה נשמע מעט, אבל כשמצטרף לכל השאר — זה מצטבר.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">ההוצאות שמפספסים</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">טיפולים ותחזוקה — 200-500 ש"ח/חודש</h3>
          <p>
            החלפת שמן כל 10,000-15,000 ק"מ, פילטרים, בלמים, צמיגים — כל אלה מצטברים ל-2,500-6,000 ש"ח בשנה.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">פחת (ירידת ערך) — 500-1,500 ש"ח/חודש</h3>
          <p>
            זו ההוצאה ה"נסתרת" הגדולה ביותר. רכב חדש מאבד 15-25% מערכו בשנה הראשונה.
            רכב שנקנה ב-150,000 ש"ח יכול לאבד 30,000 ש"ח בשנה — 2,500 ש"ח בחודש!
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">חנייה ודוחות — 100-400 ש"ח/חודש</h3>
          <p>
            חנייה בתל אביב יכולה לעלות 300-600 ש"ח בחודש. דוחות חנייה ומהירות מוסיפים עוד.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-amber-800 mb-2">סיכום: כמה הרכב באמת עולה?</p>
            <div className="text-amber-700 text-sm space-y-1">
              <p>דלק: 1,000 ש"ח | ביטוח: 450 ש"ח | טסט: 25 ש"ח | תחזוקה: 350 ש"ח</p>
              <p>פחת: 1,000 ש"ח | חנייה: 200 ש"ח | אגרה: 80 ש"ח</p>
              <p className="font-bold text-lg pt-2">סה"כ ממוצע: כ-3,100 ש"ח בחודש</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך לחסוך?</h2>
          <p>הצעד הראשון לחיסכון הוא לדעת כמה באמת מוציאים. ואלה כמה טיפים:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>מעקב אחרי כל הוצאה — AutoLog עושה את זה אוטומטית</li>
            <li>השוואת מחירי ביטוח כל שנה — ההבדלים יכולים להגיע לאלפי שקלים</li>
            <li>לא לדחות טיפולים — טיפול מונע זול בהרבה מתיקון חירום</li>
            <li>בדיקת לחץ אוויר בצמיגים — חוסכת 5-10% בדלק</li>
            <li>שקילת מעבר לרכב חשמלי/היברידי — חיסכון של 50-70% בדלק</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תדעו בדיוק כמה הרכב עולה</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog עוקבת אחרי כל הוצאה ומראה בדיוק לאן הכסף הולך.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
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

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
