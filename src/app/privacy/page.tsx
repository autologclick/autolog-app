'use client';

import Link from 'next/link';
import { ArrowRight, Shield, FileText, AlertTriangle } from 'lucide-react';

export default function PrivacyPage() {
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-bold text-[#1B4E8A] mb-3">{children}</h2>
  );
  const S = ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#1B4E8A] hover:opacity-80 transition">
            <ArrowRight size={20} />
            <span className="text-sm font-medium">חזרה לדף הבית</span>
          </Link>
          <Link href="/" className="text-xl font-bold text-[#1B4E8A]">
            Auto<span className="text-[#2E77D0]">Log</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2E77D0]/10 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-[#2E77D0]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1B4E8A] mb-2">מדיניות פרטיות</h1>
          <p className="text-gray-500 text-sm">עדכון אחרון: 14 ביולי 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">

          <p className="text-gray-600">
            AutoLog (&quot;השירות&quot;, &quot;אנחנו&quot;) היא פלטפורמה דיגיטלית לניהול רכבים.
            מדיניות זו מסבירה, בשקיפות מלאה, איזה מידע אנו אוספים, מה אנו עושים איתו, למי הוא מועבר,
            כמה זמן הוא נשמר, ואילו זכויות עומדות לך. המדיניות נכתבה בהתאם לחוק הגנת הפרטיות,
            התשמ&quot;א-1981 (לרבות תיקון 13) ולתקנות הגנת הפרטיות (אבטחת מידע), התשע&quot;ז-2017.
          </p>

          <S>
            <H>1. מי מפעיל את השירות</H>
            <ul className="space-y-1">
              <li><strong>מפעיל השירות ובעל המאגר:</strong> AutoLog</li>
              <li><strong>כתובת:</strong> משה בקר 29, ראשון לציון</li>
              <li><strong>דוא&quot;ל לפניות בנושא פרטיות:</strong> <a href="mailto:info@autolog.click" className="text-[#2E77D0] hover:underline">info@autolog.click</a></li>
            </ul>
          </S>

          <S>
            <H>2. איזה מידע אנו אוספים</H>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">א. מידע שאתה מוסר בעת ההרשמה וניהול החשבון</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>שם מלא, כתובת דוא&quot;ל, מספר טלפון</li>
              <li>כתובת מגורים ועיר</li>
              <li><strong>מספר תעודת זהות</strong> ומספר רישיון נהיגה ותוקפו</li>
              <li>תאריך לידה ומגדר (ככל שנמסרו)</li>
              <li>סיסמה — נשמרת מגובבת (hashed) בלבד ואינה ניתנת לשחזור</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">ב. מידע על הרכב</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>מספר רישוי, מספר שלדה (VIN), יצרן, דגם, שנה, צבע, קילומטראז&apos;</li>
              <li>נתוני טסט: תאריכים, עלות, תחנת בדיקה, מסמכים סרוקים</li>
              <li>נתוני ביטוח: חברה, סוג, מספר פוליסה, תאריכי תוקף, עלויות, מסמכים סרוקים</li>
              <li>היסטוריית טיפולים, הוצאות, קבלות ומסמכים שהעלית</li>
              <li>פרטי נהגים נוספים ברכב (שם, טלפון, רישיון) — ככל שהזנת</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">ג. תיעוד תאונות ואירועים</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>תיאור האירוע, מועד, <strong>מיקום גיאוגרפי (GPS)</strong> ותמונות</li>
              <li><strong>מידע על פציעות ונפגעים</strong> — ככל שתזין אותו</li>
              <li>מעורבות משטרה ומספר דוח, קריאה לאמבולנס</li>
              <li>פרטי הביטוח שלך ומספר הפוליסה</li>
              <li><strong>פרטי צדדים שלישיים</strong> — ראה סעיף 3 להלן</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">ד. מידע שנאסף אוטומטית</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>כתובת IP, סוג הדפדפן והמכשיר</li>
              <li>רישומי גישה ופעולות במערכת (לוגים) — נדרשים לפי תקנות אבטחת מידע</li>
              <li>קובצי Cookie הדרושים לאימות ולשמירת ההתחברות</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">ה. מידע נוסף למוסכים שותפים</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>פרטי העסק, רישיון עסק, ח.פ, פרטי מכונאים</li>
              <li>בבדיקות רכב: שם הלקוח, מספר תעודת זהות, <strong>וחתימה גרפית</strong></li>
            </ul>
          </S>

          <S>
            <div className="bg-amber-50 border-r-4 border-amber-400 rounded-lg p-5">
              <H>3. מידע על צדדים שלישיים — חשוב במיוחד</H>
              <p className="mb-3">
                בעת תיעוד תאונה, השירות מאפשר לך להזין מידע על <strong>אנשים שאינם משתמשי AutoLog</strong> —
                הנהג המעורב, בעל הרכב האחר, ועדים לאירוע. מידע זה עשוי לכלול שם, מספר תעודת זהות,
                טלפון, מספר רכב, מספר רישיון נהיגה ופרטי ביטוח.
              </p>
              <p className="mb-3">
                <strong>האחריות להזנת מידע זה היא שלך.</strong> בעת הזנת פרטים של אדם אחר, עליך לוודא
                שאתה רשאי לעשות כן — למשל במסגרת חובת חילופי הפרטים לאחר תאונה לפי דין,
                או בהסכמת אותו אדם. אנו מעבדים מידע זה עבורך, לצורך תיעוד האירוע וטיפול בתביעת הביטוח בלבד.
              </p>
              <p>
                <strong>אם פרטיך הוזנו למערכת על ידי משתמש אחר</strong> ואתה מבקש לעיין בהם, לתקנם או
                למחוק אותם — פנה אלינו בכתובת <a href="mailto:info@autolog.click" className="text-[#2E77D0] hover:underline font-semibold">info@autolog.click</a> ונטפל בפנייתך.
              </p>
            </div>
          </S>

          <S>
            <H>4. למה אנו משתמשים במידע</H>
            <ul className="space-y-1 list-disc list-inside">
              <li>הפעלת השירות: ניהול הרכב, מעקב טסטים, ביטוחים, טיפולים והוצאות</li>
              <li>שליחת תזכורות ועדכונים (טסט, ביטוח, טיפול)</li>
              <li>תיעוד תאונות והפקת דוח לצורך התנהלות מול חברת הביטוח והצד השני</li>
              <li>קריאה אוטומטית של מסמכים שהעלית (ראה סעיף 5)</li>
              <li>אימות זהות, אבטחת החשבון ומניעת שימוש לרעה</li>
              <li>איתור מוסכים מורשים באזורך</li>
              <li>עמידה בחובות חוקיות</li>
            </ul>
            <p className="mt-3 font-medium text-gray-800">
              איננו מוכרים מידע אישי לצדדים שלישיים ואיננו מעבירים אותו למפרסמים.
            </p>
          </S>

          <S>
            <H>5. עיבוד מסמכים באמצעות בינה מלאכותית</H>
            <p>
              כאשר אתה מצלם או מעלה מסמך (רישיון רכב, פוליסת ביטוח, קבלה), אנו שולחים את התמונה
              לשירות בינה מלאכותית חיצוני — <strong>Anthropic ו/או OpenAI (ארצות הברית)</strong> — לצורך
              קריאה אוטומטית של הפרטים והזנתם בשבילך. המסמך עשוי להכיל את שמך, כתובתך ומספר תעודת הזהות שלך.
              השימוש הוא לצורך חילוץ הנתונים בלבד. אם אינך מעוניין בכך, באפשרותך להזין את הפרטים ידנית.
            </p>
            <p className="mt-3">
              בנוסף, השירות כולל <strong>עוזר AI לשאלות על הרכב</strong>. שאלות שתשאל ופרטי הרכב הרלוונטיים
              נשלחים לאותם ספקים לצורך יצירת התשובה.
            </p>
          </S>

          <S>
            <H>6. למי המידע מועבר</H>
            <p className="mb-3">אנו נעזרים בספקי שירות הבאים, שכל אחד מהם מקבל רק את המידע הדרוש לתפקידו:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-right p-2 border-b border-gray-200">ספק</th>
                    <th className="text-right p-2 border-b border-gray-200">תפקיד</th>
                    <th className="text-right p-2 border-b border-gray-200">מיקום</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border-b border-gray-100">DigitalOcean</td><td className="p-2 border-b border-gray-100">אחסון השרת ובסיס הנתונים</td><td className="p-2 border-b border-gray-100">פרנקפורט, גרמניה</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Vercel</td><td className="p-2 border-b border-gray-100">אחסון תמונות ומסמכים</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Anthropic</td><td className="p-2 border-b border-gray-100">קריאת מסמכים (AI)</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Resend</td><td className="p-2 border-b border-gray-100">שליחת דוא&quot;ל</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Google Drive</td><td className="p-2 border-b border-gray-100">גיבוי מוצפן</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Sentry</td><td className="p-2 border-b border-gray-100">ניטור תקלות</td><td className="p-2 border-b border-gray-100">ארה&quot;ב / אירופה</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">OpenAI</td><td className="p-2 border-b border-gray-100">קריאת מסמכים ועוזר AI (חלופי ל-Anthropic)</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Twilio</td><td className="p-2 border-b border-gray-100">הודעות SMS ו-WhatsApp</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Stripe</td><td className="p-2 border-b border-gray-100">סליקת תשלומים (אם וכאשר יוצעו שירותים בתשלום)</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Google Analytics</td><td className="p-2 border-b border-gray-100">ניתוח שימוש באתר</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">שירות מפות</td><td className="p-2 border-b border-gray-100">איתור מוסכים וניווט</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Meta (Facebook / Instagram / WhatsApp)</td><td className="p-2 border-b border-gray-100">שיווק ותקשורת</td><td className="p-2 border-b border-gray-100">ארה&quot;ב</td></tr>
                  <tr><td className="p-2 border-b border-gray-100">Telegram</td><td className="p-2 border-b border-gray-100">התראות תפעוליות פנימיות</td><td className="p-2 border-b border-gray-100">חו&quot;ל</td></tr>
                  <tr><td className="p-2">data.gov.il</td><td className="p-2">נתוני רכב ומוסכים (משרד התחבורה)</td><td className="p-2">ישראל</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">בנוסף, מידע עשוי להימסר:</p>
            <ul className="space-y-1 list-disc list-inside mt-2">
              <li><strong>למוסך שותף</strong> — רק אם פנית אליו או הזמנת שירות</li>
              <li><strong>למי שאתה משתף איתו במפורש</strong> — ראה סעיף 7</li>
              <li><strong>לרשויות</strong> — כאשר הדבר נדרש על פי דין</li>
            </ul>
          </S>

          <S>
            <H>7. קישורי שיתוף של דוח תאונה</H>
            <p>
              השירות מאפשר לך לייצר קישור לדוח תאונה ולשלוח אותו, למשל, לסוכן הביטוח שלך.
              חשוב שתדע:
            </p>
            <ul className="space-y-1 list-disc list-inside mt-2">
              <li>הקישור פועל <strong>ללא צורך בהתחברות</strong> — כל מי שמחזיק בו יוכל לצפות בדוח</li>
              <li>תוקף הקישור מוגבל ל-<strong>7 ימים</strong> ולאחר מכן הוא מפסיק לפעול</li>
              <li>בצפייה דרך קישור, <strong>מספרי תעודת זהות ורישיון נהיגה מוצגים מוסתרים חלקית</strong></li>
              <li>כל צפייה בקישור נרשמת ביומן המערכת</li>
              <li>הקישורים חסומים לאינדוקס במנועי חיפוש</li>
            </ul>
            <p className="mt-3">שלח את הקישור רק לגורם שאתה סומך עליו.</p>
          </S>

          <S>
            <H>8. העברת מידע אל מחוץ לישראל</H>
            <p>
              השרת הראשי ובסיס הנתונים מאוחסנים ב<strong>גרמניה (האיחוד האירופי)</strong>.
              חלק מהשירותים הנלווים — אחסון קבצים, שליחת דוא&quot;ל, עיבוד מסמכים ב-AI, גיבוי וניטור —
              מופעלים בארצות הברית, כמפורט בסעיף 6. אנו פועלים להסדרת ההעברות בהתאם לתקנות
              הגנת הפרטיות (העברת מידע אל מאגרים מחוץ לגבולות המדינה), התשס&quot;א-2001.
            </p>
          </S>

          <S>
            <H>9. כמה זמן נשמר המידע</H>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>פרטי החשבון והרכבים</strong> — כל עוד החשבון פעיל</li>
              <li><strong>תיעוד תאונות</strong> — כל עוד החשבון פעיל. מומלץ לייצא דוח לפני מחיקת חשבון, שכן ייתכן שתזדקק לו בהליך ביטוחי או משפטי</li>
              <li><strong>יומני גישה ואבטחה</strong> — נשמרים בנפרד, כנדרש בתקנות אבטחת מידע, גם לאחר מחיקת החשבון (ללא פרטיך האישיים)</li>
              <li><strong>גיבויים מוצפנים</strong> — נשמרים עד 30 יום ואז נמחקים אוטומטית</li>
            </ul>
            <p className="mt-3">
              עם מחיקת החשבון, המידע האישי שלך — לרבות רכבים, טיפולים, מסמכים ותיעוד תאונות —
              נמחק מבסיס הנתונים הפעיל. עותקים בגיבויים המוצפנים נמחקים בתום מחזור הגיבוי.
            </p>
          </S>

          <S>
            <H>10. אבטחת מידע</H>
            <ul className="space-y-1 list-disc list-inside">
              <li>הצפנת התעבורה בפרוטוקול TLS (HTTPS)</li>
              <li>סיסמאות נשמרות מגובבות בלבד</li>
              <li>אימות דו-שלבי (2FA) וקוד חד-פעמי לדוא&quot;ל</li>
              <li>בסיס הנתונים אינו חשוף לאינטרנט</li>
              <li>גיבויים מוצפנים בתקן AES-256 לפני יציאתם מהשרת</li>
              <li>רישום ותיעוד של פעולות וגישות במערכת</li>
              <li>חומת אש והגנה מפני ניסיונות פריצה</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              אף מערכת אינה חסינה לחלוטין. במקרה של אירוע אבטחה חמור נפעל בהתאם לחובות
              הדיווח הקבועות בדין.
            </p>
          </S>

          <S>
            <H>11. הזכויות שלך</H>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>זכות עיון</strong> — לדעת איזה מידע נשמר עליך</li>
              <li><strong>זכות תיקון</strong> — לתקן מידע שאינו נכון</li>
              <li><strong>זכות מחיקה</strong> — למחוק את החשבון ואת המידע. ניתן לבצע זאת ישירות באפליקציה: <Link href="/user/settings/delete-account" className="text-[#2E77D0] hover:underline font-semibold">הגדרות ← מחיקת חשבון</Link></li>
              <li><strong>זכות התנגדות לדיוור</strong> — להסיר את עצמך מרשימת התזכורות והעדכונים</li>
            </ul>
            <p className="mt-3">
              למימוש זכויותיך, או אם פרטיך הוזנו למערכת על ידי משתמש אחר:
              <a href="mailto:info@autolog.click" className="text-[#2E77D0] hover:underline font-semibold"> info@autolog.click</a>
            </p>
          </S>

          <S>
            <H>12. קובצי Cookie</H>
            <p>
              אנו משתמשים בשני סוגי קובצי Cookie:
            </p>
            <ul className="space-y-1 list-disc list-inside mt-2">
              <li><strong>הכרחיים</strong> — לאימות זהותך ולשמירת ההתחברות. בלעדיהם לא ניתן להתחבר.</li>
              <li><strong>אנליטיים</strong> — Google Analytics, לניתוח אופן השימוש בשירות ולשיפורו.</li>
            </ul>
            <p className="mt-3">
              איננו מוכרים מידע למפרסמים ואיננו מציגים פרסומות. ניתן לחסום קובצי Cookie
              בהגדרות הדפדפן, אך חסימת הקבצים ההכרחיים תמנע התחברות.
            </p>
          </S>

          <S>
            <H>12א. התראות ותקשורת</H>
            <p>
              בהתאם להעדפות שתגדיר, נשלח אליך תזכורות ועדכונים (טסט, ביטוח, טיפול, תורים)
              באמצעות דוא&quot;ל, הודעת SMS או WhatsApp, והתראות דחיפה (Push) בדפדפן.
              ניתן לשנות או לבטל את ההעדפות בכל עת במסך ההגדרות.
            </p>
          </S>

          <S>
            <H>13. קטינים</H>
            <p>
              השירות מיועד למשתמשים מגיל 18 ומעלה. איננו אוספים ביודעין מידע על קטינים.
              אם ייוודע לנו שנאסף מידע של קטין ללא הסכמת הורה, נמחק אותו.
            </p>
          </S>

          <S>
            <H>14. שינויים במדיניות</H>
            <p>
              נעדכן מדיניות זו מעת לעת. שינוי מהותי יובא לידיעתך באפליקציה או בדוא&quot;ל.
              המשך השימוש לאחר העדכון מהווה הסכמה למדיניות המעודכנת.
            </p>
          </S>

          <S>
            <H>15. יצירת קשר</H>
            <ul className="space-y-1">
              <li><strong>דוא&quot;ל:</strong> <a href="mailto:info@autolog.click" className="text-[#2E77D0] hover:underline">info@autolog.click</a></li>
              <li><strong>כתובת:</strong> משה בקר 29, ראשון לציון</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              אם לדעתך פגענו בפרטיותך, באפשרותך לפנות גם לרשות להגנת הפרטיות במשרד המשפטים.
            </p>
          </S>

        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          <Link href="/terms" className="inline-flex items-center gap-2 text-[#2E77D0] hover:underline font-medium">
            <FileText size={16} />תנאי שימוש
          </Link>
          <Link href="/user/settings/delete-account" className="inline-flex items-center gap-2 text-red-600 hover:underline font-medium">
            <AlertTriangle size={16} />מחיקת חשבון
          </Link>
        </div>
      </main>
    </div>
  );
}
