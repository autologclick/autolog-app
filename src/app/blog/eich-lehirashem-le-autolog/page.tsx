import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('eich-lehirashem-le-autolog')!;

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

          <p>ההרשמה לאוטולוג היא תהליך של 30 שניות. במאמר הזה נראה לכם בדיוק איך זה עובד — מה למלא, איפה ללחוץ, ואיך להתחיל לקבל ערך מהיום הראשון. אם אתם רוצים פשוט להתחיל ולא לקרוא — <Link href="https://autolog.click/auth/signup" className="text-teal-600 hover:text-teal-700 underline">הירשמו לאוטולוג כאן</Link>.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">למה בכלל להירשם לאוטולוג?</h2>

          <p>לפני שאנחנו צוללים להוראות, רגע אחד על הערך:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>אוטולוג שולחת תזכורות אוטומטיות</strong> לטסט, ביטוח ורישיון — לא תפספסו שום תאריך.</li>
  <li><strong>אוטולוג סורקת מסמכים עם AI</strong> — צילום של פוליסה ואוטולוג ממלאת את כל הפרטים.</li>
  <li><strong>אוטולוג עוקבת אחרי כל ההוצאות</strong> — תדעו בדיוק כמה הרכב עולה לכם.</li>
  <li><strong>אוטולוג חינמית</strong> — לתמיד, ללא הגבלות.</li>
  <li><strong>אוטולוג בעברית מלאה</strong> — כל מילה, כל תפריט.</li>
</ul>

          <p>ועכשיו, להוראות.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 1: היכנסו לדף ההרשמה של אוטולוג</h2>

          <p>פתחו דפדפן (Chrome, Safari, Firefox — כל אחד) והקלידו: <strong>autolog.click</strong></p>

          <p>או לחצו ישירות על הקישור: <Link href="https://autolog.click/auth/signup" className="text-teal-600 hover:text-teal-700 underline">autolog.click/auth/signup</Link></p>

          <p>אוטולוג עובדת באותה צורה בנייד ובמחשב. אין צורך בהורדת אפליקציה — אוטולוג היא פלטפורמת ווב.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 2: מלאו את פרטי ההרשמה</h2>

          <p>בדף ההרשמה של אוטולוג תראו טופס פשוט עם השדות הבאים:</p>

          <ol className="list-decimal list-inside space-y-2 mr-4">
  <li><strong>שם מלא</strong> — איך שתרצו שאוטולוג תפנה אליכם ("בוקר טוב, רון").</li>
  <li><strong>כתובת אימייל</strong> — לכאן אוטולוג תשלח את התזכורות. שווה לבחור מייל שאתם בודקים יומיומית.</li>
  <li><strong>מספר טלפון</strong> — לתזכורות SMS אופציונליות, ולשחזור חשבון במקרה הצורך.</li>
  <li><strong>סיסמה</strong> — בחרו סיסמה חזקה (לפחות 8 תווים, כולל אות גדולה, מספר וסימן מיוחד).</li>
  <li><strong>אישור תנאי שימוש</strong> — תיבת סימון אחת.</li>
</ol>

          <p>לוחצים על "הרשמה" — וזהו. אוטולוג שולחת מייל אימות.</p>

          <blockquote className="border-r-4 border-teal-500 pr-4 my-4 italic text-gray-600"><strong>טיפ:</strong> אם יש לכם מנהל סיסמאות (1Password, Bitwarden, או הסיסמאות של גוגל) — תנו לו ליצור סיסמה אקראית חזקה. אוטולוג שומרת אותה מוצפנת בכל מקרה.</blockquote>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 3: אמתו את כתובת המייל</h2>

          <p>בדקו את תיבת הדואר שלכם. אוטולוג שולחת מייל עם כותרת <strong>"אישור הרשמה לאוטולוג"</strong> מתוך 30 שניות.</p>

          <p>לוחצים על הקישור במייל. החשבון שלכם באוטולוג מאומת ומוכן. אם המייל לא הגיע, בדקו בתיקיית "ספאם" — לפעמים גוגל קצת מהפכני עם פלטפורמות חדשות.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 4: הוסיפו את הרכב הראשון לאוטולוג</h2>

          <p>עכשיו מתחילה הקסם של אוטולוג. בדשבורד הראשי אתם רואים כפתור גדול: <strong>"הוספת רכב"</strong>.</p>

          <p>לוחצים, ונפתח טופס פשוט:</p>

          <ol className="list-decimal list-inside space-y-2 mr-4">
  <li><strong>מספר רישוי</strong> — מקלידים את שמונת הספרות של מספר הרישוי הישראלי שלכם (לדוגמה: 123-45-678).</li>
  <li><strong>אוטולוג שולפת את הפרטים אוטומטית</strong> — תוך 2-3 שניות אוטולוג מציגה לכם: יצרן, דגם, שנת ייצור, צבע, סוג דלק, גודל מנוע.</li>
  <li><strong>מאשרים את הפרטים</strong> או מתקנים אם יש משהו לא מדויק.</li>
