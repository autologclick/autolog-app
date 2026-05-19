import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('bdika-lifnei-kniyat-rechev-beer-sheva')!;

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
            באר שבע היא בירת הנגב, ובה ובסביבה (אופקים, נתיבות, דימונה) פועלים מספר מכוני בדיקה לרכב. המאמר מסכם את הכל — מחירים, מכונים מומלצים, ומה לבדוק ברכב מהדרום.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מכוני בדיקה מומלצים בבאר שבע</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קומפיוטסט באר שבע</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 320-400 ש&quot;ח</li>
            <li><strong>דירוג:</strong> 4.0+</li>
            <li><strong>מיקום:</strong> אזור התעשייה</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. טכנו טסט באר שבע</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 350-430 ש&quot;ח</li>
            <li><strong>התמחות:</strong> בדיקות מקיפות</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. PT Motors באר שבע</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 300-380 ש&quot;ח (הזול ביותר)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה בבאר שבע?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב פרטי:</strong> 300-430 ש&quot;ח (הזול בארץ!)</li>
            <li><strong>4x4 / SUV:</strong> 380-490 ש&quot;ח</li>
            <li><strong>חשמלי:</strong> 400-520 ש&quot;ח</li>
          </ul>
          <p>באר שבע היא לרוב הזולה ביותר בישראל — חיסכון של 50-150 ש&quot;ח לעומת מרכז.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">דברים מיוחדים לבדוק ברכב מהדרום</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>חול ואבק במנוע</strong> — בעיה נפוצה בכל הדרום. מסנן אוויר חייב להיות תקין</li>
            <li><strong>מערכת מיזוג</strong> — מתישה מהקיץ הקיצוני (45°+)</li>
            <li><strong>צמיגים</strong> — מתחממים מהיר, שחיקה מואצת</li>
            <li><strong>צבע</strong> — שמש חזקה דוהה מהר יותר</li>
            <li><strong>חיישנים</strong> — חול גורם לבלאי</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">המלצות</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>הזול ביותר:</strong> PT Motors (300 ש&quot;ח)</li>
            <li><strong>איכות מקצועית:</strong> קומפיוטסט באר שבע</li>
            <li><strong>תור מהיר:</strong> טכנו טסט</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תיעוד מקצועי לרכב החדש</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog שומרת את כל המסמכים — חינם וללא הורדה.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">הרשמה בחינם<ArrowLeft size={16} /></Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>
          <h3 className="text-lg font-bold text-[#1e3a5f]">למה זה זול בבאר שבע?</h3>
          <p>תחרות גבוהה, שכר דירה נמוך למוסכים, וקהל לקוחות פחות גדול = מחירים נמוכים.</p>
          <h3 className="text-lg font-bold text-[#1e3a5f]">תושבי דימונה / אופקים — לאן לנסוע?</h3>
          <p>קומפיוטסט או PT Motors בבאר שבע. 20-30 דקות נסיעה.</p>
          <h3 className="text-lg font-bold text-[#1e3a5f]">האם פתוחים בקיץ?</h3>
          <p>כן, אבל מומלץ להזמין תור לבוקר (לפני 10:00) — ההמתנה בצהריים בקיץ הנגבי לא נעימה.</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` } },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: 'למה זה זול בבאר שבע?', acceptedAnswer: { '@type': 'Answer', text: 'תחרות גבוהה ושכר דירה נמוך = מחירים נמוכים.' } },
              { '@type': 'Question', name: 'איפה הכי זול בבאר שבע?', acceptedAnswer: { '@type': 'Answer', text: 'PT Motors מציע מחירים החל מ-300 ש"ח.' } },
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/blog/mechoney-bdika-cholon" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">מכוני בדיקה בחולון<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
