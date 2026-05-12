import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('mechoney-bdika-rishon-letzion')!;

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
            ראשון לציון, העיר הרביעית בגודלה בישראל, היא בית למספר מכוני בדיקה ורישוי לרכב. אם אתם תושבי העיר או הסביבה
            (חולון, רחובות, נס ציונה), במאמר תמצאו את הרשימה המלאה של המכונים, השוואת מחירים, ועצות לבחירת המכון המתאים.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מכוני הבדיקה בראשון לציון — הרשימה המלאה</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קומפיוטסט ראשון לציון</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>שני סניפים:</strong> מערב (משה בקר 19) ומזרח (אזור התעשייה הישן)</li>
            <li><strong>טלפון:</strong> 03-9661958</li>
            <li><strong>דירוג Google:</strong> 4.0</li>
            <li><strong>מחיר:</strong> 380-450 ש&quot;ח</li>
            <li><strong>שעות:</strong> א&apos;-ה&apos; 7:30-17:30, ו&apos; 7:30-12:30</li>
            <li><strong>התמחות:</strong> רשת ותיקה (מ-1986), מקצועיים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. טכנו טסט ראשון לציון</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>דירוג Google:</strong> 4.1</li>
            <li><strong>מחיר:</strong> 400-480 ש&quot;ח</li>
            <li><strong>התמחות מיוחדת:</strong> רכבים חשמליים והיברידיים, בדיקת סוללה לחשמלי</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. נבדקי רכב — בדיקות ממוחשבות</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 350-420 ש&quot;ח</li>
            <li><strong>שעות:</strong> א&apos;-ה&apos; 8:30-17:30, ו&apos; 8:00-12:30</li>
            <li><strong>התמקצעות:</strong> בדיקה לפני קנייה, כיווני פרונט, בדיקות חורף</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. PT Motors — סניף ראשון לציון</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>כתובת:</strong> משה שרת 6, ראשון לציון</li>
            <li><strong>מחיר:</strong> 350-400 ש&quot;ח (עם שמאות 700-850 ש&quot;ח)</li>
            <li><strong>חניה חינם</strong></li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">5-7. פרונט מוטורס, גריז, המומחים</h3>
          <p>אופציות נוספות במחירים 350-450 ש&quot;ח, שירותים מקיפים.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה הופך את ראשון לציון למיקום אטרקטיבי לבדיקה?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>מחיר נמוך יותר:</strong> בדרך כלל זול ב-10-20% מתל אביב, ובאיכות זהה</li>
            <li><strong>גישה נוחה:</strong> קרוב לכביש 4 וכביש 1 — לקונים מתל אביב, חולון, אשדוד או רחובות זה מיקום נגיש</li>
            <li><strong>זמני המתנה קצרים:</strong> פחות עומס מתל אביב, סביר לקבל תור באותו יום</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך לבחור מכון בראשון לציון?</h2>
          <p><strong>לפי קריטריון:</strong></p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>המחיר הזול ביותר:</strong> PT Motors (350-400 ש&quot;ח)</li>
            <li><strong>לרכב חשמלי:</strong> טכנו טסט (התמחות מיוחדת)</li>
            <li><strong>שירות מקצועי וותיק:</strong> קומפיוטסט מערב</li>
            <li><strong>תור מהיר:</strong> נבדקי רכב או פרונט מוטורס</li>
            <li><strong>בדיקה + שמאות:</strong> PT Motors (חבילה זולה)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה כל מכון אמור לכלול בבדיקה?</h2>
          <p>בדיקה מקצועית בראשון לציון, כמו בכל מקום בארץ, חייבת לכלול:</p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>בדיקה ויזואלית פנימית וחיצונית</li>
            <li>סריקת מחשב הרכב עם OBD2</li>
            <li>בדיקת מערכת בלמים והגה</li>
            <li>בדיקת מתלים, צמיגים וגלגלים</li>
            <li>נסיעת מבחן עם הבודק</li>
            <li>דוח כתוב מפורט עם תמונות</li>
            <li>תעודת אחריות</li>
          </ul>
          <p><strong>אם המכון לא מציע את כל אלה — לכו לאחר.</strong></p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">טיפים מקומיים לתושבי ראשון לציון</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>עדיפו מכון קרוב לבית</strong> — ראשון היא עיר גדולה. מכון 5 דקות מהבית עדיף על מכון 25 דקות, גם אם זול מעט יותר</li>
            <li><strong>בקשו ביקורת לפי כביש 4</strong> — רכבים שנוסעים הרבה בכביש 4 נוטים יותר לבעיות במתלים ובהיגוי</li>
            <li><strong>הצטרפו לקבוצות פייסבוק מקומיות</strong> — קבוצות &quot;ראשון לציון — קונים ומוכרים&quot; יכולות לתת המלצות עדכניות</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תיעוד מקצועי לרכב החדש שלכם</h3>
            <p className="text-white/80 mb-5 text-sm">תעדו את הדוח, פוליסות וטיפולים ב-AutoLog — חינם וללא הורדה.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם יש מכוני בדיקה הפתוחים ביום שישי בראשון לציון?</h3>
          <p>כן, רוב המכונים פועלים גם ביום שישי בבוקר (לרוב 7:30-12:30). הזמינו תור מראש כי השעות מצומצמות.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה עולה בדיקה בראשון לציון לעומת תל אביב?</h3>
          <p>בראשון 10-20% פחות, בממוצע 50-100 ש&quot;ח חיסכון על אותו סוג בדיקה.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם אפשר להזמין תור אונליין?</h3>
          <p>רוב המכונים הגדולים (קומפיוטסט, טכנו טסט) מאפשרים הזמנה אונליין עם הנחה של 5-10%.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מהו מכון בדיקה הזול ביותר בראשון לציון?</h3>
          <p>PT Motors הוא לרוב הזול ביותר, עם בדיקה החל מ-350 ש&quot;ח.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם אפשר לעשות גם טסט שנתי באותו מכון?</h3>
          <p>כן, רוב המכונים הם גם מכוני רישוי המאושרים לבצע טסט שנתי. תוודאו זאת לפני התור.</p>
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
                  dateModified: post.updatedAt || post.publishedAt,
                  author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
                  publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
                  mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    { '@type': 'Question', name: 'האם יש מכוני בדיקה הפתוחים ביום שישי בראשון לציון?', acceptedAnswer: { '@type': 'Answer', text: 'כן, רוב המכונים פועלים גם ביום שישי בבוקר (לרוב 7:30-12:30).' } },
                    { '@type': 'Question', name: 'מה עולה בדיקה בראשון לציון לעומת תל אביב?', acceptedAnswer: { '@type': 'Answer', text: 'בראשון 10-20% פחות, בממוצע 50-100 ש"ח חיסכון.' } },
                    { '@type': 'Question', name: 'מהו מכון בדיקה הזול ביותר בראשון לציון?', acceptedAnswer: { '@type': 'Answer', text: 'PT Motors הוא לרוב הזול ביותר, עם בדיקה החל מ-350 ש"ח.' } },
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
          <Link href="/blog/ma-livdok-lifnei-kniyat-rechev-yad-shniya" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            מה לבדוק לפני קניית רכב יד שנייה<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
