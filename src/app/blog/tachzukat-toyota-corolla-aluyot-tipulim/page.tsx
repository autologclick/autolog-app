import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('tachzukat-toyota-corolla-aluyot-tipulim')!;

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
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
    images: [`https://autolog.click/blog/${post.slug}/cover.png`],
  },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1"><ChevronRight size={14} />חזרה לבלוג</Link>
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

          <p>טויוטה קורולה היא אחד הרכבים הפופולריים ביותר בישראל, וזה לא במקרה: היא אמינה, חסכונית, ובאופן יחסי זולה לתחזוקה. אבל עדיין — כדי לשמור עליה במצב מצוין צריך לעקוב אחרי טיפולים תקופתיים, החלפות חלקים שגרתיות, וטיפולים מונעים.</p>

          <p>במאמר הזה תקבלו את כל המידע על תחזוקת קורולה לדגמים השנים האחרונות — תדירויות, עלויות, וטיפים. בסוף נראה איך <strong>אוטולוג</strong> עוקבת אחרי כל זה אוטומטית בשבילכם.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">מה זה קורולה — בקצרה</h2>

          <p>טויוטה קורולה היא רכב משפחתי קומפקטי שמיוצר ע"י טויוטה מאז 1966. בישראל היא בין הרכבים הנמכרים ביותר. הדגמים הנפוצים בכבישים הישראלים:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>קורולה E170</strong> (2013-2018) — דור 11.</li>
  <li><strong>קורולה E210</strong> (2018-היום) — דור 12, גם בנזין וגם היברידי.</li>
  <li><strong>קורולה היברידית</strong> (2019-היום) — גרסה היברידית פופולרית במיוחד.</li>
</ul>

          <p>הטיפולים והעלויות משתנים מעט בין הדגמים. כאן נביא ממוצעים שמתאימים לרוב הקורולות בכבישי ישראל.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">טיפולי תקופה — מה ומתי</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">טיפול שגרתי — כל 10,000-15,000 ק"מ</h3>

          <p>הטיפול הבסיסי שכל קורולה צריכה. כולל:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>החלפת שמן מנוע</strong> — שמן 0W-20 או 5W-30 (לפי דגם).</li>
  <li><strong>החלפת מסנן שמן</strong> — תמיד יחד עם השמן.</li>
  <li><strong>בדיקת רמות נוזלים</strong> — בלמים, נוזל קירור, הגה כוח, שמשות.</li>
  <li><strong>בדיקת ביצועי בלמים</strong> — עובי רפידות, מצב דיסקיות.</li>
  <li><strong>בדיקת צמיגים</strong> — לחץ, עובי, שחיקה.</li>
</ul>

          <p><strong>עלות ממוצעת:</strong> 350-500 ש"ח במוסך מורשה טויוטה. <strong>250-400 ש"ח במוסך פרטי</strong>.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">טיפול בינוני — כל 30,000-40,000 ק"מ</h3>

          <p>מעבר לטיפול שגרתי, מתווסף:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>החלפת מסנן אוויר</strong> — חיוני להגנה על המנוע.</li>
  <li><strong>החלפת מסנן תא נוסעים</strong> — להגנה על האוורור.</li>
  <li><strong>בדיקת מערכת בלמים מעמיקה</strong> — כולל פיתוח אם צריך.</li>
  <li><strong>בדיקת מצבר</strong> — מתח, יכולת אגירה.</li>
</ul>

          <p><strong>עלות ממוצעת:</strong> 700-1,000 ש"ח.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">טיפול גדול — כל 60,000-80,000 ק"מ</h3>

          <p>הטיפול היקר ביותר, אבל גם הכי חשוב:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>כל מה שבטיפול הבינוני.</li>
  <li><strong>החלפת נוזל בלמים</strong> — חובה כל 2 שנים.</li>
  <li><strong>החלפת מסנן דלק</strong> — דגמי דיזל.</li>
  <li><strong>החלפת מצתים</strong> — לדגמי בנזין (איזה לבחור: NGK/Denso אירידיום).</li>
  <li><strong>בדיקת מערכת הצינון</strong> — תמיד יחד עם החלפת מים.</li>
