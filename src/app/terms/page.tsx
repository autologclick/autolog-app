'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Shield, Building2, AlertTriangle } from 'lucide-react';

export default function TermsPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f]/10 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-[#1e3a5f]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">תנאי שימוש</h1>
          <p className="text-gray-500 text-sm">עדכון אחרון: פברואר 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">1. הגדרות</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>"AutoLog"</strong> או <strong>"האפליקציה"</strong> — פלטפורמת AutoLog לניהול רכבים ושירותי רכב, המופעלת על ידי AutoLog בע"מ.</li>
              <li><strong>"משתמש"</strong> — כל אדם שנרשם ו/או משתמש בשירותי AutoLog.</li>
              <li><strong>"מוסך שותף"</strong> — בית עסק לשירותי רכב שנרשם כספק שירות בפלטפורמה ואושר על ידי צוות AutoLog.</li>
              <li><strong>"שירותים"</strong> — כלל השירותים המוצעים באמצעות האפליקציה, לרבות ניהול רכבים, הזמנת שירותים, ומעקב אחר טיפולים.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">2. תיאור השירות</h2>
            <p className="mb-3">AutoLog מספקת פלטפורמה דיגיטלית המאפשרת:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>ניהול ומעקב אחר רכבים ופרטיהם</li>
              <li>הזמנת שירותי רכב ממוסכים שותפים</li>
              <li>מעקב אחר היסטוריית טיפולים ושירותים</li>
              <li>קבלת תזכורות לטיפולים ובדיקות</li>
              <li>השוואת מחירים בין מוסכים שותפים</li>
              <li>ניהול מוסך עבור בעלי מוסכים שותפים</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">3. הרשמה ושימוש</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>ההרשמה לשירות פתוחה לכל אדם מעל גיל 18.</li>
              <li>המשתמש מתחייב לספק פרטים מדויקים ועדכניים בעת ההרשמה.</li>
              <li>כל משתמש רשאי להחזיק חשבון אחד בלבד.</li>
              <li>המשתמש אחראי לשמירת סודיות פרטי ההתחברות שלו.</li>
              <li>AutoLog שומרת לעצמה את הזכות לסרב לאשר הרשמה או לבטל חשבון לפי שיקול דעתה.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">4. זכויות וחובות</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">זכויות המשתמש:</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>גישה לכל שירותי האפליקציה בהתאם לסוג החשבון</li>
                  <li>הגנה על מידע אישי בהתאם למדיניות הפרטיות</li>
                  <li>אפשרות לבטל את החשבון בכל עת</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">חובות המשתמש:</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>שימוש הוגן ובהתאם לחוק</li>
                  <li>אי העברת פרטי גישה לצד שלישי</li>
                  <li>דיווח על כל שימוש בלתי מורשה בחשבון</li>
                  <li>אי שימוש באפליקציה למטרות לא חוקיות</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">5. פרטיות ומידע אישי</h2>
            <p className="mb-3">
              השימוש באפליקציה כפוף ל<Link href="/privacy" className="text-[#0d9488] hover:underline font-medium">מדיניות הפרטיות</Link> של AutoLog.
              אנו מתחייבים להגן על פרטיות המשתמשים ולעמוד בכל דרישות החוק הרלוונטיות,
              לרבות חוק הגנת הפרטיות, התשמ"א-1981.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">6. תשלומים</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>חלק מהשירותים באפליקציה עשויים להיות כרוכים בתשלום.</li>
              <li>המחירים המוצגים כוללים מע"מ אלא אם צוין אחרת.</li>
              <li>התשלום מתבצע באמצעות אמצעי תשלום מאובטחים.</li>
              <li>מדיניות ביטולים והחזרים תהיה בהתאם לחוק הגנת הצרכן.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">7. הגבלת אחריות</h2>
            <ul className="space-y-2 list-disc list-inside mb-4">
              <li>AutoLog אינה אחראית לאיכות השירותים הניתנים על ידי מוסכים שותפים.</li>
              <li>האפליקציה מסופקת "כמות שהיא" (AS IS).</li>
              <li>AutoLog לא תישא באחריות לנזקים עקיפים או תוצאתיים.</li>
              <li>AutoLog עושה מאמצים סבירים לשמור על זמינות השירות, אך אינה מתחייבת לזמינות רציפה.</li>
              <li>בדיקות רכב המבוצעות באמצעות מוסכים שותפים מהוות חוות דעת מקצועית בלבד ואינן מהוות בדיקת מכון רישוי מורשה מטעם משרד התחבורה. אין להן תוקף משפטי מחייב.</li>
              <li>AutoLog אינה אחראית לנזק שנגרם כתוצאה מהסתמכות על ממצאי בדיקת מוסך כתחליף לבדיקה במכון רישוי מורשה.</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm">
                  <strong>שימו לב:</strong> לפרטים מלאים על חלוקת האחריות בנוגע לבדיקות רכב, ההבדל בין בדיקת מוסך לבדיקת מכון רישוי מורשה, והמסגרת הרגולטורית החלה — ראו את <Link href="/warranty" className="text-[#0d9488] hover:underline font-medium">מסמך האחריות בנושא בדיקות רכב</Link>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7A - Regulatory Compliance */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[#1e3a5f]" />
              <h2 className="text-xl font-bold text-[#1e3a5f]">7א. עמידה ברגולציה</h2>
            </div>
            <p className="mb-3">
              השימוש בפלטפורמת AutoLog כפוף לכל דין ורגולציה חלים, לרבות:
            </p>
            <ul className="space-y-2 list-disc list-inside mb-4">
              <li>פקודת התעבורה [נוסח חדש] ותקנות התעבורה</li>
              <li>חוק רישוי שירותים ומקצועות בענף הרכב, תשע"ו-2016</li>
              <li>הוראות משרד התחבורה והבטיחות בדרכים</li>
              <li>חוק הגנת הצרכן, התשמ"א-1981</li>
            </ul>
            <p className="mb-3">
              מוסכים שותפים מתחייבים להחזיק בכל הרישיונות וההיתרים הנדרשים על פי חוק, להעסיק טכנאים מוסמכים בלבד, ולהבהיר ללקוחות כי בדיקות המבוצעות דרך AutoLog אינן מהוות בדיקת מכון רישוי מורשה.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm font-medium">
                AutoLog ממליצה לכל רוכש רכב יד שנייה לבצע, בנוסף לבדיקת מוסך, גם בדיקה במכון רישוי מורשה מטעם משרד התחבורה — שהיא הבדיקה היחידה בעלת תוקף משפטי מחייב.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">8. קניין רוחני</h2>
            <p>
              כל הזכויות באפליקציה, לרבות עיצוב, קוד, תוכן, לוגו וסימני מסחר, שייכות ל-AutoLog בע"מ.
              אין להעתיק, לשכפל, להפיץ או לעשות שימוש מסחרי בכל חלק מהאפליקציה ללא אישור מראש בכתב.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">9. סיום שימוש</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>המשתמש רשאי לבטל את חשבונו בכל עת.</li>
              <li>AutoLog רשאית להשעות או לבטל חשבון בשל הפרת תנאי השימוש.</li>
              <li>במקרה של ביטול חשבון, מידע אישי יימחק בהתאם למדיניות הפרטיות.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">10. שינויים בתנאי השימוש</h2>
            <p>
              AutoLog שומרת לעצמה את הזכות לעדכן תנאים אלו מעת לעת.
              שינויים מהותיים יפורסמו באפליקציה ו/או ישלחו בהתראה למשתמשים.
              המשך השימוש לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">11. יצירת קשר</h2>
            <p className="mb-2">לכל שאלה או פנייה בנוגע לתנאי השימוש, ניתן ליצור קשר:</p>
            <ul className="space-y-1">
              <li><strong>דוא"ל:</strong> info@autolog.click</li>
              <li><strong>כתובת:</strong> משה בקר 29, ראשון לציון</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">12. דין וסמכות שיפוט</h2>
            <p>
              תנאי שימוש אלו כפופים לחוקי מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט
              המוסמכים במחוז מרכז, ישראל.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">13. הוראות נוספות</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>אם סעיף כלשהו בתנאים אלו יימצא בלתי תקף, שאר הסעיפים ימשיכו לעמוד בתוקפם.</li>
              <li>אי אכיפה של זכות על פי תנאים אלו אינה מהווה ויתור על אותה זכות.</li>
              <li>תנאים אלו מהווים את ההסכם המלא בין המשתמש לבין AutoLog.</li>
            </ul>
          </section>
        </div>

        {/* Footer link to privacy */}
        <div className="text-center mt-8">
          <Link href="/privacy" className="inline-flex items-center gap-2 text-[#0d9488] hover:underline font-medium">
            <Shield size={16} />
            מדיניות פרטיות
          </Link>
        </div>
      </main>
    </div>
  );
}
