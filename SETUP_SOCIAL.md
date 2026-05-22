# מרכז סושיאל — מדריך הקמה

עמוד זה מסביר איך להפעיל את עמוד `/admin/social` בפעם הראשונה:
מה צריך להוסיף ל-`.env`, איך להריץ את ה-migration של Prisma,
ואיך להגדיר את אפליקציית Meta Developers כדי שהפרסום בפייסבוק
ובאינסטגרם יעבוד.

> **למשתמשים זריזים:** סעיף 1 (env) + סעיף 2 (DB) מספיק כדי שמחולל
> הפוסטים, מחולל הגרפיקה ותבניות WhatsApp יעבדו. סעיפים 3–4 נדרשים
> רק לחיבור פייסבוק / אינסטגרם.

---

## 1. משתני סביבה (`.env` / Vercel)

הוסף את המשתנים הבאים לקובץ `.env` (לוקאלי) ו-Vercel Project Settings:

```bash
# --- AI generation (מחולל פוסטים ותמונות) ---
ANTHROPIC_API_KEY="sk-ant-..."         # https://console.anthropic.com
OPENAI_API_KEY="sk-..."                # https://platform.openai.com (DALL-E 3)

# --- Vercel Blob (אחסון תמונות שנוצרות ע"י AI) ---
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# --- Meta (Facebook + Instagram) ---
META_APP_ID="123456789012345"          # מ-Meta Developer Portal
META_APP_SECRET="..."                  # סודי — לא לחשוף לדפדפן
NEXT_PUBLIC_META_APP_ID="123456789012345"   # אותו ID, חשוף לדפדפן (לכפתור OAuth)

# --- Cron secret (Vercel Cron אוטומטית מצרף Authorization: Bearer <זה>) ---
CRON_SECRET="ייצר-מחרוזת-אקראית-ארוכה"
```

---

## 2. מיגרציה של ה-DB

נוספו ארבעה מודלים ל-Prisma: `SocialAccount`, `SocialPost`, `PostTemplate`,
`WhatsAppTemplate`, `BrandAsset` + שני enums. צריך לדחוף לסכמה:

```bash
cd autolog-app
npx prisma db push          # מעדכן את Neon DB
npx prisma generate         # מייצר client חדש
```

לאחר מכן הפעל מחדש את הדבסרבר (`npm run dev`) כדי לטעון את ה-client החדש.

---

## 3. יצירת Meta Developer App

1. עבור ל-https://developers.facebook.com/apps וצור אפליקציה חדשה
   (Type: **Business**).
2. ב-Settings → Basic, רשום את ה-**App ID** וה-**App Secret** ב-env.
3. **Add Product → Facebook Login for Business** — תחת Settings, הגדר:
   - Valid OAuth Redirect URIs:
     ```
     https://YOUR-DOMAIN/api/admin/social/meta/oauth-callback
     http://localhost:3000/api/admin/social/meta/oauth-callback
     ```
   - Allowed Domains for the JavaScript SDK: הדומיין שלך.
4. **Add Product → Instagram → Instagram Graph API** (לפרסום ב-IG).
5. **App Review → Permissions and Features** — בקש הרשאות מ-Meta:
   - `pages_show_list`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`

   עד שההרשאות מאושרות, ה-OAuth עובד רק עם משתמשים שהוספת ידנית
   כ-Developers / Testers (App Roles).

6. ודא ש-Facebook Page העסקי שלך מקושר ל-Instagram Business Account
   ושיש לך גישת ניהול לשניהם.

לאחר מכן: כנס ל-`/admin/social`, לחץ **"חבר Facebook + Instagram"** —
תועבר ל-Meta, תאשר את ההרשאות, ותחזור עם החשבונות מחוברים.

---

## 4. WhatsApp Business (אופציונלי)

תבניות WhatsApp נשמרות במערכת אבל לא נשלחות אוטומטית עד שהן
מאושרות ב-Meta. מהלך מומלץ:

1. ב-Meta Business Manager → **WhatsApp Manager** → Message Templates,
   צור תבנית עם אותם placeholders ({{1}}, {{2}}…) שיש בטיוטה שלך כאן.
2. אחרי שהתבנית **approved**, העתק את ה-ID שלה ל-`metaTemplateId`
   ברשומה אצלך (כפתור "ערוך" בטאב WhatsApp).
3. לשליחה אוטומטית: צריך להוסיף `WHATSAPP_PHONE_NUMBER_ID` ו-
   `WHATSAPP_ACCESS_TOKEN` ל-env ופונקציית שליחה (לא הוכנס כברירת מחדל —
   להוסיף בקובץ נפרד `/lib/social/whatsapp-publisher.ts`).

---

## 5. תזמון אוטומטי (Vercel Cron)

עדכן את `vercel.json` להריץ cron כל 5 דקות:

```json
{
  "crons": [
    { "path": "/api/cron/publish-scheduled", "schedule": "*/5 * * * *" }
  ]
}
```

Cron זה סורק פוסטים עם `status=scheduled` ו-`scheduledFor <= now` ומפרסם אותם.

---

## 6. בדיקה ראשונית

1. `/admin/social` → טאב "מחולל פוסטים" → כתוב נושא → לחץ "צור פוסט"
   → אמור לקבל טקסט עברי בשפת המותג + הצעת תמונה.
2. לחץ "צור תמונה תואמת" → DALL-E מחזיר תמונה, נשמרת ב-Blob.
3. "שמור טיוטה" או "תזמן" → רואים את הפוסט בטאב "תזמון ופוסטים".
4. בטאב "תזמון", לחץ Send → הפוסט נשלח ל-FB/IG ועדכן ל-published.

---

## 7. פתרון בעיות

| תקלה | סיבה | פתרון |
|------|------|-------|
| `ANTHROPIC_API_KEY חסר` | מפתח לא הוגדר | הוסף ל-`.env` + הפעל מחדש |
| `אינסטגרם דורש תמונה` | פוסט IG בלי `mediaUrls[0]` | צרף תמונה מ-DALL-E או מהגרפיקה |
| Meta OAuth `short_token_failed` | Redirect URI לא מאושר | הוסף בדיוק את אותו URI ב-App Settings |
| Cron לא רץ | `CRON_SECRET` לא תואם | ודא שהוא ב-Vercel ENV וב-vercel.json |
| תבנית WA לא נשלחת | חסר `metaTemplateId` | חכה לאישור Meta, הדבק את ה-ID |

---

## 8. עריכת שפת המותג

עורך הטקסט החי של שפת המותג הוא הקובץ:
```
src/lib/social/brand-voice.ts
```
שינוי שם משפיע על כל פוסט שייוצר מהרגע שנשמר וה-build רץ. שמור על
ה-`BRAND_VOICE_VERSION` כדי לעקוב מאיזה גרסה כל פוסט הופק.
