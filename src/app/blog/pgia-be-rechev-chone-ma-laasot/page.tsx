import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('pgia-be-rechev-chone-ma-laasot')!;

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
            יוצאים לרכב בבוקר ומגלים שריטה גדולה, פגוש מעוך או מראה שבורה — בלי פתק ובלי הסבר. זה תרחיש מעצבן וגם משפטי. במאמר נסביר בדיוק מה לעשות, איך לתבוע פיצוי, ומה אומר החוק הישראלי על &quot;פגע וברח&quot; ברכב חונה.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה החוק אומר?</h2>
          <p>
            על פי <strong>סעיף 64א&apos; לפקודת התעבורה</strong>, נהג שגרם נזק לרכב חונה <strong>חייב להשאיר פרטים</strong> (שם, מס&apos; טלפון, פוליסת ביטוח). אי-השארת פרטים = עבירה פלילית. הענישה:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>קנס של עד 2,200 ש&quot;ח</li>
            <li>נקודות רישוי</li>
            <li>פסילת רישיון אפשרית</li>
            <li>במקרים חמורים — מאסר עד שנה</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה לעשות מיד כשמגלים נזק?</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">1. אל תזיזו את הרכב</h3>
          <p>אם זה אפשרי, השאירו את הרכב בדיוק איפה שהוא. צילומים יחזקו את התביעה.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">2. צלמו הכל</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>צילום הנזק מקרוב (פרטים)</li>
            <li>צילום הרכב מרחוק (להראות איפה חונה)</li>
            <li>צילום הסביבה (כתובת, חנות, סימני דרך)</li>
            <li>צילום של רכבים אחרים בסביבה — אולי מישהו ראה</li>
            <li>סמני שעון ותאריך</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">3. חפשו פתק</h3>
          <p>גם מתחת למגב, בתוך הרכב (אם פתוח), או על הפאנל הקדמי. נהגים הוגנים משאירים.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">4. חפשו עדים</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>שאלו עוברי אורח באזור</li>
            <li>פנו לחנויות בסביבה — אולי המתינו לרכב מסוים</li>
            <li>חפשו מצלמות אבטחה (חנות, מסעדה, בית)</li>
            <li>שאלו את שכנכם אם ראו</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">5. דווחו למשטרה</h3>
          <p>גם אם אין לכם פרטי הפוגע, דיווח למשטרה חיוני:</p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>חייגו 100 או הגיעו לתחנת משטרה</li>
            <li>פתחו תיק &quot;פגע וברח&quot; — מספר תיק יינתן</li>
            <li>בלי דיווח משטרה — חברת הביטוח לא תכסה!</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">6. דווחו לחברת הביטוח</h3>
          <p>תוך 24-48 שעות מגילוי הנזק. הם יסייעו בתהליך התביעה.</p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מי משלם על הנזק?</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">תרחיש 1: יש לכם ביטוח מקיף</h3>
          <p>חברת הביטוח שלכם תכסה את הנזק. תשלמו רק <strong>השתתפות עצמית</strong> (1,500-3,000 ש&quot;ח לרוב), והם יטפלו בכל השאר.</p>
          <p><strong>חיסרון:</strong> הביטוח שלכם יקופץ בחידוש הבא (5-15% עלייה).</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">תרחיש 2: ביטוח חובה בלבד / צד ג&apos;</h3>
          <p>אם אין מקיף, החובה לא מכסה נזק לרכב. תשלמו מכיסכם — אלא אם תזהו את הפוגע.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">תרחיש 3: זוהה הפוגע</h3>
          <p>אם זיהיתם את הפוגע (ע&quot;י עדים / מצלמות):</p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>חברת הביטוח שלכם תתבע את הביטוח שלו (סוברוגציה)</li>
            <li>אתם תקבלו חזרה את ההשתתפות העצמית</li>
            <li>הביטוח שלכם לא יקופץ (כי לא הייתם אשמים)</li>
            <li>אם אין לפוגע ביטוח — תוכלו לתבוע אישית בבית משפט</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך מצמצמים את הנזק הכספי?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>השוו 3 הצעות מחיר ממוסכים</strong> — הפרשים של אלפי שקלים נפוצים</li>
            <li><strong>בדקו אם זה כיסוי בביטוח שלכם</strong> — חלק מהפוליסות מכסות &quot;פגע וברח&quot; ללא קנס</li>
            <li><strong>ראו אם ההשתתפות העצמית גבוהה מהנזק</strong> — לפעמים עדיף לתקן בעצמכם</li>
            <li><strong>תיקון אצל מוסך עצמאי לעיתים זול יותר ממוסך מורשה</strong></li>
            <li><strong>אם הנזק זעיר</strong> (שריטה קטנה) — שווה לתקן עצמית עם ערכת תיקון (50-150 ש&quot;ח)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">איך למנוע את זה בעתיד?</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>חניה בחניון מאובטח</strong> — לא רק יותר בטוח, אלא אם קרה משהו יש מצלמות</li>
            <li><strong>חניה רחוקה ממקומות צפופים</strong> — בקצה החניון</li>
            <li><strong>מצלמת רכב (Dash Cam) עם מצב חניה</strong> — מתעדת גם כשהרכב כבוי. עולה 400-1,500 ש&quot;ח</li>
            <li><strong>הימנעות מחניה ליד דלתות מסעדות וברים בלילה</strong></li>
            <li><strong>סמליל אזהרה (&quot;מצלמה פעילה&quot;)</strong> — מרתיע</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה אם אני זה שפגעתי ברכב חונה?</h2>
          <p><strong>חשוב מאוד:</strong> אל תברחו! העונש על אי-השארת פרטים חמור בהרבה מהנזק עצמו.</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>השאירו פתק עם השם, מספר טלפון, מספר פוליסת ביטוח</li>
            <li>עדיף בתוך נרתיק ניילון מתחת למגב</li>
            <li>אם אתם לא בטוחים שגרמתם נזק — בדקו ושוב צלמו</li>
            <li>פנו ישירות לחברת הביטוח שלכם</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">תיעוד מקצועי לרכב</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog שומרת את פוליסת הביטוח, היסטוריית טיפולים ומסמכים — מוכנים בכל עת לתביעה.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">הרשמה בחינם<ArrowLeft size={16} /></Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>
          <h3 className="text-lg font-bold text-[#1e3a5f]">תוך כמה זמן צריך לדווח למשטרה?</h3>
          <p>תוך 24 שעות. אחרת המשטרה לא תפתח תיק.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">חברת הביטוח לא רוצה לכסות — מה לעשות?</h3>
          <p>פנו לעורך דין תעבורה או למוקד התלונות של רשות שוק ההון. רוב המקרים נפתרים.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">תקיפת מצלמת אבטחה בלי רשות — חוקי?</h3>
          <p>ראיית הקלטה מצלמה ציבורית — כן. אבל אם זו מצלמה פרטית — צריך הסכמה. חוקרים פרטיים יכולים לעזור.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">אם הנזק קטן — שווה לדווח?</h3>
          <p>אם זה פחות מההשתתפות העצמית — לא משתלם. אם יש סיכוי לזהות הפוגע — כן.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה זה &quot;נזק עיוור&quot;?</h3>
          <p>נזק שלא ידוע מי גרם לו. רוב הביטוחים המקיפים מכסים, אבל בקנס השתתפות עצמית.</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` } },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: 'תוך כמה זמן לדווח למשטרה על פגיעה ברכב חונה?', acceptedAnswer: { '@type': 'Answer', text: 'תוך 24 שעות. אחרת המשטרה לא תפתח תיק.' } },
              { '@type': 'Question', name: 'מי משלם על נזק לרכב חונה?', acceptedAnswer: { '@type': 'Answer', text: 'אם יש ביטוח מקיף — חברת הביטוח, ואתם משלמים השתתפות עצמית. אם זוהה הפוגע — הביטוח שלו ישלם.' } },
              { '@type': 'Question', name: 'מה העונש על "פגע וברח" ברכב חונה?', acceptedAnswer: { '@type': 'Answer', text: 'קנס עד 2,200 ש"ח, נקודות רישוי, פסילת רישיון אפשרית, ובמקרים חמורים מאסר עד שנה.' } },
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/blog/madrich-male-baal-rechev-chadash-2026" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">המדריך השלם לבעל רכב<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
