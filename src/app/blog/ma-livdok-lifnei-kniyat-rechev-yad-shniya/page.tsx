import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('ma-livdok-lifnei-kniyat-rechev-yad-shniya')!;

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
            קניית רכב יד שנייה היא אחת ההחלטות הפיננסיות הגדולות שתעשו השנה. במחיר ממוצע של 60,000-150,000 ש&quot;ח,
            טעות יכולה לעלות לכם אלפי שקלים בתיקונים. במאמר תמצאו צ&apos;קליסט מקיף של 50 בדיקות שיגנו עליכם —
            מבדיקת המסמכים ועד נסיעת המבחן.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שלב 1: לפני שאתם יוצאים לראות את הרכב</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">בדיקות באינטרנט</h3>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>בדקו דוח היסטוריה</strong> — דוח בלק&quot;ר או לוי יצחק. עלות: 0-150 ש&quot;ח. תקבלו: היסטוריית בעלים, תאונות, שעבודים</li>
            <li><strong>השוו מחירים</strong> — בדקו ב-Yad2 ו-Drushim. אם המחיר זול ב-20%+ מהממוצע — דגל אדום</li>
            <li><strong>בדקו את הדגם</strong> — חפשו &quot;תקלות נפוצות [דגם הרכב] [שנת ייצור]&quot;</li>
            <li><strong>שאלו על מספר הבעלים</strong> — רכב שעבר 3+ בעלים תוך 5 שנים — בעיה</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">בדיקת המוכר</h3>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>תעודת זהות</strong> — וודאו שהמוכר רשום כבעל הרכב</li>
            <li><strong>חיפשו במאגרים</strong> — בדקו אם המוכר רשום כעוסק (סוחר רכב מסווה את עצמו כפרטי)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שלב 2: בדיקה ויזואלית של הרכב</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">חיצוני</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>בדיקת צבע</strong> — אם בעמודי המוסך משתקפים גוונים שונים, יש סיכוי שהוא נצבע אחרי תאונה</li>
            <li><strong>רחוקים בין דלתות</strong> — אם המרווחים לא אחידים, היו תאונה ופירוק</li>
            <li><strong>חלודה בכנפיים</strong> — בדקו את הפנים של הכנפיים והדלתות</li>
            <li><strong>מצב הצמיגים</strong> — עומק הסוליה, גיל הצמיג, שחיקה אחידה</li>
            <li><strong>שני זוגות מפתחות</strong> — אם יש רק אחד = ייתכן שהאחר נגנב/אבד</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">תחתית הרכב</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>חלודה בתחתית</strong> — לחקור עם פנס. תחתית חלודה משמעותית — ויתורו</li>
            <li><strong>דליפות שמן/מים</strong> — כתמים מתחת = בעיה במנוע / גיר / רדיאטור</li>
            <li><strong>מצב מערכת הפליטה</strong> — חורים, חלודה, או חיבורים רעועים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">פנים הרכב</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מצב ההגה</strong> — הגה שחוק לעומת קילומטראז&apos; &quot;נמוך&quot; = רמאות</li>
            <li><strong>שטיחים, ריפודים, סדינים</strong> — מצב כללי, ריחות (עישון, חיות מחמד, רטיבות)</li>
            <li><strong>כל הכפתורים והמתגים</strong> — בדקו את כולם, אחד אחד</li>
            <li><strong>חשמל</strong> — מסך מולטימדיה, פנסים פנימיים, ה-USB</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שלב 3: בדיקה ממוחשבת (OBD2)</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>חברו סורק OBD — בדקו אם יש קודי תקלה פעילים</li>
            <li>היסטוריית תקלות במחשב — קודים שנמחקו לאחרונה (סימן שהמוכר ניסה להסתיר)</li>
            <li>בדיקת מוכנות לטסט — Readiness Monitors</li>
          </ul>
          <p>
            <Link href="/blog/ma-ze-ovd2" className="text-teal-600 hover:text-teal-700 underline">
              מדריך מלא על OBD2 כאן
            </Link>.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שלב 4: בדיקת המסמכים</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רישיון רכב מקורי</strong> — לא העתק. בדקו תאריך תפוגה</li>
            <li><strong>ספרון שירות</strong> — האם יש תיעוד מלא של טיפולים? אצל מוסך מורשה?</li>
            <li><strong>חשבוניות מטיפולים</strong> — בקשו לראות. אם אין — סימן רע</li>
            <li><strong>פוליסת ביטוח</strong> — האם הייתה פעילה ברציפות? פערים יקרים בעתיד</li>
            <li><strong>תעודה על ירידת ערך</strong> — אם הייתה תאונה משמעותית, אמורה להיות תעודה</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שלב 5: נסיעת מבחן</h2>
          <p><strong>בנסיעה (לפחות 30 דקות, מעורב עירוני + בין-עירוני):</strong></p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>תאוצה — חלקה? יש מעידות?</li>
            <li>גיר — מעבר חלק בין הילוכים?</li>
            <li>בלמים — עוצרים בקו ישר? אין רטטים?</li>
            <li>היגוי — הרכב נמשך לצד? יש &quot;יד חופשית&quot; בהגה?</li>
            <li>רעידות — במהירויות שונות?</li>
            <li>קלימה (מזגן) — מקרר באמת?</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שלב 6: בדיקה במכון מקצועי</h2>
          <p>
            זהו השלב הקריטי שאסור לוותר עליו. גם אם הכל נראה תקין — בדיקה במכון של 350-450 ש&quot;ח חיונית.
          </p>
          <p>
            <Link href="/blog/bdika-lifnei-kniyat-rechev-tel-aviv" className="text-teal-600 hover:text-teal-700 underline mr-1">
              מדריך לבדיקה בתל אביב
            </Link>
            ,
            <Link href="/blog/bdika-lifnei-kniyat-rechev-jerusalem" className="text-teal-600 hover:text-teal-700 underline mr-1">
              בירושלים
            </Link>
            או
            <Link href="/blog/mechoney-bdika-rishon-letzion" className="text-teal-600 hover:text-teal-700 underline mr-1">
              בראשון לציון
            </Link>.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שלב 7: אחרי הקנייה</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>העברת בעלות</strong> — תוך 7 ימים. אל תשכחו! קנס יקר</li>
            <li><strong>חידוש ביטוח חובה</strong> — לפעמים הביטוח של המוכר לא תקף לכם</li>
            <li><strong>תיעוד ב-AutoLog</strong> — תעדו את כל פרטי הרכב, מסמכי הקנייה, ודוח המכון</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">דגלים אדומים — סימני אזהרה</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>המחיר זול מדי</strong> — תמיד יש סיבה</li>
            <li><strong>המוכר ממהר</strong> — &quot;אני חייב למכור מחר&quot; — לחץ פסיכולוגי</li>
            <li><strong>לא נותן לעשות בדיקה במכון</strong> — חשד מיידי</li>
            <li><strong>לא מאפשר נסיעת מבחן</strong> — ויתור מיידי</li>
            <li><strong>חוסר במסמכים</strong> — אם אין רישיון מקורי או ספרון שירות</li>
            <li><strong>שינויים לא מתועדים</strong> — צמיגי ספורט, בלמים גדולים — ייתכן שיש בעיה ביטוחית</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תיעוד מלא לרכב מהיום הראשון</h3>
            <p className="text-white/80 mb-5 text-sm">תעדו את הדוח, הקנייה, הבעלים הקודמים — ב-AutoLog. חינם וללא הורדה.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה שווה לי לבדוק רכב יד שנייה?</h3>
          <p>350-450 ש&quot;ח על בדיקה במכון. הסכום הזה יכול לחסוך לכם 5,000-50,000 ש&quot;ח.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם להעדיף רכב מסוחר או פרטי?</h3>
          <p>פרטי: לרוב זול ב-5-10%, אבל פחות אחריות. סוחר: יותר יקר אבל מקבל אחריות חוקית של 6 חודשים על תקלות סמויות.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">באילו דגמים יש פחות תקלות?</h3>
          <p>דגמי טויוטה, מאזדה, יונדאי ב-3-7 שנים האחרונות נחשבים אמינים. דגמים אירופאיים — יקרים יותר לתחזוקה.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם רכב היברידי שווה?</h3>
          <p>כן, אבל בדקו במיוחד את מצב הסוללה. החלפת סוללה היברידית יכולה לעלות 15,000-30,000 ש&quot;ח.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה עושים אם גילינו תקלה אחרי הקנייה?</h3>
          <p>אם זה תוך 30 יום — יש לכם סיכוי לתביעה. צרו קשר עם עו&quot;ד תעבורה. תיעוד הדוח מהבדיקה במכון יחזק את התביעה.</p>
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
                    { '@type': 'Question', name: 'כמה שווה לי לבדוק רכב יד שנייה?', acceptedAnswer: { '@type': 'Answer', text: '350-450 ש"ח על בדיקה במכון. הסכום הזה יכול לחסוך 5,000-50,000 ש"ח.' } },
                    { '@type': 'Question', name: 'האם להעדיף רכב מסוחר או פרטי?', acceptedAnswer: { '@type': 'Answer', text: 'פרטי לרוב זול ב-5-10% אבל פחות אחריות. סוחר יותר יקר אבל עם אחריות חוקית של 6 חודשים.' } },
                    { '@type': 'Question', name: 'באילו דגמים יש פחות תקלות?', acceptedAnswer: { '@type': 'Answer', text: 'טויוטה, מאזדה, יונדאי ב-3-7 שנים האחרונות נחשבים אמינים.' } },
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
          <Link href="/blog/7-applikatziot-lenihul-rechev-2026" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            השוואת אפליקציות לניהול רכב<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
