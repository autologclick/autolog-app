import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('hachlafat-shemen-rechev-mechir-2026')!;

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
            החלפת שמן היא אחת התחזוקות הבסיסיות והחשובות ביותר ברכב. שמן ישן או באיכות נמוכה הוא הסיבה מספר 1 לתקלות מנוע יקרות (5,000-30,000 ש&quot;ח לתיקון). במאמר נסביר כמה זה עולה, מתי להחליף, ואיך לבחור שמן נכון.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">למה החלפת שמן כל כך חשובה?</h2>
          <p>שמן מנוע עושה 4 דברים קריטיים:</p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>סיכה</strong> — מונע שחיקה בין חלקי המנוע</li>
            <li><strong>קירור</strong> — מפזר חום מאזורים חמים</li>
            <li><strong>ניקוי</strong> — סוחב לכלוך והרבדים</li>
            <li><strong>איטום</strong> — שומר על לחץ ועל ביצועים</li>
          </ul>
          <p>כששמן מתבלה — כל הפונקציות נפגעות, והמנוע מתחיל להישחק במהירות.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מתי להחליף שמן 2026?</h2>
          <p>ההמלצה המעודכנת לרוב הרכבים החדשים:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>שמן מינרלי:</strong> כל 5,000-7,500 ק&quot;מ או חצי שנה</li>
            <li><strong>שמן סינטטי-חצי:</strong> כל 7,500-10,000 ק&quot;מ או שנה</li>
            <li><strong>שמן סינטטי מלא:</strong> כל 10,000-15,000 ק&quot;מ או שנה</li>
            <li><strong>רכבי יוקרה (BMW, מרצדס):</strong> כל 15,000-20,000 ק&quot;מ — לפי המחשב הפנימי</li>
          </ul>
          <p><strong>חוק האצבע:</strong> תמיד החליפו לפי <em>מה שמגיע קודם</em> — קילומטראז&apos; או זמן.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">כמה עולה החלפת שמן 2026?</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">לפי סוג שמן:</h3>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>שמן מינרלי:</strong> 250-350 ש&quot;ח</li>
            <li><strong>שמן סינטטי-חצי:</strong> 350-500 ש&quot;ח</li>
            <li><strong>שמן סינטטי מלא:</strong> 500-800 ש&quot;ח</li>
            <li><strong>שמן מקורי יצרן (BMW/מרצדס):</strong> 800-1,400 ש&quot;ח</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">לפי סוג רכב:</h3>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב משפחתי קטן (יאריס, פיקנטו):</strong> 280-450 ש&quot;ח (3-4 ליטר)</li>
            <li><strong>רכב משפחתי רגיל (קורולה, מאזדה 3):</strong> 350-550 ש&quot;ח (4-5 ליטר)</li>
            <li><strong>SUV (טיגון, RAV4):</strong> 450-700 ש&quot;ח (5-6 ליטר)</li>
            <li><strong>רכב יוקרה:</strong> 700-1,400 ש&quot;ח (5-8 ליטר שמן יקר)</li>
            <li><strong>רכב דיזל:</strong> +50-100 ש&quot;ח (שמן ספציפי)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה כולל המחיר?</h2>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>שמן מנוע (4-7 ליטר תלוי ברכב)</li>
            <li>פילטר שמן חדש</li>
            <li>עבודה (החלפה, ניקוי, בדיקה)</li>
            <li>פינוי שמן ישן</li>
          </ul>
          <p><strong>טיפ:</strong> תמיד וודאו שהפילטר מוחלף יחד עם השמן. בלי זה — בזבוז.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך לבחור שמן נכון לרכב?</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. תבדקו במדריך הרכב</h3>
          <p>היצרן מציין במדויק את סוג השמן, הצמיגות (5W-30, 0W-20 וכו&apos;) והתקנים. אל תסטו מזה.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. לרכב חדש — שמן סינטטי מלא</h3>
          <p>כל רכב מ-2015 ומעלה מומלץ עם סינטטי מלא. עולה יותר אבל מחזיק יותר זמן.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. לרכב ישן (10+ שנים)</h3>
          <p>שמן מינרלי או חצי-סינטטי מתאים, ועולה פחות. סינטטי מלא ברכב ישן יכול לגרום לדליפות.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. צמיגות נכונה (Viscosity)</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>0W-20 או 5W-20:</strong> רכבים חדשים יפניים (טויוטה, הונדה)</li>
            <li><strong>5W-30:</strong> הכי נפוץ — רוב הרכבים החדשים</li>
            <li><strong>10W-40:</strong> רכבים ישנים יותר</li>
            <li><strong>15W-40:</strong> רכבים מאוד ישנים או דיזל</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך לחסוך על החלפת שמן</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>השוו מחירים</strong> בין מוסכים — ההבדל יכול להגיע ל-200 ש&quot;ח</li>
            <li><strong>קחו שמן ופילטר מהאינטרנט</strong> והביאו למוסך — יוצא לפעמים זול יותר</li>
            <li><strong>אל תרדפו אחרי שמן יוקרתי</strong> אם הרכב לא דורש</li>
            <li><strong>התעלמו מאקסטרות מיותרות</strong> — &quot;תוסף לשמן&quot; שמוסכים מציעים לרוב לא נחוץ</li>
            <li><strong>הזמינו תור ביום לא עמוס</strong> — לפעמים מקבלים הנחה</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">סימני אזהרה — שמן צריך החלפה דחופה</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>נורת &quot;Check Engine&quot; דולקת</li>
            <li>נורת שמן בלוח השעונים</li>
            <li>קולות חבטה במנוע</li>
            <li>עשן כחול מהאגזוז</li>
            <li>צריכת דלק עלתה משמעותית</li>
            <li>שמן שחור כקפה (במקום חום ענברי)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה לעשות אם פספסתם החלפה</h2>
          <p>אל תיכנסו לפאניקה — אבל אל תתעלמו. אם פספסתם החלפה ב-2,000-5,000 ק&quot;מ:</p>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li>הזמינו תור למוסך השבוע</li>
            <li>בקשו &quot;שטיפת מנוע&quot; (Flush) לפני המילוי החדש</li>
            <li>אל תאיצו במהירות גבוהה עד החלפה</li>
            <li>הימנעו מנסיעות ארוכות עד החלפה</li>
          </ol>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תזכורת אוטומטית להחלפת שמן</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog מחשבת את הקילומטראז&apos; ושולחת תזכורת בדיוק מתי להחליף שמן — בהתאם לרכב הספציפי שלכם.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">הרשמה בחינם<ArrowLeft size={16} /></Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>
          <h3 className="text-lg font-bold text-[#1e3a5f]">האם אפשר להחליף שמן בבית?</h3>
          <p>אפשר, אבל דורש כלים ומיומנות. רוב האנשים מעדיפים מוסך — חיסכון של 100 ש&quot;ח לא שווה את הסיכון.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">שמן מקורי יצרן או חליפי?</h3>
          <p>חליפי איכותי (Mobil, Castrol, Shell) טוב לא פחות מהמקורי, ולרוב זול ב-30-50%.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מתי להחליף שמן בהיברידי?</h3>
          <p>פחות תכוף — בערך כל 15,000-20,000 ק&quot;מ או שנה. המנוע עובד פחות.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">חשמלי צריך החלפת שמן?</h3>
          <p>לא! ברכב חשמלי מלא אין מנוע בנזין ולכן אין שמן מנוע. יש שמן בגיר (לעיתים) — תחזוקה מינימלית.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">למה השמן שחור?</h3>
          <p>שמן צובר לכלוך ופחמן עם הזמן. זה תקין. אם הוא שחור כמו זפת והקילומטראז&apos; קרוב לעדכון — הגיע הזמן.</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` } },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: 'מתי להחליף שמן רכב?', acceptedAnswer: { '@type': 'Answer', text: 'בהתאם לסוג השמן: מינרלי כל 5,000-7,500 ק"מ, סינטטי מלא כל 10,000-15,000 ק"מ.' } },
              { '@type': 'Question', name: 'כמה עולה החלפת שמן 2026?', acceptedAnswer: { '@type': 'Answer', text: 'בין 250-1,400 ש"ח, בהתאם לסוג השמן וגודל המנוע. לרכב משפחתי רגיל סביב 350-550 ש"ח.' } },
              { '@type': 'Question', name: 'חשמלי צריך החלפת שמן?', acceptedAnswer: { '@type': 'Answer', text: 'לא. ברכב חשמלי מלא אין מנוע בנזין ולכן אין שמן מנוע.' } },
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/blog/pgia-be-rechev-chone-ma-laasot" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">פגעו ברכב החונה — מה לעשות<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