</ul>

          <p><strong>עלות ממוצעת:</strong> 1,500-2,500 ש"ח.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">טיפול גדול במיוחד — כל 100,000-120,000 ק"מ</h3>

          <p>בנוסף לכל הקודם:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>החלפת שרשרת תזמון / רצועת תזמון</strong> — לדגמים מסוימים בלבד.</li>
  <li><strong>החלפת נוזל גיר אוטומטי</strong> — כל 80-100K.</li>
  <li><strong>החלפת רפידות בלמים אחוריים</strong> — לרוב נשחקות אחרי 60-80K.</li>
</ul>

          <p><strong>עלות ממוצעת:</strong> 2,500-4,000 ש"ח.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">החלפות שגרתיות — מתי וכמה</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">שמן מנוע</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>תדירות:</strong> כל 10,000 ק"מ או שנה אחת (המוקדם מבין השניים).</li>
  <li><strong>כמות:</strong> 4-5 ליטרים, תלוי בדגם.</li>
  <li><strong>סוג שמן:</strong> סינטטי 0W-20 לרוב הדגמים החדשים, 5W-30 לדגמים ישנים יותר.</li>
  <li><strong>עלות שמן בלבד:</strong> 150-250 ש"ח.</li>
</ul>

          <blockquote className="border-r-4 border-teal-500 pr-4 my-4 italic text-gray-600"><strong>טיפ:</strong> קורולה היברידית רגישה יותר לסוג השמן. תקפידו על שמן Toyota Genuine או מקבילה איכותית.</blockquote>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">צמיגים</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>תדירות:</strong> כל 40,000-60,000 ק"מ, או כשהם נשחקים מתחת ל-1.6 מ"מ (חוק חובה).</li>
  <li><strong>כמות:</strong> 4 צמיגים (5 אם רוצים שיש לכם רזרבה זהה).</li>
  <li><strong>גודל לקורולה:</strong> רוב הדגמים — 195/65R15 או 205/55R16.</li>
  <li><strong>עלות סט מלא:</strong> 1,200-2,400 ש"ח, תלוי במותג (Bridgestone, Michelin, Continental).</li>
</ul>

          <blockquote className="border-r-4 border-teal-500 pr-4 my-4 italic text-gray-600"><strong>טיפ:</strong> באוטולוג אפשר לתעד את תאריך החלפת הצמיגים ולקבל תזכורת אוטומטית כשהזמן להחליף שוב.</blockquote>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">רפידות בלמים</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>תדירות קדמיות:</strong> 30,000-50,000 ק"מ.</li>
  <li><strong>תדירות אחוריות:</strong> 60,000-80,000 ק"מ.</li>
  <li><strong>עלות סט קדמי:</strong> 250-500 ש"ח חלפים + 150-250 ש"ח עבודה.</li>
  <li><strong>עלות סט אחורי:</strong> 200-400 ש"ח חלפים + 150-200 ש"ח עבודה.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">מצבר</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>תדירות:</strong> 4-6 שנים, תלוי בשימוש.</li>
  <li><strong>עלות:</strong> 350-700 ש"ח לקורולה רגילה, 800-1,500 ש"ח לקורולה היברידית (מצבר עזר).</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">נוזל בלמים</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>תדירות:</strong> כל 2 שנים (חובה לבטיחות).</li>
  <li><strong>עלות:</strong> 150-250 ש"ח.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">נוזל קירור (מערכת קירור)</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>תדירות:</strong> כל 4-5 שנים או 80,000 ק"מ.</li>
  <li><strong>עלות:</strong> 200-400 ש"ח.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">גוונט (לפי דגם)</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>מערכת פליטה (EGR):</strong> רק אם יש בעיה. עלות תיקון: 800-2,500 ש"ח.</li>
</ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">טיפולים מיוחדים לקורולה היברידית</h2>

          <p>קורולה היברידית דורשת תשומת לב מיוחדת לכמה רכיבים:</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">מצבר היברידי (Hybrid Battery)</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>אורך חיים:</strong> 8-10 שנים בממוצע. טויוטה נותנת אחריות 8 שנים.</li>
  <li><strong>עלות החלפה:</strong> 12,000-20,000 ש"ח. כן, הרבה.</li>
  <li><strong>טיפ:</strong> אם המצבר ההיברידי מתחיל להחליש — שווה לבדוק שדרוג ב-Aftermarket במקום החלפה מלאה. יש מוסכים מתמחים שיודעים לחדש סוללות.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">מערכת היברידית</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>בדיקה תקופתית:</strong> כל 30,000 ק"מ.</li>
  <li><strong>עלות:</strong> 250-400 ש"ח, בדיקה בלבד.</li>
  <li><strong>מומלץ:</strong> מוסך מורשה טויוטה לבדיקות היברידיות.</li>
</ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">עלויות שנתיות ממוצעות — קורולה 2019</h2>

          <p>הנה טבלת עלויות התחזוקה השנתיות הממוצעות לקורולה 2019 בנזין שעושה 15,000 ק"מ בשנה:</p>

          <div className="overflow-x-auto my-6">
<table className="w-full border-collapse border border-gray-300">
<thead><tr><th className="border border-gray-300 px-4 py-2 bg-teal-50 text-right font-bold">פריט</th><th className="border border-gray-300 px-4 py-2 bg-teal-50 text-right font-bold">עלות שנתית</th></tr></thead>
<tbody>
<tr><td className="border border-gray-300 px-4 py-2">טיפול שגרתי (1-2 בשנה)</td><td className="border border-gray-300 px-4 py-2">600-1,000 ש"ח</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">טיפול בינוני (כל שנתיים)</td><td className="border border-gray-300 px-4 py-2">350-500 ש"ח (ממוצע)</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">טיפול גדול (כל 3-4 שנים)</td><td className="border border-gray-300 px-4 py-2">500-800 ש"ח (ממוצע)</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">החלפת צמיגים (כל 3 שנים)</td><td className="border border-gray-300 px-4 py-2">600-800 ש"ח (ממוצע)</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">החלפת רפידות (כל 3 שנים)</td><td className="border border-gray-300 px-4 py-2">250-400 ש"ח (ממוצע)</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">תקלות לא צפויות</td><td className="border border-gray-300 px-4 py-2">500-1,500 ש"ח</td></tr>
<tr><td className="border border-gray-300 px-4 py-2"><strong>סך הכל שנתי</strong></td><td className="border border-gray-300 px-4 py-2"><strong>2,800-5,000 ש"ח</strong></td></tr>
</tbody>
</table>
</div>

          <p>זה לפני דלק, ביטוח, טסט ואגרת רישוי.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">טיפים לחיסכון בתחזוקת קורולה</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">1. נסיעה רגועה</h3>

          <p>האצות חדות ובלימות פתאומיות שוחקות רפידות, צמיגים ובלמים מהר יותר. נהיגה רגועה מאריכה חיים של הכל.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">2. בדיקות עצמיות</h3>

          <p>פעם בחודש: לחץ צמיגים, רמות שמן, רמות נוזלים. זה לוקח 5 דקות וחוסך הרבה כסף.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">3. שמירת היסטוריית טיפולים</h3>

          <p>אם אתם מתכננים למכור את הקורולה — היסטוריה מתועדת שווה אלפי שקלים. אוטולוג שומרת הכל אוטומטית.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">4. מוסך פרטי טוב</h3>

          <p>טיפול במוסך מורשה טויוטה עולה 40-60% יותר מבמוסך פרטי טוב. אם הקורולה לא בתוקף אחריות — שווה לבחור מוסך פרטי מומלץ.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">5. השוואת מחירים</h3>

          <p>לפני כל טיפול גדול — תקבלו לפחות 2-3 הצעות מחיר. בקורולה ההפרשים יכולים להגיע ל-30-40%.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">איך אוטולוג עוקבת אחרי תחזוקת הקורולה שלכם</h2>

          <p>זאת הנקודה החזקה ביותר של <strong>אוטולוג</strong> למשתמשים שיש להם קורולה:</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">תזכורות אוטומטיות לטיפולים</h3>

          <p>אוטולוג יודעת את התדירויות הסטנדרטיות של קורולה. ברגע שמתעדים החלפת שמן או טיפול, אוטולוג יוצרת אוטומטית תזכורת לטיפול הבא — לפי ק"מ או לפי זמן.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">תיעוד היסטוריה מלאה</h3>

          <p>כל טיפול שעשיתם נשמר באוטולוג — תאריך, מה בוצע, באיזה מוסך, וכמה עלה. כשתבואו למכור את הקורולה — ההיסטוריה הזו שווה אלפי שקלים בערך השוק.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">השוואה למחירים ממוצעים</h3>

          <p>אוטולוג יודעת את המחירים הממוצעים של טיפולים לקורולה. אחרי כל טיפול, אוטולוג יכולה להגיד לכם אם שילמתם במחיר הוגן, נמוך, או גבוה.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">עוזר AI לקורולה</h3>

          <p>יש לכם שאלה על הקורולה? אוטולוג עונה. דוגמאות:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>"מה זה הרעש שמשמיע המזגן בקורולה שלי?"</li>
  <li>"כמה צריך לעלות החלפת תיבת הילוכים בקורולה 2018?"</li>
  <li>"האם החלפת מצבר בקורולה היברידית שווה את המחיר שביקשו ממני?"</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">סריקת קבלות אוטומטית</h3>

          <p>כל קבלה ממוסך — מצלמים, ואוטולוג ממלאת אוטומטית את התאריך, סוג הטיפול, והעלות. אין יותר קבלות מעופפות.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שאלות נפוצות על תחזוקת קורולה</h2>

          <p><strong>ש: כמה זמן צריך לעשות טיפול בקורולה?</strong> ת: טיפול שגרתי — 1-2 שעות. טיפול גדול — 3-5 שעות.</p>

          <p><strong>ש: האם חובה לעשות טיפול במוסך מורשה?</strong> ת: רק אם הרכב באחריות. אחרי שעבר 3 שנים — מוסך פרטי טוב זול ב-30-40%.</p>

          <p><strong>ש: כמה זמן קורולה תעמוד?</strong> ת: עם תחזוקה נכונה — 300,000+ ק"מ ללא בעיות. קורולה מהדורות הראשונים הגיעו ל-500,000+.</p>

          <p><strong>ש: האם קורולה היברידית עולה יותר לתחזק?</strong> ת: בטיפולים שוטפים — דומה לבנזין. בעיה אחת היא המצבר ההיברידי, שאם נשבר אחרי האחריות — יקר.</p>

          <p><strong>ש: איך אוטולוג עוזרת בתחזוקת הקורולה?</strong> ת: תזכורות אוטומטיות לטיפולים, תיעוד מלא של היסטוריה, השוואת מחירים, ועוזר AI לכל שאלה.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">סיכום</h2>

          <p>קורולה היא רכב יחסית זול ופשוט לתחזק — אבל זה לא אומר ש"זוכרים את הטיפול הבא לבד" עובד. עלויות הולכות ומצטברות, וקבלות נעלמות.</p>

          <p><strong>אוטולוג עוקבת אחרי הכל אוטומטית.</strong> מהרגע שמוסיפים את הקורולה לחשבון, אוטולוג מתחילה לתעד, לתזכר, ולנתח את ההוצאות.</p>

          <p><Link href="https://autolog.click/auth/signup" className="text-teal-600 hover:text-teal-700 underline">הירשמו לאוטולוג בחינם</Link> ותראו איך הקורולה שלכם מנוהלת בצורה חכמה יותר.</p>

          {/* CTA */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-8 my-10 text-center not-prose">
            <h3 className="text-2xl font-bold mb-3">מתחילים עם אוטולוג עכשיו</h3>
            <p className="text-white/90 mb-6 text-base leading-relaxed">
              אוטולוג מאחדת את כל הניהול של הרכב — תזכורות אוטומטיות, סריקת מסמכים עם AI, מעקב הוצאות, היסטוריית טיפולים ועוזר AI אישי. בעברית. בחינם. ללא הורדה.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-cream-500 text-white font-bold text-lg rounded-xl hover:bg-cream-600 transition shadow-lg">
              הרשמה לאוטולוג חינם<ArrowLeft size={18} />
            </Link>
          </div>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.description,
              datePublished: post.publishedAt,
              dateModified: post.updatedAt || post.publishedAt,
              image: [`https://autolog.click/blog/${post.slug}/cover.png`],
              author: { '@type': 'Organization', name: 'אוטולוג', url: 'https://autolog.click' },
              publisher: {
                '@type': 'Organization',
                name: 'אוטולוג',
                logo: { '@type': 'ImageObject', url: 'https://autolog.click/logo.png', width: 512, height: 512 },
              },
              mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
              inLanguage: 'he-IL',
              articleSection: post.category,
              keywords: post.keywords.join(', '),
              isPartOf: { '@type': 'Blog', name: 'בלוג אוטולוג', url: 'https://autolog.click/blog' },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'אוטולוג', item: 'https://autolog.click' },
                { '@type': 'ListItem', position: 2, name: 'בלוג', item: 'https://autolog.click/blog' },
                { '@type': 'ListItem', position: 3, name: post.title, item: `https://autolog.click/blog/${post.slug}` },
              ],
            },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">חזרה לעמוד הבית<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} אוטולוג (AutoLog). כל הזכויות שמורות.</p></footer>
    </div>
  );
}
