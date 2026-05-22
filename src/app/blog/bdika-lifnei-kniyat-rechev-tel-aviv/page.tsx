import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('bdika-lifnei-kniyat-rechev-tel-aviv')!;

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
            קונים רכב יד שנייה באזור תל אביב? בדיקה מקצועית במכון לפני שאתם מעבירים את הכסף היא ההגנה הכי חשובה שלכם.
            במאמר הזה תמצאו את רשימת המכונים המובילים בתל אביב, השוואת מחירים, מה כל בדיקה כוללת,
            ועצות שיחסכו לכם 5,000-50,000 ש&quot;ח בקנייה לא נכונה.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">למה בכלל צריך בדיקה במכון?</h2>
          <p>
            מוכרים פרטיים — וגם סוחרים — לא תמיד מגלים את כל האמת על הרכב. תאונות שכוסו, תיקוני גוף שהוסתרו, בעיות במנוע שנפתרו זמנית —
            כל אלה דברים שעין לא מקצועית לא תזהה. <strong>בדיקה במכון ב-600-1,200 ש&quot;ח יכולה לחסוך לכם תיקון של 15,000 ש&quot;ח שלושה חודשים אחרי הקנייה.</strong>
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מכוני בדיקה מובילים בתל אביב והסביבה</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קומפיוטסט תל אביב</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>כתובת:</strong> חרוץ 3, אזור תעשייה תל אביב</li>
            <li><strong>טלפון:</strong> 03-688-1888</li>
            <li><strong>דירוג Google:</strong> 3.9 (מעל 130 ביקורות)</li>
            <li><strong>מחיר בדיקה לפני קנייה:</strong> 700-900 ש&quot;ח</li>
            <li><strong>שעות פעילות:</strong> א&apos;-ה&apos; 7:30-17:00, ו&apos; 7:30-12:30</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. דינמומטר (יד אליהו)</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>כתובת:</strong> השלושה 7, יד אליהו</li>
            <li><strong>טלפון:</strong> 03-537-0574</li>
            <li><strong>מחיר:</strong> 650-850 ש&quot;ח</li>
            <li><strong>ותק:</strong> מעל 60 שנה בענף</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. טכנו טסט תל אביב (סניף אנילביץ)</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>מחיר:</strong> 750-950 ש&quot;ח</li>
            <li><strong>התמחות:</strong> חשמליים — בדיקת סוללה ייחודית</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. נבדקי רכב + PT Motors</h3>
          <p>אופציות נוספות, מחיר 650-850 ש&quot;ח, שירותים מקיפים.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה בדיקת רכב לפני קנייה בתל אביב?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>בדיקה בסיסית לרכב פרטי:</strong> 650-900 ש&quot;ח</li>
            <li><strong>רכב 4x4 / SUV:</strong> 800-1,100 ש&quot;ח</li>
            <li><strong>רכב חשמלי / היברידי:</strong> 900-1,200 ש&quot;ח (כולל בדיקת סוללה)</li>
            <li><strong>רכב יוקרה (BMW / מרצדס / אאודי):</strong> 1,200-2,000 ש&quot;ח</li>
            <li><strong>בדיקה + שמאות מקצועית:</strong> 1,400-2,200 ש&quot;ח</li>
          </ul>
          <p>
            <strong>טיפ:</strong> רוב המכונים בתל אביב יקרים ב-10-15% ממכוני בדיקה בפריפריה.
            אם הרכב נמצא בפתח תקווה או בראשון לציון, שווה לקחת אותו לבדיקה שם — תחסכו 100-200 ש&quot;ח.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה כוללת בדיקה במכון?</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">בדיקה ויזואלית מקיפה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>מצב הצבע — לזיהוי צביעה לאחר תאונה</li>
            <li>בדיקת ריתוכים ושלמות מבנה</li>
            <li>מצב פנים הרכב, ריפודים, מסכים</li>
            <li>בדיקת תחתית הרכב, הצולגי וההלוגי</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">בדיקה ממוחשבת (סורק OBD)</h3>
          <p>
            קריאת קודי תקלה במנוע, גיר, ABS, airbags + בדיקת תקינות חיישנים + היסטוריית תקלות במחשב הרכב.
            <Link href="/blog/ma-ze-ovd2" className="text-teal-600 hover:text-teal-700 underline mr-1">
              למד עוד על OBD2
            </Link>.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">נסיעת מבחן + בדיקות מכאניות</h3>
          <p>בלמים, צמיגים, מתלים, היגוי, רעידות, ביצועי מנוע וגיר.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה לעשות לפני שאתם מגיעים למכון</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>קבלו דוח היסטוריה דיגיטלי</strong> — דוח בלק&quot;ר או דוח לוי יצחק לפני שאתם משלמים על בדיקה במכון</li>
            <li><strong>תעדו את כל ההיסטוריה הידועה</strong> — בקשו מהמוכר את ספרון השירות, חשבוניות, פוליסות ביטוח</li>
            <li><strong>קבעו תור מראש</strong> — הזמנה מראש זה גם הנחה של 5-10%</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">טעויות נפוצות בקניית רכב יד שנייה</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>לא לסמוך על &quot;בדיקה&quot; של הסוחר</strong> — תמיד תוודאו שהבדיקה מתבצעת במכון עצמאי שאתם בחרתם</li>
            <li><strong>לא להתעלם מ&quot;בעיות קטנות&quot;</strong> — קולות חריגים, רעידות בהיגוי, נורות אזהרה — דגלים אדומים</li>
            <li><strong>לא להזניח את הסיכום עם המוכר</strong> — אחרי הבדיקה, הסכימו על הכל בכתב</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תעדו את הרכב החדש מהיום הראשון</h3>
            <p className="text-white/80 mb-5 text-sm">
              עם AutoLog תוכלו לתעד את דוח הבדיקה, פוליסות הביטוח וההיסטוריה — ולהיות מוכנים תמיד.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם הבדיקה במכון היא ערובה?</h3>
          <p>היא נותנת תמונה מקצועית, אבל אינה ערובה לכך שלא תהיה תקלה בעתיד. עם זאת, מכון מוכר עם תעודת אחריות מקנה לכם זכות תביעה אם התגלה ליקוי שהוסתר.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה זמן לוקחת בדיקה במכון?</h3>
          <p>בדיקה סטנדרטית לוקחת 60-90 דקות. בדיקה מורחבת עם נסיעת מבחן יכולה להגיע ל-2 שעות.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם אפשר לקבל את הדוח גם בכתב?</h3>
          <p>כן, חובה. כל מכון מקצועי מספק דוח כתוב מפורט בסיום הבדיקה.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה ימים אחרי הבדיקה הקנייה צריכה להתבצע?</h3>
          <p>כמה שיותר מהר — אידיאלי באותו יום. ככל שעובר זמן, יכולים להתפתח ליקויים חדשים.</p>
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
                    { '@type': 'Question', name: 'האם הבדיקה במכון היא ערובה?', acceptedAnswer: { '@type': 'Answer', text: 'היא נותנת תמונה מקצועית, אבל אינה ערובה לכך שלא תהיה תקלה בעתיד.' } },
                    { '@type': 'Question', name: 'כמה זמן לוקחת בדיקה במכון?', acceptedAnswer: { '@type': 'Answer', text: 'בדיקה סטנדרטית לוקחת 60-90 דקות.' } },
                    { '@type': 'Question', name: 'האם אפשר לקבל את הדוח גם בכתב?', acceptedAnswer: { '@type': 'Answer', text: 'כן, חובה. כל מכון מקצועי מספק דוח כתוב מפורט.' } },
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
          <Link href="/blog/bdika-lifnei-kniyat-rechev-jerusalem" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            בדיקת רכב בירושלים<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
