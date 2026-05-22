import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('bdika-lifnei-kniyat-rechev-netanya')!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: { title: post.title, description: post.description, url: `https://autolog.click/blog/${post.slug}`, type: 'article', publishedTime: post.publishedAt, authors: [post.author], locale: 'he_IL', siteName: 'AutoLog' },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#fef7ed]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1"><ChevronRight size={14} />חזרה לבלוג</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">{post.category}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e3a5f] leading-tight mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{post.readingTime}</span>
          <span>מאת {post.author}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            נתניה היא העיר השביעית בגודלה בישראל, ובה ובסביבה (השרון, הוד השרון, רעננה, כפר סבא) פעילים מספר מכוני בדיקה ברמה גבוהה. במאמר תמצאו את כל מה שצריך לדעת לפני קניית רכב יד שנייה באזור.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מכוני בדיקה מומלצים בנתניה והשרון</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קומפיוטסט נתניה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מיקום:</strong> אזור התעשייה פולג</li>
            <li><strong>מחיר:</strong> 650-830 ש&quot;ח</li>
            <li><strong>דירוג:</strong> 4.0+</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. טכנו טסט נתניה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 680-870 ש&quot;ח</li>
            <li><strong>התמחות:</strong> חשמלי, היברידי</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. מבדק נתניה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 620-790 ש&quot;ח</li>
            <li><strong>שירות:</strong> בדיקה + שמאות בחבילה</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. מכון בדיקה כפר סבא (אלטרנטיבה קרובה)</h3>
          <p>תושבי כפר סבא, הוד השרון ורעננה — שווה לבדוק גם את המכון בכפר סבא. 10-15 דקות נסיעה מנתניה.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה בנתניה?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב פרטי:</strong> 620-830 ש&quot;ח</li>
            <li><strong>4x4 / SUV:</strong> 780-1,050 ש&quot;ח</li>
            <li><strong>חשמלי / היברידי:</strong> 850-1,150 ש&quot;ח</li>
            <li><strong>בדיקה + שמאות:</strong> 1,300-2,100 ש&quot;ח</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">דברים מיוחדים לבדוק ברכב מנתניה</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>חלודה</strong> — קרבה לים גורמת לקורוזיה מהירה יותר</li>
            <li><strong>מערכת קירור</strong> — נתניה חמה ולחה בקיץ</li>
            <li><strong>מתלים</strong> — כביש 2 (החוף) שוחק במהירות</li>
            <li><strong>פנסים</strong> — אבק וחול מהים מצטברים בעדשות</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">המלצות לפי קריטריון</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>הכי זול:</strong> מבדק נתניה (340 ש&quot;ח)</li>
            <li><strong>הכי מקצועי:</strong> קומפיוטסט נתניה</li>
            <li><strong>לחשמלי:</strong> טכנו טסט</li>
            <li><strong>חבילת שמאות:</strong> מבדק נתניה</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תיעוד מלא לרכב החדש</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog שומרת את הדוח, פוליסות וטיפולים — חינם.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">הרשמה בחינם<ArrowLeft size={16} /></Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>
          <h3 className="text-lg font-bold text-[#1e3a5f]">איפה הכי זול בנתניה?</h3>
          <p>מבדק נתניה — סביב 620-790 ש&quot;ח לרכב פרטי.</p>
          <h3 className="text-lg font-bold text-[#1e3a5f]">האם תושבי הוד השרון יבואו לנתניה?</h3>
          <p>לרוב כפר סבא יותר נוחה — 10 דקות בלי פקקים.</p>
          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה לוקחת בדיקה בנתניה?</h3>
          <p>60-90 דקות לבדיקה רגילה.</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` } },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: 'איפה הכי זול לבדוק רכב בנתניה?', acceptedAnswer: { '@type': 'Answer', text: 'מבדק נתניה — סביב 620-790 ש"ח.' } },
              { '@type': 'Question', name: 'כמה זמן לוקחת בדיקה?', acceptedAnswer: { '@type': 'Answer', text: '60-90 דקות לבדיקה רגילה.' } },
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/blog/bdika-lifnei-kniyat-rechev-beer-sheva" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">בדיקה בבאר שבע<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
