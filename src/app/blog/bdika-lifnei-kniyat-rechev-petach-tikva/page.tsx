import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('bdika-lifnei-kniyat-rechev-petach-tikva')!;

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
          <span>מאת {post.author}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            פתח תקווה היא אחת הערים הגדולות במרכז ישראל, ויש בה מספר מכוני בדיקת רכב מצוינים. אם אתם תושבי פתח תקווה, גני תקווה, ראש העין או הסביבה — המאמר הזה ירכז עבורכם את כל המידע על מכוני בדיקה לרכב לפני קנייה.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מכוני בדיקה מומלצים בפתח תקווה</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קומפיוטסט פתח תקווה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מיקום:</strong> אזור התעשייה סגולה</li>
            <li><strong>מחיר:</strong> 660-840 ש&quot;ח</li>
            <li><strong>דירוג:</strong> 4.0+</li>
            <li><strong>שעות:</strong> א&apos;-ה&apos; 7:30-17:30, ו&apos; 7:30-12:30</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. טכנו טסט פתח תקווה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 1,300-2,100 ש&quot;ח</li>
            <li><strong>התמחות:</strong> רכבים חשמליים, היברידיים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. נבדקי רכב — סניף פתח תקווה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 640-820 ש&quot;ח</li>
            <li><strong>שירותים:</strong> בדיקה מלאה, כיווני פרונט, בדיקות חורף</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. PT Motors פתח תקווה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 620-770 ש&quot;ח (זול יחסית)</li>
            <li><strong>חניה חינם</strong></li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה בדיקה בפתח תקווה?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב פרטי:</strong> 620-840 ש&quot;ח</li>
            <li><strong>4x4 / SUV:</strong> 780-1,050 ש&quot;ח</li>
            <li><strong>חשמלי / היברידי:</strong> 850-1,150 ש&quot;ח</li>
            <li><strong>בדיקה + שמאות:</strong> 1,300-2,100 ש&quot;ח</li>
          </ul>
          <p>פתח תקווה דומה במחירים לראשון לציון, וזולה ב-10-15% מתל אביב.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">דברים מיוחדים לבדוק ברכב מפתח תקווה</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>מתלים</strong> — תושבים נוסעים הרבה בכביש 4 וכביש 5 — שחיקת מתלים מהירה</li>
            <li><strong>בלמים</strong> — תנועה צפופה במרכז העיר → שחיקה מואצת</li>
            <li><strong>קלימה</strong> — שמש חמה ופקקים = עומס על מערכת הקירור</li>
            <li><strong>תקלות חוזרות במחשב</strong> — בדקו עם סורק OBD</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך לבחור נכון</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>הזול ביותר:</strong> PT Motors</li>
            <li><strong>לחשמלי:</strong> טכנו טסט (ניסיון בסוללות)</li>
            <li><strong>שירות מקצועי:</strong> קומפיוטסט</li>
            <li><strong>תור מהיר:</strong> נבדקי רכב</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תיעוד מקצועי לרכב החדש</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog שומרת היסטוריית טיפולים, פוליסות וכל מסמכי הרכב — חינם.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">איפה הכי זול לבדוק רכב בפתח תקווה?</h3>
          <p>PT Motors מציע מחירים החל מ-340 ש&quot;ח לרכב פרטי.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם יש מכוני בדיקה פתוחים בשעות הערב?</h3>
          <p>רוב המכונים סוגרים בין 17:00-17:30. הזמינו תור עד 16:00 לכל המאוחר.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם תושבי ראש העין יבואו לפתח תקווה?</h3>
          <p>כן. הנסיעה היא 10-15 דקות וזה כמעט תמיד מהיר יותר ממכוני ראש העין.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה זמן לפני הקנייה כדאי לקבוע תור?</h3>
          <p>בעונה (קיץ) — 2-3 ימים מראש. בשאר השנה — לרוב ניתן לאותו יום.</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` } },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: 'איפה הכי זול לבדוק רכב בפתח תקווה?', acceptedAnswer: { '@type': 'Answer', text: 'PT Motors מציע מחירים החל מ-340 ש"ח לרכב פרטי.' } },
              { '@type': 'Question', name: 'האם יש מכוני בדיקה פתוחים בשעות הערב?', acceptedAnswer: { '@type': 'Answer', text: 'רוב המכונים סוגרים בין 17:00-17:30.' } },
              { '@type': 'Question', name: 'כמה זמן לפני הקנייה כדאי לקבוע תור?', acceptedAnswer: { '@type': 'Answer', text: 'בקיץ 2-3 ימים מראש. בשאר השנה לרוב ניתן לאותו יום.' } },
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/blog/bdika-lifnei-kniyat-rechev-netanya" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">בדיקה בנתניה<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
