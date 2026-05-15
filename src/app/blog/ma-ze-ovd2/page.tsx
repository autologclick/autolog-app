import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('ma-ze-ovd2')!;

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
            אם אי פעם נדלקה לך נורת &quot;Check Engine&quot; ברכב, סביר להניח שהמוסכניק חיבר מכשיר קטן לשקע מתחת להגה ושאל אותך
            &quot;מה התקלה?&quot;. המכשיר הזה הוא <strong>סורק OBD2</strong>, והוא קורא את השפה של מחשב הרכב שלך.
            במאמר הזה תבין בדיוק איך זה עובד, מה אפשר לעשות עם זה, ולמה כדאי לכל בעל רכב להכיר את הטכנולוגיה.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה זה בכלל OBD2?</h2>
          <p>
            OBD ראשי תיבות של <strong>On-Board Diagnostics</strong> (אבחון מובנה ברכב). זוהי מערכת ממוחשבת שמוטמעת בכל רכב שיוצר אחרי 1996 בארה&quot;ב,
            ובאירופה ובישראל מ-2001 ואילך. המערכת עוקבת בזמן אמת אחרי כל מערכות הרכב — מנוע, גיר, פליטה, חיישנים, מערכות בטיחות —
            ושומרת בזיכרון כל תקלה שמתגלה.
          </p>
          <p>
            הגרסה החדשה והנפוצה היום היא OBD2 (או OBD-II). הגרסה הראשונה (OBD1) הייתה פרימיטיבית ומוגבלת ליצרן ספציפי.
            OBD2 מתוקננת — כל רכב מכל יצרן מדבר באותה שפה.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איפה נמצא שקע ה-OBD2 ברכב?</h2>
          <p>
            ב-99% מהרכבים, שקע ה-OBD2 נמצא <strong>מתחת ללוח השעונים, באזור הברך השמאלית של הנהג</strong>.
            השקע הוא מלבני, עם 16 פינים, וקל לזיהוי. אם הוא לא נמצא — חיפוש בגוגל של דגם הרכב + &quot;OBD2 location&quot; יראה את המיקום המדויק.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה אפשר לעשות עם סורק OBD2?</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. קריאת קודי תקלה (DTC)</h3>
          <p>
            זו הפונקציה הבסיסית. הסורק מוציא קוד אלפא-נומרי כמו <code className="bg-gray-100 px-1 rounded">P0301</code> —
            שאומר &quot;תקלת בעירה בצילינדר 1&quot;. יש מאגרים אונליין שמתרגמים כל קוד למילים אנושיות, ולהיום הסורקים החכמים עושים את זה אוטומטית.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. ניטור בזמן אמת</h3>
          <p>
            אפשר לראות סיבובי מנוע, טמפרטורת מנוע, צריכת דלק רגעית, מהירות, מתח סוללה, לחץ מנוע ועוד עשרות פרמטרים — בזמן אמת תוך כדי נסיעה.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. מחיקת קוד התקלה</h3>
          <p>
            אחרי שתיקנת את הבעיה, אפשר למחוק את הקוד מהמחשב כדי שנורת ה-Check Engine תכבה.
            <strong> אזהרה:</strong> אל תמחק קוד בלי לתקן את הבעיה. הוא יחזור, ואם תיקח את הרכב לטסט עם תקלה לא מטופלת — תיכשל.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. בדיקת מוכנות לטסט</h3>
          <p>לפני הגעה לטסט, סורק OBD יגיד אם הרכב &quot;מוכן&quot; לבדיקה (כל המערכות הראו תקינות לפחות פעם אחת מאז המחיקה האחרונה).</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה סורק OBD2?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>בלוטות&apos; פשוט (ELM327):</strong> 30-80 ש&quot;ח — מי שרוצה רק לקרוא קודי תקלה</li>
            <li><strong>סורק WiFi עם מסך:</strong> 150-400 ש&quot;ח — חובבים שרוצים מידע בזמן אמת</li>
            <li><strong>סורק מקצועי (Autel, Launch):</strong> 600-3,000 ש&quot;ח — מוסכניקים</li>
          </ul>
          <p>עבור 95% מבעלי הרכב, <strong>סורק בלוטות&apos; פשוט עם אפליקציה כמו Car Scanner או Torque ימלא את כל הצרכים</strong>.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך משלבים OBD2 עם ניהול רכב חכם?</h2>
          <p>
            הנתונים מ-OBD2 מעניינים, אבל חסרים להם הקשר לאורך זמן. למשל: ידעת שצריכת הדלק שלך עלתה ב-15% בחצי שנה האחרונה?
            זה דגל אדום שדורש בדיקה. בלי תיעוד שיטתי, קשה לזהות את המגמה.
          </p>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תעד הכל ב-AutoLog</h3>
            <p className="text-white/80 mb-5 text-sm">
              נתוני אבחון, היסטוריית טיפולים, הוצאות ותזכורות — הכל במקום אחד. בהגעה למוסך, אפשר להציג בדיוק מה נצבר לאורך החודש.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם סורק OBD2 יכול להזיק לרכב?</h3>
          <p>לא, סורקים סטנדרטיים רק קוראים מידע. הסכנה היחידה היא במכשירים זולים מדי שעלולים לפרוק את הסוללה אם משאירים אותם מחוברים זמן רב.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם אני יכול להפעיל סורק OBD2 בעצמי בלי ידע טכני?</h3>
          <p>כן בהחלט. אפליקציות כמו Car Scanner ו-Torque מתורגמות לעברית ומסבירות כל קוד תקלה במילים פשוטות.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">לאיזה רכב לא מתאים סורק OBD2?</h3>
          <p>רכבים שיוצרו לפני 2001 (באירופה) או 1996 (בארה&quot;ב) — הם משתמשים ב-OBD1 שדורש סורק יצרן ספציפי.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה ההבדל בין סורק לרכב למחשב הרכב?</h3>
          <p>&quot;מחשב הרכב&quot; הוא ה-ECU (Engine Control Unit) — הוא נמצא בתוך הרכב. הסורק הוא מכשיר חיצוני שקורא ממנו מידע דרך שקע ה-OBD2.</p>
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
                    { '@type': 'Question', name: 'האם סורק OBD2 יכול להזיק לרכב?', acceptedAnswer: { '@type': 'Answer', text: 'לא, סורקים סטנדרטיים רק קוראים מידע. הסכנה היחידה היא במכשירים זולים מדי שעלולים לפרוק את הסוללה.' } },
                    { '@type': 'Question', name: 'האם אני יכול להפעיל סורק OBD2 בעצמי?', acceptedAnswer: { '@type': 'Answer', text: 'כן בהחלט. אפליקציות כמו Car Scanner ו-Torque מתורגמות לעברית.' } },
                    { '@type': 'Question', name: 'לאיזה רכב לא מתאים סורק OBD2?', acceptedAnswer: { '@type': 'Answer', text: 'רכבים שיוצרו לפני 2001 באירופה או 1996 בארה"ב.' } },
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