</ol>

          <p>ועכשיו, השדות החשובים שכדאי למלא מיד:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>תאריך הטסט האחרון</strong> — כדי שאוטולוג תדע מתי הטסט הבא ותשלח תזכורת.</li>
  <li><strong>חברת הביטוח</strong> — אופציונלי, אבל מומלץ.</li>
  <li><strong>תאריך תוקף ביטוח חובה</strong> — לתזכורת חידוש.</li>
  <li><strong>תאריך תוקף ביטוח מקיף</strong> — אם יש לכם.</li>
  <li><strong>קילומטראז' נוכחי</strong> — לחישוב צריכת דלק וטיפולים תקופתיים.</li>
</ul>

          <p>לוחצים "שמור". הרכב שלכם מוסף לאוטולוג.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 5: הגדירו תזכורות באוטולוג</h2>

          <p>אוטולוג מגדירה תזכורות ברירת מחדל לכל רכב חדש. בכל מקרה, שווה להיכנס להגדרות התזכורות ולוודא שזה מותאם לכם.</p>

          <p>בדשבורד של אוטולוג, לחצו על שלוש הנקודות ליד הרכב → <strong>"הגדרות תזכורות"</strong>. כאן תוכלו:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>לבחור כמה ימים מראש</strong> לקבל תזכורת (ברירת מחדל: 30, 14, 7, 1 ימים).</li>
  <li><strong>לבחור איך לקבל</strong> — אימייל בלבד, או גם Push notifications, או גם SMS.</li>
  <li><strong>לבחור לאיזה אירועים</strong> — טסט, ביטוח חובה, ביטוח מקיף, רישיון, טיפול תקופתי.</li>
</ul>

          <p>המלצה: סמנו את כל האפשרויות. עדיף תזכורת מיותרת מאשר לפספס.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 6: סרקו את המסמכים שלכם עם AI של אוטולוג</h2>

          <p>זה הצעד שמרגיש כמו קסם. בדשבורד הרכב, לחצו על <strong>"סריקת מסמך"</strong>.</p>

          <p>אוטולוג פותחת את המצלמה. צלמו:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li><strong>פוליסת ביטוח חובה</strong> — אוטולוג שולפת אוטומטית את חברת הביטוח, תאריך הפוליסה, סוכן הביטוח, ועלות.</li>
  <li><strong>פוליסת ביטוח מקיף</strong> — אותו דבר.</li>
  <li><strong>אישור טסט</strong> — תאריך, נקודות בדיקה, מוסך מבצע.</li>
  <li><strong>קבלה ממוסך</strong> — תאריך, סוג טיפול, עלות, פירוט הפעולות.</li>
</ul>

          <p>תוך 3-5 שניות אוטולוג מציגה לכם את כל הפרטים שחילצה — מאשרים בלחיצה ושומרים.</p>

          <p>המסמך עצמו נשמר באוטולוג בענן, מוצפן, וזמין לכם בכל רגע. גם אם נשרוף את הנייר המקורי — אוטולוג שומרת.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 7: התחילו לתעד הוצאות באוטולוג</h2>

          <p>כל פעם שאתם:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>ממלאים דלק</li>
  <li>משלמים על טיפול</li>
  <li>מקבלים קנס</li>
  <li>משלמים אגרת רישוי</li>
  <li>קונים צמיגים חדשים</li>
</ul>

          <p>אתם פותחים את אוטולוג ולוחצים <strong>"הוספת הוצאה"</strong>. תוך 10 שניות זה מתועד. אחרי חודש-חודשיים תראו את העלות האמיתית של הרכב שלכם — ותיבהלו מהמספר.</p>

          <p>לפעולה מהירה: אוטולוג כוללת <strong>הקלטה קולית</strong>. במקום להקליד, אומרים "מילאתי דלק ב-200 שקל בפז" — ואוטולוג מתמללת ומתעדת.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 8: שאלו את העוזר AI של אוטולוג כל שאלה</h2>

          <p>בדשבורד, יש כפתור <strong>"שאל את אוטולוג"</strong>. זה עוזר AI אישי שיודע על הרכב שלכם וההיסטוריה שלו.</p>

          <p>דוגמאות לשאלות:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>"הרכב שלי משמיע רעש בכל בוקר כשאני מדליק, מה זה?"</li>
  <li>"כמה צריך לעלות החלפת רפידות לבלמים בקורולה 2019?"</li>
  <li>"האם הטיפול שעשיתי במוסך אתמול היה במחיר הוגן?"</li>
  <li>"מתי הזמן הבא להחליף שמן לרכב שלי?"</li>
</ul>

          <p>אוטולוג עונה תוך שניות, בעברית, עם הסבר מפורט.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 9: הוסיפו את אוטולוג למסך הבית של הנייד</h2>

          <p>טיפ מתקדם: כדי שאוטולוג תרגיש כמו אפליקציה רגילה (אבל בלי להוריד מ-Play Store / App Store), אפשר להוסיף אותה למסך הבית כ-PWA.</p>

          <p><strong>באנדרואיד (Chrome):</strong></p>

          <ol className="list-decimal list-inside space-y-2 mr-4">
  <li>נכנסים ל-autolog.click.</li>
  <li>לוחצים על שלוש הנקודות בפינה הימנית למעלה.</li>
  <li>בוחרים <strong>"Add to Home Screen"</strong> (הוסף למסך הבית).</li>
  <li>מאשרים. אייקון אוטולוג מופיע במסך הבית.</li>
