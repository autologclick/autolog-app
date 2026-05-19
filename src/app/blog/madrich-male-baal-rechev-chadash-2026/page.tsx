import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('madrich-male-baal-rechev-chadash-2026')!;

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
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">{post.category} · מדריך מקיף</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e3a5f] leading-tight mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{post.readingTime}</span>
          <span>מאת {post.author}</span>
        </div>

        {/* Table of Contents */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">📑 תוכן עניינים</h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-teal-800">
            <li><a href="#introduction" className="hover:underline">פתיחה — ברוכים הבאים לעולם בעלי הרכב</a></li>
            <li><a href="#purchase" className="hover:underline">קניית הרכב — איך לקנות נכון</a></li>
            <li><a href="#registration" className="hover:underline">רישום והעברת בעלות</a></li>
            <li><a href="#insurance" className="hover:underline">ביטוח — חובה ומקיף</a></li>
            <li><a href="#test" className="hover:underline">טסט שנתי — הכל מה שצריך לדעת</a></li>
            <li><a href="#maintenance" className="hover:underline">תחזוקה שוטפת</a></li>
            <li><a href="#expenses" className="hover:underline">ניהול הוצאות</a></li>
            <li><a href="#emergency" className="hover:underline">מצבי חירום ותאונות</a></li>
            <li><a href="#tools" className="hover:underline">כלים שיהפכו אתכם לבעלי רכב חכמים</a></li>
            <li><a href="#summary" className="hover:underline">סיכום וצעדים ראשונים</a></li>
          </ol>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">

          {/* INTRO */}
          <h2 id="introduction" className="text-2xl font-bold text-[#1e3a5f] pt-4 scroll-mt-20">1. פתיחה — ברוכים הבאים לעולם בעלי הרכב</h2>
          <p className="text-lg text-gray-600 font-medium">
            מזל טוב — קניתם רכב חדש (או חדש לכם)! אבל מהר מאוד תגלו שיש <strong>הרבה</strong> דברים שצריך לדעת: ביטוח, טסט, תחזוקה, רישוי, מסמכים, הוצאות, תאונות... המדריך הזה הוא הכלי המקיף ביותר בעברית — קראו אותו פעם, ותהיו מוכנים לכל מצב.
          </p>
          <p>
            המדריך כתוב על בסיס ניסיון של אלפי בעלי רכב בישראל, ומתעדכן באופן שוטף ל-2026. הוא רלוונטי בין אם זה הרכב הראשון שלכם או החמישי.
          </p>

          {/* PURCHASE */}
          <h2 id="purchase" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">2. קניית הרכב — איך לקנות נכון</h2>
          <p>
            קניית רכב היא אחת ההחלטות הפיננסיות הגדולות ביותר. במחיר ממוצע של 60,000-200,000 ש&quot;ח, טעות יכולה לעלות אלפים בתיקונים.
          </p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">חדש או יד שנייה?</h3>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>חדש</strong> — אחריות מלאה, ללא הפתעות, אבל יקר ומפסיד 20-30% בשנה הראשונה</li>
            <li><strong>יד שנייה (3-5 שנים):</strong> נקודה מתוקה — חיסכון של 30-40% עם פחות סיכון</li>
            <li><strong>יד שנייה ישנה (10+ שנים):</strong> זול אבל סיכון לעלויות תחזוקה גבוהות</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">צ&apos;קליסט קניית רכב יד שנייה</h3>
          <p>לפני שמשלמים, ודאו:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>בדיקה מקצועית במכון בדיקה (350-500 ש&quot;ח)</li>
            <li>דוח היסטוריה (בלק&quot;ר / לוי יצחק)</li>
            <li>בדיקת בעלות ושעבודים</li>
            <li>נסיעת מבחן של לפחות 30 דקות</li>
            <li>בדיקת ספרון שירות וחשבוניות</li>
          </ul>
          <p>📖 לעומק: <Link href="/blog/ma-livdok-lifnei-kniyat-rechev-yad-shniya" className="text-teal-600 hover:text-teal-700 underline">צ&apos;קליסט מלא של 50 דברים לבדוק לפני קניית רכב יד שנייה</Link></p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">איפה לבדוק את הרכב לפי עיר</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><Link href="/blog/bdika-lifnei-kniyat-rechev-tel-aviv" className="text-teal-600 hover:text-teal-700 underline">תל אביב</Link></li>
            <li><Link href="/blog/bdika-lifnei-kniyat-rechev-jerusalem" className="text-teal-600 hover:text-teal-700 underline">ירושלים</Link></li>
            <li><Link href="/blog/bdika-lifnei-kniyat-rechev-haifa" className="text-teal-600 hover:text-teal-700 underline">חיפה והקריות</Link></li>
            <li><Link href="/blog/mechoney-bdika-rishon-letzion" className="text-teal-600 hover:text-teal-700 underline">ראשון לציון</Link></li>
            <li><Link href="/blog/bdika-lifnei-kniyat-rechev-petach-tikva" className="text-teal-600 hover:text-teal-700 underline">פתח תקווה</Link></li>
            <li><Link href="/blog/bdika-lifnei-kniyat-rechev-netanya" className="text-teal-600 hover:text-teal-700 underline">נתניה והשרון</Link></li>
            <li><Link href="/blog/bdika-lifnei-kniyat-rechev-beer-sheva" className="text-teal-600 hover:text-teal-700 underline">באר שבע</Link></li>
            <li><Link href="/blog/mechoney-bdika-cholon" className="text-teal-600 hover:text-teal-700 underline">חולון</Link></li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">חשמלי, היברידי או בנזין?</h3>
          <p>שאלה מרכזית ב-2026. בקצרה:</p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>בנזין:</strong> זול לרכישה, יקר לתחזוקה ארוכת טווח</li>
            <li><strong>היברידי:</strong> תיק&quot;ל אופטימלי ברוב המקרים</li>
            <li><strong>חשמלי:</strong> חיסכון משמעותי אם יש חניה פרטית והרבה נסיעות</li>
          </ul>
          <p>📖 השוואה מעמיקה: <Link href="/blog/rechev-chashmali-o-hibridi-2026" className="text-teal-600 hover:text-teal-700 underline">רכב חשמלי או היברידי — מה לבחור 2026</Link></p>

          {/* REGISTRATION */}
          <h2 id="registration" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">3. רישום והעברת בעלות</h2>
          <p>אחרי קניית הרכב, חובה להעביר את הבעלות תוך <strong>10 ימים</strong>. אי-עמידה בזמן = קנס של 250 ש&quot;ח לכל יום איחור.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">תהליך מהיר באינטרנט (15-20 דקות)</h3>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li>היכנסו לאתר משרד התחבורה (gov.il)</li>
            <li>הזדהות עם תעודת זהות וכרטיס אשראי</li>
            <li>מילוי טופס דיגיטלי (פרטי רכב, מוכר, קונה)</li>
            <li>תשלום אגרה — כ-240 ש&quot;ח</li>
            <li>אישור ישלח במייל מיד</li>
          </ol>
          <p>📖 מדריך מלא: <Link href="/blog/haavarat-baalut-al-rechev-2026" className="text-teal-600 hover:text-teal-700 underline">החלפת בעלות על רכב 2026 — צעד אחר צעד</Link></p>

          {/* INSURANCE */}
          <h2 id="insurance" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">4. ביטוח — חובה ומקיף</h2>
          <p>אסור לנסוע בלי ביטוח חובה — חובה חוקית. ביטוח מקיף מומלץ לרכב חדש או יקר.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">ביטוח חובה</h3>
          <p>מכסה רק <strong>נזק גוף</strong> שאתם גורמים לאחרים. עולה 1,000-4,500 ש&quot;ח בשנה.</p>
          <p>📖 <Link href="/blog/bituach-rechev-chova-madrich-male-2026" className="text-teal-600 hover:text-teal-700 underline">המדריך המלא לביטוח חובה 2026</Link></p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">ביטוח מקיף</h3>
          <p>מכסה גם <strong>נזק לרכב שלכם</strong> + נזק לצד שלישי + שירותים נלווים. עולה 2,000-7,000 ש&quot;ח בשנה.</p>
          <p>📖 <Link href="/blog/bituach-rechev-makif-eich-bocharim" className="text-teal-600 hover:text-teal-700 underline">איך בוחרים ביטוח מקיף נכון</Link></p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">איך לחסוך אלפי שקלים על ביטוח</h3>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>השוו מחירים <strong>כל שנה</strong> דרך Wobi או InsuranceGenie</li>
            <li>הגדילו השתתפות עצמית</li>
            <li>הוסיפו מיגון (איתוראן, מולטי-לוק)</li>
            <li>שלמו שנתי במקום חודשי</li>
            <li>אל תכללו נהגים שלא נוהגים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">לא לפספס תזכורות</h3>
          <p>ביטוח שפג בלי שהבחנתם = אסון משפטי. <Link href="/blog/tizkoret-bituach-rechev" className="text-teal-600 hover:text-teal-700 underline">5 דרכים לא לפספס שוב</Link>.</p>

          {/* TEST */}
          <h2 id="test" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">5. טסט שנתי — הכל מה שצריך לדעת</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">מה זה טסט?</h3>
          <p>בדיקה שנתית חובה במכון רישוי מורשה. בלי טסט בתוקף — אסור לנסוע, ויש קנסות כבדים.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">כמה זה עולה?</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>רכב פרטי: 180-220 ש&quot;ח</li>
            <li>רכב מסחרי: 220-600 ש&quot;ח</li>
            <li>אגרת רישוי שנתית: 1,300-7,000 ש&quot;ח (לפי הרכב)</li>
          </ul>
          <p>📖 פירוט מלא: <Link href="/blog/kama-ole-test-shnati-2026" className="text-teal-600 hover:text-teal-700 underline">כמה עולה טסט שנתי 2026</Link></p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">איך לדעת מתי הטסט הבא?</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>ברישיון הרכב — תאריך התפוגה</li>
            <li>באתר משרד התחבורה (gov.il)</li>
            <li>ב-AutoLog — תזכורות אוטומטיות</li>
          </ul>
          <p>📖 <Link href="/blog/matai-hatest-shel-harechev-sheli" className="text-teal-600 hover:text-teal-700 underline">איך לדעת מתי הטסט הבא של הרכב שלכם</Link></p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">איך מתכוננים לטסט</h3>
          <p>בדקו 5 דברים בסיסיים לפני שאתם מגיעים: <Link href="/blog/checklist-lifnei-test" className="text-teal-600 hover:text-teal-700 underline">צ&apos;קליסט לפני הטסט</Link>.</p>

          {/* MAINTENANCE */}
          <h2 id="maintenance" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">6. תחזוקה שוטפת</h2>
          <p>תחזוקה מונעת היא <strong>הדרך הזולה ביותר</strong> לשמור על הרכב. טיפול ב-450 ש&quot;ח חוסך תיקון של 5,000+ ש&quot;ח.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">לוח זמנים לתחזוקה</h3>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>כל 10,000-15,000 ק&quot;מ:</strong> טיפול תקופתי</li>
            <li><strong>כל 30,000-50,000 ק&quot;מ:</strong> רצועת תזמון, נוזלים</li>
            <li><strong>כל 60,000 ק&quot;מ:</strong> בלמים מלאים</li>
            <li><strong>כל 80,000-100,000 ק&quot;מ:</strong> צמיגים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">החלפת שמן — הכי חשוב</h3>
          <p>הפעולה הכי חשובה בתחזוקה. שמן ישן הורס מנוע.</p>
          <p>📖 <Link href="/blog/hachlafat-shemen-rechev-mechir-2026" className="text-teal-600 hover:text-teal-700 underline">החלפת שמן — מתי, איך וכמה עולה</Link></p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">אבחון עצמי עם OBD2</h3>
          <p>סורק קטן ב-50-150 ש&quot;ח שמתחבר לרכב ומגלה בעיות לפני שהן מחמירות.</p>
          <p>📖 <Link href="/blog/ma-ze-ovd2" className="text-teal-600 hover:text-teal-700 underline">המדריך המלא ל-OBD2</Link></p>

          {/* EXPENSES */}
          <h2 id="expenses" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">7. ניהול הוצאות</h2>
          <p>הרכב הוא ההוצאה השנייה בגודלה במשק בית ישראלי — אחרי הדיור. ממוצע: <strong>3,000-5,000 ש&quot;ח לחודש</strong>.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">פילוח הוצאות חודשיות</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>דלק / טעינה: 950-1,200 ש&quot;ח</li>
            <li>ביטוח: 350-500 ש&quot;ח</li>
            <li>אגרה + טסט: 200 ש&quot;ח</li>
            <li>תחזוקה: 400-600 ש&quot;ח</li>
            <li>חניה: 200-400 ש&quot;ח</li>
            <li>הפחתת ערך: 800-1,500 ש&quot;ח</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">12 דרכים לחסוך אלפי שקלים</h3>
          <p>📖 <Link href="/blog/12-tipim-lechisachon-bedelek" className="text-teal-600 hover:text-teal-700 underline">12 טיפים לחיסכון בדלק</Link> — חיסכון של עד 25%</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">למה כדאי לעקוב אחרי הוצאות?</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>זיהוי בזבוז (תחנת דלק יקרה, חניה לא הכרחית)</li>
            <li>החלטה מתי להחליף רכב</li>
            <li>מס הכנסה (לעצמאים)</li>
            <li>תיעוד למוכר/קונה ברגע מכירה</li>
          </ul>

          {/* EMERGENCY */}
          <h2 id="emergency" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">8. מצבי חירום ותאונות</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">מה לעשות בתאונה?</h3>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>בטיחות קודם</strong> — צאו מהרכב למקום בטוח</li>
            <li><strong>חייגו 100</strong> אם יש פצועים</li>
            <li><strong>צלמו הכל</strong> — נזק, מיקום, שלטי דרך</li>
            <li><strong>החליפו פרטים</strong> עם הצד השני</li>
            <li><strong>דווחו לחברת הביטוח</strong> תוך 24 שעות</li>
          </ol>

          <h3 className="text-xl font-bold text-[#1e3a5f]">פגעו ברכב החונה — מה לעשות?</h3>
          <p>📖 <Link href="/blog/pgia-be-rechev-chone-ma-laasot" className="text-teal-600 hover:text-teal-700 underline">המדריך המלא לפגיעה ברכב חונה</Link> — איך לתבוע פיצוי, מה החוק אומר.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">תקלה בדרך</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>חברת ביטוח מקיף — חיגו לגרירה</li>
            <li>אין מקיף — מגן דוד אדום לדרכים, או חברה פרטית (50-300 ש&quot;ח)</li>
            <li>תקלה קלה — נסו לפתור עם אפליקציות (כמו עוזר AI ב-AutoLog)</li>
          </ul>

          {/* TOOLS */}
          <h2 id="tools" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">9. כלים שיהפכו אתכם לבעלי רכב חכמים</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">אפליקציה לניהול רכב</h3>
          <p>במקום אקסל ידני או מסמכים פזורים — אפליקציה שמרכזת הכל.</p>
          <p>📖 <Link href="/blog/7-applikatziot-lenihul-rechev-2026" className="text-teal-600 hover:text-teal-700 underline">השוואת 7 אפליקציות לניהול רכב 2026</Link></p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">סורק OBD2</h3>
          <p>50-150 ש&quot;ח לסורק בלוטות&apos; פשוט. חוסך הרבה כסף בכך שמזהה תקלות מוקדם.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">אפליקציות השוואת מחירי דלק</h3>
          <p>Yellow, Pelephone — חוסכות 50-150 ש&quot;ח בחודש בקלות.</p>

          <h3 className="text-xl font-bold text-[#1e3a5f]">מצלמת רכב (Dash Cam)</h3>
          <p>400-1,500 ש&quot;ח. מתעדת תאונות וגנבות. הוכחה ביטוחית חזקה.</p>

          {/* SUMMARY */}
          <h2 id="summary" className="text-2xl font-bold text-[#1e3a5f] pt-8 scroll-mt-20">10. סיכום וצעדים ראשונים</h2>

          <p>קיבלתם רכב חדש? הנה <strong>5 הצעדים הראשונים</strong> שלכם:</p>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>בטחו את הרכב</strong> — חובה ומקיף (אם רלוונטי)</li>
            <li><strong>תעדו פרטי הרכב</strong> במערכת ניהול (כמו AutoLog)</li>
            <li><strong>הגדירו תזכורות</strong> לטסט, ביטוח, רישיון</li>
            <li><strong>הזמינו טיפול ראשון</strong> אם הרכב לא חדש לחלוטין</li>
            <li><strong>הוסיפו אמצעי מיגון בסיסיים</strong> אם דרוש</li>
          </ol>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-8 my-10 text-center">
            <h3 className="text-2xl font-bold mb-3">הכלי החינמי שכל בעל רכב בישראל צריך</h3>
            <p className="text-white/90 mb-6 text-base leading-relaxed">
              AutoLog מאחדת את כל הניהול של הרכב — תזכורות אוטומטיות, סריקת מסמכים עם AI, מעקב הוצאות, היסטוריית טיפולים, עוזר AI אישי וקביעת תורים במוסכים. בעברית. בחינם. ללא הורדה.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-teal-700 font-bold text-lg rounded-xl hover:bg-gray-50 transition shadow-lg">
              הרשמה חינמית — לחצו כאן<ArrowLeft size={18} />
            </Link>
            <p className="text-white/70 text-xs mt-4">יותר מ-2,500 בעלי רכב כבר חוסכים זמן וכסף עם AutoLog</p>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">סיכום</h2>
          <p>
            בעלות על רכב היא לא רק לקנות אותו ולנסוע. זה מערכת שלמה של ביטוח, תחזוקה, תזכורות, הוצאות וחירומים. אבל אם תהיו מוכנים, תחסכו זמן, כסף ועצבים.
          </p>
          <p>
            <strong>שמרו את המאמר הזה</strong> — חזרו אליו בכל פעם שיש לכם שאלה. ובכל סעיף יש קישורים לפוסטים מעמיקים יותר על נושאים ספציפיים.
          </p>
          <p>
            <strong>לדרך בטוחה!</strong> 🚗
          </p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` }, wordCount: 5000 },
            { '@type': 'TableOfContents', mainEntity: [
              'פתיחה', 'קניית הרכב', 'רישום והעברת בעלות', 'ביטוח חובה ומקיף', 'טסט שנתי', 'תחזוקה שוטפת', 'ניהול הוצאות', 'מצבי חירום', 'כלים', 'סיכום'
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">חזרה לעמוד הבית<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
