import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('bdika-lifnei-kniyat-rechev-haifa')!;

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
    siteName: 'AutoLog',
  },
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
            קונים רכב יד שנייה בחיפה או בקריות? בדיקה מקצועית במכון לפני הקנייה היא ההגנה הכי חשובה שלכם.
            במאמר תמצאו את כל מכוני הבדיקה המומלצים בחיפה והסביבה, השוואת מחירים, ומה לבדוק לפני שמשלמים.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">למה בדיקה במכון בחיפה חשובה במיוחד?</h2>
          <p>
            רכב שנהג בחיפה והקריות חווה תנאים ייחודיים: <strong>אוויר ים מלוח</strong> שמאיץ קורוזיה,
            <strong> דרכים תלולות</strong> ששוחקות בלמים וגיר, ו<strong>פקקים יומיומיים</strong> ב&quot;כביש 22&quot; ו&quot;כביש 4&quot;
            שמעמיסים על המנוע. בדיקה מקצועית תזהה בעיות שמצטברות בגלל התנאים האלה.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מכוני בדיקה מומלצים בחיפה והסביבה</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קומפיוטסט חיפה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מיקום:</strong> אזור התעשייה חיפה</li>
            <li><strong>דירוג Google:</strong> 4.0+</li>
            <li><strong>מחיר בדיקה לפני קנייה:</strong> 360-440 ש&quot;ח</li>
            <li><strong>שעות:</strong> א&apos;-ה&apos; 7:30-17:00, ו&apos; 7:30-12:30</li>
            <li><strong>התמחות:</strong> רכבים פרטיים, יוקרה, היברידיים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. טכנו טסט חיפה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 380-460 ש&quot;ח</li>
            <li><strong>התמחות:</strong> רכבים חשמליים — בדיקת סוללה</li>
            <li><strong>חניה זמינה</strong></li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. דינמומטר חיפה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>ותק:</strong> מעל 50 שנה</li>
            <li><strong>מחיר:</strong> 340-420 ש&quot;ח</li>
            <li><strong>התמחות:</strong> בדיקות מקיפות, שמאות</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. מבדק קריות (לתושבי הקריות)</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מיקום:</strong> קרית אתא / קרית מוצקין</li>
            <li><strong>מחיר:</strong> 320-400 ש&quot;ח (זול יחסית)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה בדיקת רכב לפני קנייה בחיפה?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב פרטי:</strong> 340-440 ש&quot;ח</li>
            <li><strong>4x4 / SUV:</strong> 420-520 ש&quot;ח</li>
            <li><strong>חשמלי / היברידי:</strong> 440-580 ש&quot;ח</li>
            <li><strong>בדיקה + שמאות:</strong> 700-900 ש&quot;ח</li>
          </ul>
          <p>חיפה בדרך כלל זולה ב-5-15% מתל אביב.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">דברים מיוחדים לבדוק ברכב מחיפה</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>קורוזיה ותחתית</strong> — בגלל אוויר הים, רכבים מהקריות נוטים לחלודה מהירה</li>
            <li><strong>בלמים</strong> — דרכים תלולות שוחקות מהר את הדיסקיות</li>
            <li><strong>גיר</strong> — תמרונים תכופים בעיר העתיקה ובוואדי ניסנס</li>
            <li><strong>מערכת קירור</strong> — קיץ חם בחיפה מעמיס על המנוע</li>
            <li><strong>צמיגים</strong> — שחיקה לא אחידה מהדרכים ההרריות</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך לבחור מכון נכון</h2>
          <p>
            <strong>לפי קריטריון:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>הזול ביותר:</strong> מבדק קריות (בערך 320 ש&quot;ח)</li>
            <li><strong>לרכב חשמלי:</strong> טכנו טסט (התמחות מיוחדת)</li>
            <li><strong>מקצועיות וותק:</strong> דינמומטר חיפה</li>
            <li><strong>קרוב למרכז:</strong> קומפיוטסט חיפה</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תיעוד דיגיטלי לרכב החדש</h3>
            <p className="text-white/80 mb-5 text-sm">
              עם AutoLog תוכלו לתעד את דוח הבדיקה, פוליסות הביטוח וההיסטוריה — חינם וללא הורדה.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם יש מכוני בדיקה הפתוחים בשבת?</h3>
          <p>לא. מרבית המכונים סגורים בשבת. הרבה פתוחים ביום שישי בבוקר עד 12:30.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">איפה הכי זול בחיפה?</h3>
          <p>מבדק קריות בקרית אתא הוא לרוב הזול ביותר באזור — סביב 320-360 ש&quot;ח.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה זמן לוקחת בדיקה?</h3>
          <p>60-90 דקות לבדיקה סטנדרטית. עם נסיעת מבחן — עד שעתיים.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה עם רכבים שנמצאים בנהריה או בעכו?</h3>
          <p>שווה להגיע לחיפה — המבחר רחב יותר. נהריה ועכו עיקר המכונים נמצאים בחיפה ובקרית אתא.</p>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Article',
                  headline: post.title,
                  description: post.description,
                  datePublished: post.publishedAt,
                  author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
                  publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
                  mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    { '@type': 'Question', name: 'האם יש מכוני בדיקה הפתוחים בשבת בחיפה?', acceptedAnswer: { '@type': 'Answer', text: 'לא, מרבית המכונים סגורים בשבת. הרבה פתוחים ביום שישי בבוקר עד 12:30.' } },
                    { '@type': 'Question', name: 'איפה הכי זול לבדוק רכב בחיפה?', acceptedAnswer: { '@type': 'Answer', text: 'מבדק קריות בקרית אתא הוא לרוב הזול ביותר באזור — סביב 320-360 ש"ח.' } },
                    { '@type': 'Question', name: 'כמה זמן לוקחת בדיקה?', acceptedAnswer: { '@type': 'Answer', text: '60-90 דקות לבדיקה סטנדרטית. עם נסיעת מבחן עד שעתיים.' } },
                  ],
                },
              ],
            }),
          }}
        />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />כל המאמרים
          </Link>
          <Link href="/blog/bdika-lifnei-kniyat-rechev-petach-tikva" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            בדיקת רכב בפתח תקווה<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