</ol>

          <p><strong>באייפון (Safari):</strong></p>

          <ol className="list-decimal list-inside space-y-2 mr-4">
  <li>נכנסים ל-autolog.click.</li>
  <li>לוחצים על כפתור השיתוף (ריבוע עם חץ למעלה).</li>
  <li>בוחרים <strong>"Add to Home Screen"</strong> (הוסף למסך הבית).</li>
  <li>מאשרים. אוטולוג מופיעה כאפליקציה במסך הבית.</li>
</ol>

          <p>עכשיו אתם פותחים את אוטולוג בלחיצה אחת, בדיוק כמו כל אפליקציה אחרת.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שלב 10: מוסיפים עוד רכבים לאוטולוג (אופציונלי)</h2>

          <p>אם יש לכם יותר מרכב אחד — אוטולוג תומכת בבלתי מוגבל. לוחצים שוב <strong>"הוספת רכב"</strong> וחוזרים על שלבים 4-6.</p>

          <p>מתאים ל:</p>

          <ul className="list-disc list-inside space-y-2 mr-4">
  <li>בני זוג עם 2 רכבים</li>
  <li>משפחה עם רכב הורים + רכב ילדים</li>
  <li>עצמאים עם רכב פרטי ורכב עסקי</li>
  <li>מוסכים קטנים עם 5-20 רכבי שירות</li>
</ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">טעויות נפוצות בהרשמה לאוטולוג</h2>

          <p><strong>טעות 1:</strong> שכחת לאשר את המייל. <strong>פתרון:</strong> בדקו בספאם. אם עדיין אין — לחצו "שלח מחדש" בדף ההרשמה של אוטולוג.</p>

          <p><strong>טעות 2:</strong> הקלדת מספר רישוי לא נכון. <strong>פתרון:</strong> רק 8 ספרות, ללא רווחים, ללא מקפים. אוטולוג שולפת אוטומטית.</p>

          <p><strong>טעות 3:</strong> לא הגדרת תזכורות. <strong>פתרון:</strong> ברירת המחדל של אוטולוג סבירה, אבל שווה להיכנס להגדרות ולהתאים.</p>

          <p><strong>טעות 4:</strong> לא העלאת מסמכים. <strong>פתרון:</strong> סריקת מסמך אחת חוסכת לכם רבע שעה של הקלדה ידנית בעתיד.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">שאלות נפוצות על הרשמה לאוטולוג</h2>

          <p><strong>ש: כמה זמן לוקח להירשם לאוטולוג?</strong> ת: 30 שניות להרשמה ראשונית, ועוד דקה להוספת הרכב הראשון. דקה וחצי בסך הכל.</p>

          <p><strong>ש: האם ההרשמה לאוטולוג עולה כסף?</strong> ת: לא. אוטולוג חינמית לחלוטין, לתמיד, ללא הגבלות.</p>

          <p><strong>ש: האם אני צריך לתת לאוטולוג את פרטי האשראי?</strong> ת: לא. אוטולוג חינמית — אין דרישה לכרטיס אשראי, בכלל.</p>

          <p><strong>ש: האם אני צריך להוריד אפליקציה?</strong> ת: לא. אוטולוג עובדת מהדפדפן. אופציונלי — להוסיף ל-Home Screen כ-PWA.</p>

          <p><strong>ש: האם אוטולוג עובדת באייפון?</strong> ת: כן. אוטולוג עובדת בכל מכשיר עם דפדפן — iPhone, Android, Mac, Windows.</p>

          <p><strong>ש: האם אני יכול למחוק את החשבון שלי באוטולוג?</strong> ת: כן, בכל רגע, מההגדרות. אפשר גם לייצא את כל המידע לפני המחיקה (זכויות GDPR מלאות).</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-8 mt-2">סיכום</h2>

          <p>ההרשמה לאוטולוג היא תהליך מהיר ופשוט:</p>

          <ol className="list-decimal list-inside space-y-2 mr-4">
  <li>נכנסים ל-autolog.click/auth/signup</li>
  <li>ממלאים שם, מייל, טלפון, סיסמה</li>
  <li>מאמתים את המייל</li>
  <li>מוסיפים את הרכב לפי מספר רישוי</li>
  <li>מגדירים תזכורות</li>
  <li>סורקים מסמכים עם AI</li>
  <li>מתחילים לתעד הוצאות</li>
  <li>שואלים את עוזר AI שאלות</li>
</ol>

          <p>הכל חינם. הכל בעברית. הכל מסונכרן בענן.</p>

          <p><Link href="https://autolog.click/auth/signup" className="text-teal-600 hover:text-teal-700 underline">התחילו עם אוטולוג עכשיו</Link> — תודו לעצמכם בעוד חודש.</p>

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
