import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('tizkoret-bituach-rechev')!;

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
            לשכוח לחדש את הביטוח רכב זה אסון. רגע אחד אתה נוסע רגיל בכביש, ובשני — אתה במצב משפטי קשה אם ביטוח החובה שלך פג ולא ידעת.
            במאמר הזה תמצא 5 שיטות פשוטות לוודא שזה לא יקרה לך.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">למה זה כל כך חשוב?</h2>
          <p>ביטוח חובה לרכב הוא חובה חוקית בישראל. נסיעה ללא ביטוח חובה גוררת:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>קנס פלילי</strong> של עד 14,500 ש&quot;ח</li>
            <li><strong>פסילת רישיון</strong> לתקופה משמעותית</li>
            <li><strong>אחריות אישית</strong> לכל נזק גוף שתגרום בתאונה — מאות אלפי שקלים</li>
            <li><strong>עיכוב הרכב</strong> במשטרה</li>
            <li><strong>תיק פלילי</strong> ברישום</li>
          </ul>
          <p>
            ובכל זאת, <strong>כ-5% מהנהגים בישראל נוסעים מבלי לדעת שהביטוח שלהם פג</strong>. בדרך כלל בגלל אחת מאלה:
            שינוי כתובת ולא קיבלו את המכתב, חברת הביטוח שינתה תנאים והפסיקה את הפוליסה אוטומטית, או פשוט שכחו.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">5 הדרכים לא לפספס את חידוש הביטוח</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. הוראת קבע אוטומטית (פתרון בסיסי)</h3>
          <p>
            הדרך הפשוטה ביותר: בקשו מחברת הביטוח להעביר את התשלום בהוראת קבע אוטומטית, וגם להאריך את הפוליסה אוטומטית מדי שנה.
          </p>
          <p><strong>יתרון:</strong> אפס מאמץ. <strong>חיסרון:</strong> אתם תקועים עם אותה חברה לתמיד. אם הם מעלים מחיר ב-30%, אתם תשלמו בלי לשים לב.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. תזכורת ביומן הטלפון (פתרון ידני)</h3>
          <p>הזינו ביומן של הסמארטפון תזכורת חוזרת שנתית, חודש לפני תאריך התפוגה.</p>
          <p><strong>יתרון:</strong> חופשי, פשוט. <strong>חיסרון:</strong> דורש משמעת.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. אפליקציית חברת הביטוח שלכם</h3>
          <p>רוב חברות הביטוח (הראל, הפניקס, מגדל, כלל) מציעות אפליקציה ייעודית עם תזכורות.</p>
          <p><strong>חיסרון:</strong> אם יש לכם כמה רכבים בכמה חברות, צריך לעבוד מול כמה אפליקציות. בנוסף, האפליקציה תמיד תמליץ לכם לחדש דווקא אצלם.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. שירות SMS של חברת הביטוח</h3>
          <p>תוכלו לבקש מהחברה לשלוח לכם SMS חודש מראש. רק אל תשכחו לעדכן מספר טלפון אם מחליפים.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">5. אפליקציה כללית לניהול רכב (הפתרון החכם ביותר)</h3>
          <p>
            מערכת ניהול רכב מודרנית, כמו AutoLog, מתעדת את כל המסמכים שלכם — ביטוח, רישיון, טסט, רישיון נהיגה —
            ושולחת תזכורות אוטומטיות לכל אחד מהם, מכל החברות והגורמים, במקום אחד.
          </p>
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-teal-800 mb-2">איך זה עובד ב-AutoLog</p>
            <ol className="list-decimal list-inside space-y-1 text-teal-700 text-sm mr-4">
              <li>אתם מצלמים את פוליסת הביטוח (פעם אחת)</li>
              <li>הבינה המלאכותית קוראת את התאריכים אוטומטית</li>
              <li>תזכורת מגיעה אליכם 30 יום, 7 ימים, ויום לפני שהביטוח פג</li>
              <li>אתם יכולים להשוות הצעות מחברות אחרות לפני החידוש</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">טיפים נוספים לניהול חכם של ביטוח רכב</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">השוואת הצעות לפני חידוש</h3>
          <p>
            המחיר עולה כל שנה אצל אותה חברה — זה לא סוד. השוואת הצעות באתרי השוואה יכולה לחסוך לכם 500-2,000 ש&quot;ח בשנה.
            אבל הזמן הנכון הוא <strong>חודש לפני</strong> ולא יום לפני.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">בדיקה שהפרטים נכונים</h3>
          <p>
            קילומטראז&apos; שגוי, נהגים נוספים שלא עודכנו, שינויים ברכב — כל אלה יכולים לבטל את הפוליסה במקרה של תביעה.
            עדכנו את חברת הביטוח בכל שינוי משמעותי.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה לעשות אם הביטוח כבר פג?</h2>
          <p>
            <strong>אל תיסע ברכב</strong> — אפילו לא קרוב. ההמלצה הראשונה היא לא לנסוע. אם אתם חייבים, חיפשו ביטוח אונליין מיידי —
            חברות כמו AIG, ביטוח ישיר, ו-ביטוח כל-כלל מציעות הנפקת פוליסה דיגיטלית תוך 5-10 דקות.
          </p>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תזכורת אוטומטית — חינם</h3>
            <p className="text-white/80 mb-5 text-sm">
              AutoLog שולחת לך תזכורת לפני שהביטוח פג. צילום אחד של הפוליסה — והמערכת קוראת את התאריך לבד.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם ביטוח חובה אוטומטית מתחדש?</h3>
          <p>לא, אלא אם כן הזמנתם הוראת קבע. בלעדיה — אתם נדרשים לחדש פעיל.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה זמן יש לי לחדש את הביטוח אחרי שפג?</h3>
          <p>מבחינה חוקית, 0 ימים. ברגע שהביטוח פג, אסור לנסוע. בפועל, רוב החברות נותנות 7-14 ימי חסד אבל זה לא תקף משפטית.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה ההבדל בין ביטוח חובה לביטוח מקיף?</h3>
          <p>
            ביטוח חובה (מ&quot;חוק הפלת&quot;ד&quot;) מכסה רק נזק גוף שאתם גורמים לאחרים. הוא חובה חוקית.
            ביטוח מקיף (או צד ג&apos;) הוא רשות, ומכסה גם נזק לרכב שלכם.
          </p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מי שולח לי תזכורת מחברת הביטוח?</h3>
          <p>לפי החוק, חברת הביטוח חייבת לשלוח לכם הצעת חידוש 60 יום לפני תום הפוליסה. אם לא קיבלתם — בקשו אותה. זה זכותכם.</p>
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
                    { '@type': 'Question', name: 'האם ביטוח חובה אוטומטית מתחדש?', acceptedAnswer: { '@type': 'Answer', text: 'לא, אלא אם כן הזמנתם הוראת קבע. בלעדיה אתם נדרשים לחדש פעיל.' } },
                    { '@type': 'Question', name: 'כמה זמן יש לי לחדש את הביטוח אחרי שפג?', acceptedAnswer: { '@type': 'Answer', text: 'מבחינה חוקית 0 ימים. ברגע שהביטוח פג אסור לנסוע.' } },
                    { '@type': 'Question', name: 'מה ההבדל בין ביטוח חובה לביטוח מקיף?', acceptedAnswer: { '@type': 'Answer', text: 'ביטוח חובה מכסה רק נזק גוף שאתם גורמים לאחרים. ביטוח מקיף הוא רשות ומכסה גם נזק לרכב שלכם.' } },
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
          <Link href="/blog/kama-ole-test-shnati-2026" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            כמה עולה טסט שנתי 2026<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
