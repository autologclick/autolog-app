import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('bdika-lifnei-kniyat-rechev-ashdod')!;

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

          <p>קנייה של רכב יד שנייה באשדוד או באזור — כלל ראשון לפני שאתם משלמים, <strong>תבדקו אותו במכון מקצועי</strong>. בדיקה במכון מורשה היא ההבדל בין רכב במצב מצוין ובין הפתעה יקרה תוך חודש מהקנייה.</p>

          <p>במאמר הזה תקבלו את כל המידע הדרוש: מכוני בדיקה מובילים באשדוד, מה הבדיקה כוללת, כמה זה עולה, ואיך <strong>אוטולוג</strong> עוזרת לכם לזכור את התוצאות ולנהל את הרכב מהיום שאתם מקבלים אותו.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">למה חובה לבדוק רכב לפני קניית רכב יד שנייה באשדוד?</h2>

          <p>מי שמוכר רכב לא תמיד גלוי לחלוטין על מצבו. גם מי שמוכר בכוונה טובה לא בהכרח יודע על:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>שלדה שנפגעה ותוקנה.</li>
  <li>מנוע שנפתח.</li>
  <li>תיבת הילוכים בעייתית.</li>
  <li>מערכת בלמים לקראת החלפה.</li>
  <li>מד מרחק (קילומטראז') שמוטל בו (מקרים נדירים אבל קיימים).</li>
</ul>

          <p><strong>בדיקה במכון מקצועי עולה 250-500 ש"ח ויכולה לחסוך לכם 5,000-30,000 ש"ח.</strong> זה הביטוח הכי טוב שתעשו במהלך הקנייה.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">מכוני בדיקה מובילים באשדוד והאזור</h2>

          <blockquote className="border-r-4 border-teal-500 pr-4 my-4 italic text-gray-600">הערה: המידע למטה נכון ל-2026. אנחנו ממליצים לאמת מחירים ושעות בטלפון לפני שמגיעים.</blockquote>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">1. מכון פולוקס אשדוד</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>כתובת:</strong> רחוב הנגרים, אזור התעשייה אשדוד.</li>
  <li><strong>מחיר בדיקה כללית:</strong> 280-350 ש"ח.</li>
  <li><strong>שעות:</strong> א-ה 7:30-17:00, ו 7:30-13:00.</li>
  <li><strong>מה כלול:</strong> בדיקת מצב טכני, מערכת בלמים, מערכת הזרקה, תקלות OBD, מצב גלגלים, חלוקת משקל.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">2. מכון אפרים — אשדוד</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>כתובת:</strong> אזור התעשייה הצפוני, אשדוד.</li>
  <li><strong>מחיר בדיקה כללית:</strong> 300-400 ש"ח.</li>
  <li><strong>שעות:</strong> א-ה 8:00-16:30, ו 8:00-12:00.</li>
  <li><strong>המלצה מיוחדת:</strong> מומחים ברכבים אירופיים.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">3. מכון רכבים בן זקן (סגן בנגב הצפוני)</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>כתובת:</strong> רחוב הצורף, אשדוד.</li>
  <li><strong>מחיר בדיקה כללית:</strong> 250-320 ש"ח.</li>
  <li><strong>שעות:</strong> א-ה 7:00-17:00, ו 7:00-13:00.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">4. מכון אסולין רכבים — לכיש (כ-20 דקות נסיעה)</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>כתובת:</strong> קריית מלאכי.</li>
  <li><strong>מחיר בדיקה כללית:</strong> 280-350 ש"ח.</li>
  <li><strong>שעות:</strong> א-ה 8:00-17:00.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">5. מכון יבנה (כ-15 דקות נסיעה)</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>כתובת:</strong> אזור התעשייה יבנה.</li>
  <li><strong>מחיר בדיקה כללית:</strong> 270-340 ש"ח.</li>
</ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">כמה עולה בדיקת רכב באשדוד? טבלת מחירים</h2>

          <div className="overflow-x-auto my-6">
<table className="w-full border-collapse border border-gray-300">
<thead><tr><th className="border border-gray-300 px-4 py-2 bg-teal-50 text-right font-bold">סוג בדיקה</th><th className="border border-gray-300 px-4 py-2 bg-teal-50 text-right font-bold">מחיר ממוצע באשדוד</th></tr></thead>
<tbody>
<tr><td className="border border-gray-300 px-4 py-2">בדיקה כללית (טכנית)</td><td className="border border-gray-300 px-4 py-2">250-400 ש"ח</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">בדיקת מנוע מעמיקה</td><td className="border border-gray-300 px-4 py-2">400-600 ש"ח</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">בדיקת שלדה</td><td className="border border-gray-300 px-4 py-2">200-300 ש"ח</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">בדיקה משולבת מלאה</td><td className="border border-gray-300 px-4 py-2">500-800 ש"ח</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">בדיקת מערכת חשמל</td><td className="border border-gray-300 px-4 py-2">200-300 ש"ח</td></tr>
<tr><td className="border border-gray-300 px-4 py-2">OBD2 ואבחון תקלות</td><td className="border border-gray-300 px-4 py-2">100-200 ש"ח</td></tr>
</tbody>
</table>
</div>

          <p><strong>מחיר ממוצע לבדיקה מלאה באשדוד: 350-500 ש"ח.</strong></p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">מה כוללת בדיקה במכון באשדוד?</h2>

          <p>בדיקה תקנית במכון מורשה כוללת:</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">1. בדיקה ויזואלית</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>שלדה — חיפוש סימני תיקון מאחור (תאונה).</li>
  <li>מכל דלק וצינורות — דליפות.</li>
  <li>מצב המרכב — שריטות, חלקים שיש להחליף.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">2. בדיקת מנוע</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>אבחון OBD — קודי שגיאה.</li>
  <li>בדיקת לחץ דלק.</li>
  <li>בדיקת עשן מהמפלט (עשן שחור = בעיה).</li>
  <li>בדיקת רעידות.</li>
  <li>מצב שמן, נוזל בלמים, צידנית.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">3. בדיקת תיבת הילוכים</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>מצב נוזל הגיר.</li>
  <li>העברת הילוכים חלקה.</li>
  <li>אין רעשים בעת ריצה.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">4. בדיקת מערכת בלמים</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>עובי רפידות.</li>
  <li>מצב דיסקיות.</li>
  <li>בדיקת ABS.</li>
  <li>רעידות בלימה.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">5. בדיקת מתלים והגה</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>מצב משככי זעזועים.</li>
  <li>בולמי זעזועים — האם נדרשים החלפה.</li>
  <li>הגה — האם יש משחק חופשי.</li>
  <li>מצב גלגלים — נכון בכיוון.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">6. בדיקת מערכת חשמל</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>מצב מצבר.</li>
  <li>ביצועי דינמו.</li>
  <li>חשמל לנורות וכפתורים.</li>
  <li>מערכת מולטימדיה ומיזוג.</li>
</ul>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">7. נסיעת מבחן</h3>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>כל מערכת בפעולה.</li>
  <li>רעשים מיוחדים בנהיגה.</li>
  <li>האם הרכב מושך לצד מסוים.</li>
  <li>ביצועי בלמים בעצירת חירום.</li>
</ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">טיפים לבדיקת רכב באשדוד</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">1. תזמין מראש</h3>

          <p>מכוני בדיקה באשדוד עמוסים, בעיקר ב-ימים א'-ב' וביום ו'. תזמין תור 2-3 ימים מראש.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">2. תהיה נוכח</h3>

          <p>אל תשלחו את המוכר לבדיקה לבד. תהיו שם. תקשיבו למה שהבודק אומר. תשאלו שאלות.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">3. תקבל דוח כתוב</h3>

          <p>כל מכון בדיקה רציני נותן דוח כתוב עם ממצאים. שמרו את זה — באוטולוג זה מתועד אוטומטית.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">4. אל תקנו ביום הבדיקה</h3>

          <p>תקבלו את הדוח, תחזרו הביתה, תקראו, תחשבו. רק אז תחזרו לקנות.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">5. עוד שתי בדיקות חיוניות</h3>

          <p>מעבר לבדיקה הטכנית, בדקו גם:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>רישומי משטרה ושעבודים</strong> — דרך משרד התחבורה.</li>
  <li><strong>היסטוריית טיפולים</strong> — בקשו ממוכר את הקבלות.</li>
</ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">דברים שכדאי לדעת ספציפית לאשדוד</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">תנאי הים והלחות</h3>

          <p>אשדוד היא עיר חוף. <strong>לחות מהים שוחקת חלקי מתכת</strong>:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>שלדות הולכות חלודות מהר יותר.</li>
  <li>צירי תליה ובלמים נשחקים מהר.</li>
  <li>בלוקים ותושבות גומי מתבלים מוקדם.</li>
</ul>

          <p>לפני קניית רכב באשדוד, <strong>תבדקו במיוחד את החלקים מתחת לרכב</strong> — שלדה, צירים, בלמים. מי שעשה את הרכב באזור החוף 7+ שנים — צריך לבדוק עוד יותר.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">העברת בעלות</h3>

          <p>לאחר בדיקה ירוקה והסכמה על מחיר, אתם עוברים לתהליך העברת בעלות. אפשר לבצע אונליין דרך משרד התחבורה. מאמר מפורט: <Link href="/blog/haavarat-baalut-al-rechev-2026" className="text-teal-600 hover:text-teal-700 underline">העברת בעלות על רכב 2026 — מדריך מלא</Link>.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">אחרי הקנייה — איך אוטולוג עוזרת לכם</h2>

          <p>קניתם רכב באשדוד? מזל טוב! עכשיו אוטולוג נכנסת לתמונה:</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">1. תיעוד הרכב באוטולוג</h3>

          <p>לוקח דקה: נכנסים ל-<Link href="https://autolog.click" className="text-teal-600 hover:text-teal-700 underline">autolog.click</Link>, מוסיפים את מספר הרישוי, ואוטולוג שולפת אוטומטית את כל הפרטים — יצרן, דגם, שנה, צבע.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">2. שמירת דוח הבדיקה</h3>

          <p>מצלמים את הדוח שקיבלתם מהמכון. אוטולוג סורקת אוטומטית עם AI ושומרת — תאריך הבדיקה, ממצאים, המלצות.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">3. תזכורות לטיפולים שצוינו בדוח</h3>

          <p>המוסך כתב שצריך להחליף רפידות בעוד 3,000 ק"מ? אוטולוג יוצרת תזכורת אוטומטית.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">4. תזכורת לטסט וביטוח</h3>

          <p>אוטולוג שולחת תזכורת חודש לפני הטסט הבא ולפני חידוש הביטוח. אין סיכוי לפספס.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">5. מעקב הוצאות מהיום הראשון</h3>

          <p>כל הוצאה — דלק, מוסכים, חניות באשדוד — מתועדת. בסוף החודש תדעו בדיוק כמה הרכב עולה לכם.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A] pt-4 mt-2">6. עוזר AI אישי</h3>

          <p>יש לכם שאלה על הרכב החדש? אוטולוג עונה. "מה זה הרעש הזה?" "כמה צריך לעלות החלפת מצמד?" — תקבלו תשובה תוך שניות.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שאלות נפוצות</h2>

          <p><strong>ש: כמה זמן לוקחת בדיקת רכב באשדוד?</strong> ת: בדיקה כללית — 30-45 דקות. בדיקה מקיפה — 60-90 דקות.</p>

          <p><strong>ש: האם המוכר יכול להגיע איתי לבדיקה?</strong> ת: כן, בדרך כלל זה אפילו נהוג. רק תוודאו שאתם משלמים על הבדיקה (לא הוא) כדי שלא יהיה ניגוד עניינים.</p>

          <p><strong>ש: מה אם הבדיקה גילתה בעיות?</strong> ת: יש שתי אפשרויות: לבקש הנחה במחיר השווה לתיקון, או לוותר. בכל מקרה — אל תקנו ממקור ש"מסתיר" בעיות.</p>

          <p><strong>ש: האם בדיקת רכב באשדוד יקרה יותר מבמרכז?</strong> ת: דומה. תל אביב לפעמים מעט יקרה יותר, אבל ההפרשים קטנים. שווה לבדוק 2-3 מכונים באשדוד לפני שמחליטים.</p>

          <p><strong>ש: איך אוטולוג עוזרת אחרי הקנייה?</strong> ת: אוטולוג מנהלת לכם את הרכב — תזכורות, מסמכים, הוצאות, היסטוריה — הכל אוטומטי וחינם.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">סיכום</h2>

          <p>קניית רכב יד שנייה באשדוד יכולה להיות עסקה מצוינת — אבל <strong>רק עם בדיקה מקצועית במכון מורשה</strong>. השקעה של 350-500 ש"ח עכשיו יכולה לחסוך לכם אלפי שקלים בעתיד.</p>

          <p>אחרי הקנייה, <Link href="https://autolog.click/auth/signup" className="text-teal-600 hover:text-teal-700 underline">הירשמו לאוטולוג בחינם</Link> — והרכב החדש שלכם יתנהל אוטומטית, ללא מאמץ.</p>

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
