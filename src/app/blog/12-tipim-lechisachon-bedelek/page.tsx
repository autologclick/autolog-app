import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('12-tipim-lechisachon-bedelek')!;

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
    siteName: 'אוטולוג',
    images: ogImageForPost(post.slug),
  },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
            <ChevronRight size={14} />חזרה לבלוג
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">{post.category}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B4E8A] leading-tight mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{post.readingTime}</span>
          <span>מאת {post.author}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            דלק הוא ההוצאה השוטפת הגדולה ביותר על הרכב. בעל רכב משפחתי ממוצע מוציא 950-1,200 ש&quot;ח בחודש על דלק —
            כלומר 11,000-14,500 ש&quot;ח בשנה. במאמר תמצא 12 טיפים מעשיים שיכולים להוריד את החשבון ב-15-25%
            ללא שינוי בהרגלי הנסיעה.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">1. שמור על לחץ אוויר תקין בצמיגים</h2>
          <p>
            צמיגים עם לחץ נמוך מ-10% מהמומלץ גורמים ל<strong>עלייה של 3-4% בצריכת הדלק</strong>.
            בדוק את לחץ האוויר אחת לחודש, וודא שהוא תואם את ההמלצה ברישיון הרכב (לא על דופן הצמיג!).
            <strong> חיסכון פוטנציאלי: 30-50 ש&quot;ח/חודש.</strong>
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">2. הסר משקל מיותר מהרכב</h2>
          <p>
            כל 50 ק&quot;ג נוספים ברכב מעלים את הצריכה ב-1-2%. גגון, שרשראות שלג שלא בעונה, ספרים, כלים —
            הכל מצטבר. <strong>חיסכון: 15-30 ש&quot;ח/חודש.</strong>
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">3. הימנע מהמתנה ארוכה במנוע פועל</h2>
          <p>
            המתנה במנוע פועל מעל 30 שניות צורכת יותר דלק מכיבוי והדלקה מחדש. רוב הרכבים החדשים כבר עושים זאת אוטומטית
            (Stop-Start). אם הרכב שלך אין — כבה את המנוע במקומות עם המתנה צפויה (פסי רכבת, חניות, פקקים ארוכים מאוד).
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">4. נהג בקצב קבוע</h2>
          <p>
            תאוצה אגרסיבית ובלמים פתאומיים מעלים את הצריכה ב-15-30%! נסה לצפות תנועה — אל תאיץ למקום שתעצור בו אחרי 50 מטר.
            השתמש בבקרת שיוט (Cruise Control) בכבישים בין-עירוניים. <strong>חיסכון: 100-200 ש&quot;ח/חודש.</strong>
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">5. חפש את המהירות הכלכלית</h2>
          <p>
            רוב הרכבים יעילים ביותר במהירות 80-90 קמ&quot;ש בהילוך הגבוה ביותר. נסיעה ב-110 קמ&quot;ש במקום 90 קמ&quot;ש
            מעלה את הצריכה ב-20-25%. בכבישים מהירים — שווה לרדת קצת.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">6. השתמש במזגן בחוכמה</h2>
          <p>
            <strong>בעיר (עד 60 קמ&quot;ש):</strong> חלונות פתוחים — חיסכון.<br />
            <strong>בכביש מהיר (מעל 60 קמ&quot;ש):</strong> מזגן + חלונות סגורים — חיסכון. חלונות פתוחים יוצרים גרירה אווירודינמית.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">7. תכנן את הנסיעות מראש</h2>
          <p>
            איחוד נסיעות חוסך עד 30% מהדלק. במקום 3 נסיעות נפרדות לסופר, לרופא ולחברים — נסיעה אחת מתוכננת.
            כשהמנוע חם הוא יעיל יותר; הימנע מהדלקות קרות תכופות.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">8. תדלק בתחנות זולות</h2>
          <p>
            ההפרש בין תחנה זולה ליקרה הוא 0.5-1.5 ש"ח לליטר. על 1,200 ק&quot;מ בחודש — זה 50-150 ש&quot;ח חיסכון.
            כדאי לבדוק במחשבון מחירי דלק (Pelephone, Yellow, וגם אפליקציות כמו דלק) לפני התדלוק.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">9. הקפד על טיפולים תקופתיים</h2>
          <p>
            מסנן אוויר סתום, שמן ישן, מצתים שחוקים — כל אלה מגדילים את צריכת הדלק. טיפול מונע ב-450 ש&quot;ח
            יכול לחסוך 100 ש&quot;ח בחודש בדלק. <Link href="/blog/checklist-lifnei-test" className="text-teal-600 hover:text-teal-700 underline">צ&apos;קליסט תחזוקה כאן</Link>.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">10. עקוב אחרי הצריכה שלך</h2>
          <p>
            איך תדע אם הטיפים עובדים? תיעוד שיטתי. בכל תדלוק — רשום קילומטראז&apos; וכמות. אחרי 3 חודשים תראה מגמה.
            ב-AutoLog זה מתעדכן אוטומטית והמערכת מתריעה אם הצריכה עולה ב-15%+ — סימן לבעיה במנוע.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">11. דלק נכון לרכב שלך</h2>
          <p>
            רכב שדורש 95 אוקטן לא ירוויח כלום מ-98 — בזבוז כסף. רכב שדורש 98 ויקבל 95 — נזק למנוע.
            בדוק במדויק מה הרכב צריך (כתוב ברישיון או ליד פתח התדלוק).
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">12. שקול חלופות לרכב</h2>
          <p>
            לקפיצה לסופר 500 מטר מהבית — לכו ברגל. לעבודה 3 ק&quot;מ — אופניים חשמליות. לפגישה במרכז העיר —
            תחבורה ציבורית או שיתוף נסיעה. כל קילומטר בלי הרכב = 60 אגורות חיסכון.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">סיכום: כמה תחסוך באמת?</h2>
          <p>
            יישום של 6-8 מהטיפים האלה יחד יכול להוריד את חשבון הדלק שלך ב-15-25%.
            לבעל רכב משפחתי שמוציא 1,000 ש&quot;ח בחודש — זה <strong>1,800-3,000 ש&quot;ח בשנה</strong>.
            יותר מהמחיר של ביטוח חובה.
          </p>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">עקוב אחרי כל ההוצאות אוטומטית</h3>
            <p className="text-white/80 mb-5 text-sm">
              AutoLog מתעדת כל תדלוק, מחשבת צריכה ממוצעת, ומתריעה על חריגות. חינם לחלוטין.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1B4E8A]">איזה הטיפ הכי אפקטיבי?</h3>
          <p>נהיגה בקצב קבוע, בלי תאוצות פתאומיות. החיסכון יכול להגיע ל-30%.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">האם תוספים לדלק באמת עובדים?</h3>
          <p>במקרים מסוימים (מנוע ישן, ניקוי מצערת) — כן, חד-פעמי. כפתרון קבוע — בזבוז כסף.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">דלק בנזין או דיזל — מה זול יותר?</h3>
          <p>דיזל זול לליטר, אבל רכבי דיזל יקרים יותר ויש להם תחזוקה יקרה. סה&quot;כ — בנזין ברוב המקרים זול יותר ל-5 שנים.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">האם רכב היברידי באמת חוסך הרבה?</h3>
          <p>כן בעיר (חיסכון של 30-40%), פחות בכבישים מהירים (10-15%). תלוי בסוג הנסיעות.</p>
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
                    { '@type': 'Question', name: 'איזה הטיפ הכי אפקטיבי?', acceptedAnswer: { '@type': 'Answer', text: 'נהיגה בקצב קבוע בלי תאוצות פתאומיות. חיסכון של עד 30%.' } },
                    { '@type': 'Question', name: 'האם תוספים לדלק עובדים?', acceptedAnswer: { '@type': 'Answer', text: 'במקרים מסוימים כן (מנוע ישן, ניקוי מצערת). כפתרון קבוע - בזבוז כסף.' } },
                    { '@type': 'Question', name: 'דלק בנזין או דיזל - מה זול יותר?', acceptedAnswer: { '@type': 'Answer', text: 'בנזין ברוב המקרים זול יותר ל-5 שנים, למרות שדיזל זול לליטר.' } },
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
          <Link href="/blog/haavarat-baalut-al-rechev-2026" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            החלפת בעלות על רכב 2026<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
