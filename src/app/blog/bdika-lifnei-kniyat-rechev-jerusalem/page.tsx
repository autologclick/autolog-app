import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('bdika-lifnei-kniyat-rechev-jerusalem')!;

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
            ירושלים היא מקרה ייחודי בשוק הרכב הישראלי. הטופוגרפיה ההררית, מזג האוויר הקיצוני בחורף, והתנועה הצפופה בעיר העתיקה —
            כל אלה משפיעים על מצב הרכבים יד שנייה. במאמר תמצאו את כל המכונים המובילים בעיר ובסביבה,
            השוואת מחירים, ועצות מקצועיות לבדיקה רכב יד שנייה בירושלים.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">למה בדיקת רכב יד שנייה בירושלים שונה?</h2>
          <p>רכב שנהג בעיקר בירושלים סובל יותר מ:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>שחיקת בלמים</strong> — יותר מסע יורד-עולה</li>
            <li><strong>מצב גיר</strong> — תמרונים תכופים בעיר העתיקה</li>
            <li><strong>רעידות במתלים</strong> — הרבה כבישים פגומים</li>
            <li><strong>קורוזיה (חלודה)</strong> — בגלל מלח שמפזרים בחורף</li>
          </ul>
          <p>כשאתם בודקים רכב בירושלים, הקדישו תשומת לב מיוחדת לאלה.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">רשימת מכוני בדיקה מומלצים בירושלים</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קומפיוטסט ירושלים — תלפיות</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>כתובת:</strong> אזור תעשייה תלפיות</li>
            <li><strong>דירוג Google:</strong> 4.0+</li>
            <li><strong>מחיר:</strong> 680-850 ש&quot;ח</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. טכנו טסט ירושלים</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>שני סניפים:</strong> מערב ירושלים ותלפיות</li>
            <li><strong>מחיר:</strong> 700-900 ש&quot;ח</li>
            <li><strong>התמחות:</strong> חשמליים והיברידיים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. מבדק ירושלים</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>כתובת:</strong> גבעת שאול</li>
            <li><strong>דירוג Google:</strong> 4.2</li>
            <li><strong>מחיר:</strong> 650-820 ש&quot;ח</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. מכון בדיקה הר חוצבים</h3>
          <p>קרוב לאזור היי-טק, מחיר 680-850 ש&quot;ח, חניה רחבה.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">5. מבדק ארצי — סניף בית שמש (אלטרנטיבה זולה)</h3>
          <p>20-30 דקות נסיעה מירושלים. מחיר: 600-780 ש&quot;ח (חוסך ~80-150 ש&quot;ח).</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה בדיקה לפני קנייה בירושלים?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב פרטי בסיסי:</strong> 650-850 ש&quot;ח</li>
            <li><strong>4x4 / SUV:</strong> 800-1,050 ש&quot;ח</li>
            <li><strong>חשמלי / היברידי:</strong> 900-1,200 ש&quot;ח (כולל בדיקת סוללה)</li>
            <li><strong>רכב יוקרה:</strong> 1,200-2,000 ש&quot;ח</li>
            <li><strong>בדיקה + שמאות:</strong> 1,400-2,200 ש&quot;ח</li>
          </ul>
          <p>ירושלים בדרך כלל זולה ב-5-10% מתל אביב, אבל יקרה ממכונים בפריפריה.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">דברים מיוחדים שכדאי לבדוק ברכב מירושלים</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>מצב הבלמים</strong> — לבקש מהבודק לבדוק לעומק את הדיסקיות והרפידות</li>
            <li><strong>חלודה בתחתית</strong> — לוודא שאין נזק קורוזיוני</li>
            <li><strong>מצב המתלים והבולמים</strong> — סביר שנשחקו יותר</li>
            <li><strong>חימום ומיזוג</strong> — חשוב במיוחד למי שנוסע ברמתות</li>
            <li><strong>תקלות חוזרות במחשב</strong> — לבקש לראות היסטוריה מלאה ב-OBD</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך לבחור מכון בדיקה?</h2>
          <p><strong>3 דברים שחייבים לבדוק לפני שמזמינים תור:</strong></p>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li>דירוג Google של 4.0+ עם לפחות 100 ביקורות</li>
            <li>תעודת אחריות בכתב על הבדיקה</li>
            <li>לא קשור למוכר — מכון שהמוכר המליץ עליו = ניגוד עניינים</li>
          </ol>

          <p><strong>דגלים אדומים — להתרחק:</strong></p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>מחירים זולים מדי (פחות מ-300 ש&quot;ח) — סימן לעבודה רשלנית</li>
            <li>חוסר נכונות לתת תעודה כתובה</li>
            <li>הבדיקה &quot;תיקח 15 דקות&quot; — בדיקה אמיתית לוקחת לפחות שעה</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">אחרי הבדיקה — מה הלאה?</h2>
          <p>
            <strong>אם הבדיקה תקינה:</strong> תעדו את הדוח ב-AutoLog ושימרו אותו. זה יהיה חלק מהיסטוריית הרכב שלכם,
            ויעזור לכם לקבל מחיר טוב יותר כשתמכרו את הרכב בעתיד.
          </p>
          <p><strong>אם נמצאו ליקויים:</strong></p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>ליקויים קטנים (250-1,000 ש&quot;ח לתיקון) — דרשו הפחתה מהמחיר</li>
            <li>ליקויים בינוניים (1,000-5,000 ש&quot;ח) — תחליטו אם שווה לקנות בכלל</li>
            <li>ליקויים גדולים (5,000+ ש&quot;ח) — לרוב סימן לוותר על הקנייה</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תעדו את הרכב מהיום הראשון</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog שומרת את כל ההיסטוריה — דוח בדיקה, פוליסות, טיפולים. הרשמה חינמית.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם יש מכוני בדיקה במזרח ירושלים?</h3>
          <p>יש, אבל קומפיוטסט וטכנו טסט (הרשתות הגדולות) פועלים בעיקר בחלקים המערביים והדרומיים של העיר.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה זמני ההמתנה לתור בירושלים?</h3>
          <p>בימי שיא יכול להיות 3-5 ימים. ביום עבודה רגיל — לרוב אפשר באותו יום או ליום למחרת.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם הבדיקות בירושלים פחות מקצועיות מבתל אביב?</h3>
          <p>לא. רוב המכונים שייכים לאותן רשתות גדולות ועובדים לפי אותם סטנדרטים.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם כדאי לבדוק רכב מירושלים במכון בתל אביב?</h3>
          <p>לא בהכרח. אם תוסיפו דלק, חניה ובזבוז זמן — לא חוסכים. הסיכון העיקרי הוא נסיעה ארוכה ברכב לא בדוק.</p>
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
                    { '@type': 'Question', name: 'האם יש מכוני בדיקה במזרח ירושלים?', acceptedAnswer: { '@type': 'Answer', text: 'יש, אבל הרשתות הגדולות פועלות בעיקר בחלקים המערביים והדרומיים של העיר.' } },
                    { '@type': 'Question', name: 'מה זמני ההמתנה לתור בירושלים?', acceptedAnswer: { '@type': 'Answer', text: 'בימי שיא יכול להיות 3-5 ימים. ביום עבודה רגיל לרוב אפשר באותו יום.' } },
                    { '@type': 'Question', name: 'כמה עולה בדיקת רכב לפני קנייה בירושלים?', acceptedAnswer: { '@type': 'Answer', text: 'רכב פרטי 650-850 ש"ח, רכב יוקרה 1,200-2,000 ש"ח.' } },
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
          <Link href="/blog/mechoney-bdika-rishon-letzion" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            מכוני בדיקה בראשון לציון<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
