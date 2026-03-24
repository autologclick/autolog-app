'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, AlertTriangle, ClipboardCheck, Scale, Wrench, Users, FileWarning, Phone } from 'lucide-react';

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#1e3a5f] hover:opacity-80 transition">
            <ArrowRight size={20} />
            <span className="text-sm font-medium">חזרה לדף הבית</span>
          </Link>
          <Link href="/" className="text-xl font-bold text-[#1e3a5f]">
            Auto<span className="text-[#0d9488]">Log</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0d9488]/10 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-[#0d9488]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">אחריות בנושא בדיקות רכב</h1>
          <p className="text-gray-500 text-sm">עדכון אחרון: מרץ 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 mb-2">הבהרה חשובה</h3>
                <p className="text-amber-700 text-sm">
                  מסמך זה מפרט את חלוקת האחריות בין AutoLog, המוסכים השותפים והמשתמשים בכל הנוגע לבדיקות רכב המתבצעות דרך הפלטפורמה. מומלץ לקרוא מסמך זה בעיון לפני הזמנת בדיקה.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">1. מהות הבדיקה</h2>
            </div>
            <p className="mb-3">
              בדיקות הרכב המוצעות דרך פלטפורמת AutoLog מבוצעות על ידי מוסכים שותפים עצמאיים ומוסמכים. הבדיקה כוללת סקירה ויזואלית ומכנית של מצב הרכב בהתאם לפרוטוקול הבדיקה המוגדר במערכת, ונועדה לספק תמונת מצב של הרכב במועד הבדיקה בלבד.
            </p>
            <p>
              הבדיקה אינה מהווה תחליף לטסט שנתי, בדיקת מכון רישוי, או כל בדיקה נדרשת על פי חוק. כמו כן, הבדיקה אינה מהווה חוות דעת מקצועית או המלצה לרכישה או מכירה של רכב.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">2. תפקיד AutoLog</h2>
            </div>
            <p className="mb-3">
              AutoLog משמשת כפלטפורמה מתווכת בלבד בין המשתמש למוסך השותף. תפקידה של AutoLog מוגבל ל:
            </p>
            <ul className="space-y-2 list-disc list-inside mb-3">
              <li>הפניית המשתמש למוסך שותף מאומת</li>
              <li>תיעוד דיגיטלי של ממצאי הבדיקה כפי שהוזנו על ידי המוסך</li>
              <li>שמירת דוח הבדיקה בארנק הדיגיטלי של המשתמש</li>
              <li>שליחת תזכורות ומעקב לאחר הבדיקה</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm font-medium">
                AutoLog אינה מבצעת את הבדיקה עצמה, אינה מעסיקה את הבודקים, ואינה נושאת באחריות לאיכות הבדיקה, לממצאיה, או להמלצות שניתנו על ידי המוסך.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">3. אחריות המוסך השותף</h2>
            </div>
            <p className="mb-3">המוסך השותף נושא באחריות המלאה לביצוע הבדיקה, לרבות:</p>
            <ul className="space-y-2 list-disc list-inside mb-3">
              <li>ביצוע הבדיקה בצורה מקצועית ויסודית בהתאם לסטנדרטים מקובלים בענף</li>
              <li>הזנת ממצאים מדויקים ואמינים למערכת</li>
              <li>מתן המלצות מקצועיות ואובייקטיביות למשתמש</li>
              <li>עמידה בכל דרישות הרישוי והרגולציה החלות עליו</li>
              <li>שמירה על כלי עבודה ומכשור בדיקה מכויל ותקין</li>
            </ul>
            <p>
              כל תביעה או טענה בנוגע לאיכות הבדיקה, לממצאים שגויים, או לנזק שנגרם כתוצאה מהבדיקה — יש להפנות ישירות למוסך שביצע את הבדיקה.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">4. אחריות המשתמש</h2>
            </div>
            <p className="mb-3">המשתמש מאשר ומסכים כי:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>הוא נושא באחריות המלאה והבלעדית לתקינות רכבו, לביטוחו, ולעמידה בכל דרישות החוק</li>
              <li>תוצאות הבדיקה מהוות כלי עזר בלבד ואינן מהוות אישור לתקינות הרכב או כשירותו לנסיעה</li>
              <li>אין להסתמך על דוח הבדיקה כתחליף לבדיקות החובה הקבועות בחוק</li>
              <li>החלטות רכישה, מכירה, או שימוש ברכב הן באחריותו הבלעדית</li>
              <li>עליו לוודא שהמידע שמסר לצורך הבדיקה (פרטי רכב, היסטוריה) הוא מדויק ומלא</li>
              <li>עליו לבדוק את דוח הבדיקה בסמוך לקבלתו ולדווח על אי-דיוקים לחברה ולמוסך</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileWarning className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">5. מגבלות הבדיקה</h2>
            </div>
            <p className="mb-3">חשוב להבין כי לבדיקת הרכב ישנן מגבלות אובייקטיביות:</p>
            <ul className="space-y-2 list-disc list-inside mb-3">
              <li>הבדיקה משקפת את מצב הרכב במועד ביצועה בלבד — מצב הרכב עשוי להשתנות לאחר מכן</li>
              <li>ישנם תקלות ופגמים נסתרים שאינם ניתנים לזיהוי בבדיקה ויזואלית או מכנית רגילה</li>
              <li>הבדיקה אינה כוללת פירוק מרכיבים, בדיקות מעבדה, או בדיקות הרסניות אלא אם צוין אחרת</li>
              <li>ממצאי הבדיקה מבוססים על ניסיון המקצועי ושיקול הדעת של הבודק, וייתכנו הבדלי דעה בין בודקים שונים</li>
              <li>חלקים ומערכות שלא נכללו בפרוטוקול הבדיקה אינם מכוסים בדוח</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">6. הגבלת אחריות</h2>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
              <h3 className="font-bold text-red-800 mb-2">הצהרת הגבלת אחריות</h3>
              <ul className="space-y-2 text-red-700 text-sm list-disc list-inside">
                <li>AutoLog אינה נושאת בכל אחריות שהיא לנזק ישיר, עקיף, תוצאתי, מיוחד או עונשי הנובע מבדיקת רכב או מהסתמכות על תוצאותיה</li>
                <li>AutoLog אינה אחראית לנזק שנגרם כתוצאה מממצא שלא זוהה בבדיקה, ממצא שגוי, או המלצה שגויה של המוסך</li>
                <li>האחריות הכוללת של AutoLog, ככל שתוטל עליה, לא תעלה על הסכום ששולם בפועל עבור הבדיקה הספציפית</li>
                <li>השירות ניתן &quot;כמות שהוא&quot; (AS IS) ללא כל מצג או התחייבות, מפורשים או משתמעים</li>
              </ul>
            </div>
            <p>
              המשתמש מוותר מראש על כל תביעה, טענה או דרישה כלפי AutoLog בקשר עם בדיקת רכב, ומסכים כי כל תביעה תופנה ישירות למוסך שביצע את הבדיקה.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">7. אימות מוסכים שותפים</h2>
            </div>
            <p className="mb-3">
              AutoLog מבצעת תהליך אימות ראשוני למוסכים המצטרפים לרשת, הכולל בדיקת רישיונות והסמכות. עם זאת:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>האימות אינו מהווה ערובה לאיכות השירות שיינתן בכל בדיקה ספציפית</li>
              <li>AutoLog אינה מפקחת על ביצוע הבדיקות בפועל</li>
              <li>מעמד &quot;מוסך שותף&quot; אינו מהווה המלצה או אישור מטעם AutoLog</li>
              <li>AutoLog רשאית להסיר מוסך מרשת השותפים בכל עת ומכל סיבה</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">8. דוח הבדיקה</h2>
            </div>
            <p className="mb-3">דוח הבדיקה מופק על סמך הנתונים שהזין המוסך השותף למערכת. בנוגע לדוח:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>AutoLog אינה בודקת, מאמתת או עורכת את תוכן הדוח</li>
              <li>הדוח משקף את ממצאי הבודק ואינו מייצג עמדה או חוות דעת של AutoLog</li>
              <li>הציון המשוקלל בדוח מחושב אוטומטית על בסיס הממצאים שהוזנו, ומהווה כלי עזר בלבד</li>
              <li>הדוח נשמר בארנק הדיגיטלי של המשתמש ועשוי לשמש לתיעוד בלבד</li>
              <li>שיתוף דוח הבדיקה עם צדדים שלישיים הוא באחריות המשתמש בלבד</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">9. תשלומים וביטולים</h2>
            </div>
            <p className="mb-3">בנוגע לתשלום עבור בדיקות:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>התשלום עבור הבדיקה מתבצע ישירות למוסך השותף</li>
              <li>AutoLog עשויה לקבל עמלת תיווך מהמוסך, אך המחיר למשתמש אינו מושפע מכך</li>
              <li>מדיניות הביטול וההחזרים בגין בדיקות שבוטלו חלה בהתאם לתנאי המוסך הספציפי</li>
              <li>AutoLog אינה צד לעסקה הכספית בין המשתמש למוסך</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">10. יצירת קשר ותלונות</h2>
            </div>
            <p className="mb-3">
              במקרה של בעיה הנוגעת לבדיקת רכב, מומלץ לפעול בסדר הבא:
            </p>
            <ol className="space-y-2 list-decimal list-inside mb-4">
              <li>לפנות ישירות למוסך שביצע את הבדיקה לבירור הממצאים</li>
              <li>במידה ולא נמצא פתרון — לפנות לצוות AutoLog לסיוע בתיווך</li>
              <li>במקרה של חשד לרשלנות מקצועית — לפנות לגורמים המוסמכים (משרד התחבורה, בית הדין לתעבורה)</li>
            </ol>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">פרטי יצירת קשר:</p>
              <p className="text-sm text-gray-600">דוא&quot;ל: <a href="mailto:info@autolog.click" className="text-[#0d9488] hover:underline">info@autolog.click</a></p>
              <p className="text-sm text-gray-600">כתובת: משה בקר 29, ראשון לציון</p>
              <p className="text-sm text-gray-500 mt-2">נשתדל לטפל בפניות בתוך 7 ימי עסקים.</p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">11. דין חל וסמכות שיפוט</h2>
            <p>
              מסמך זה יפורש ויחולו עליו דיני מדינת ישראל בלבד. סמכות השיפוט הבלעדית בכל עניין הנובע ממסמך זה או הקשור אליו תהיה לבתי המשפט המוסמכים במחוז תל אביב, ישראל.
            </p>
          </section>

          {/* User Declaration */}
          <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/10 rounded-xl p-5">
            <h3 className="font-bold text-[#1e3a5f] mb-3">הצהרת המשתמש</h3>
            <p className="text-sm text-gray-700">
              בהזמנת בדיקת רכב דרך פלטפורמת AutoLog, אני מצהיר ומאשר כי קראתי והבנתי את מסמך האחריות במלואו, אני מודע למגבלות הבדיקה ולחלוקת האחריות המפורטת לעיל, אני מסכים שתוצאות הבדיקה הן כלי עזר בלבד ואינן מחליפות את אחריותי האישית לתקינות הרכב, ואני מקבל את הגבלת האחריות של AutoLog כמפורט במסמך זה.
            </p>
          </div>

          {/* Links */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">ראו גם:</p>
            <div className="flex justify-center gap-4">
              <Link href="/terms" className="text-sm text-[#0d9488] hover:underline">תנאי שימוש</Link>
              <span className="text-gray-300">|</span>
              <Link href="/privacy" className="text-sm text-[#0d9488] hover:underline">מדיניות פרטיות</Link>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          © 2026 AutoLog. כל הזכויות שמורות.
        </div>
      </main>
    </div>
  );
}