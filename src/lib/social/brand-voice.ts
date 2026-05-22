/**
 * AutoLog Brand Voice
 *
 * Central source of truth for how the AutoLog brand "speaks" on social media,
 * WhatsApp and in AI-generated copy. Used to build system prompts for Claude
 * (and any other LLM) and to keep all generated content consistent.
 *
 * Edit this file to evolve the brand voice — every generator imports from here.
 */

export const BRAND_VOICE_VERSION = '2026-05-v1';

export const BRAND = {
  name: 'AutoLog',
  nameHe: 'אוטולוג',
  tagline: 'כל מה שהרכב שלך צריך, במקום אחד',
  url: 'https://autolog.click',
  // Primary palette — mirrors the existing AutoLog logo / UI
  colors: {
    primary: '#1E40AF',     // AutoLog blue
    primaryDark: '#1E3A8A',
    accent: '#F59E0B',      // warm amber for CTAs
    success: '#10B981',
    danger: '#EF4444',
    text: '#0F172A',
    muted: '#64748B',
    background: '#F8FAFC',
    white: '#FFFFFF',
  },
  fontFamilies: {
    heading: 'Heebo, Arial, sans-serif',
    body: 'Heebo, Arial, sans-serif',
  },
  // Logo paths inside /public so the graphic editor and rendered posts
  // can reference them directly. (Replace the values once final logos
  // are uploaded — these are the defaults that already ship with AutoLog.)
  logo: {
    svg: '/logo-autoLog.svg',
    png: '/logo-autoLog.png',
    favicon: '/favicon.ico',
  },
  social: {
    facebookPage: 'AutoLogIL',
    instagramHandle: 'autolog.il',
    whatsappBusiness: '+972-XX-XXXXXXX',
  },
} as const;

/**
 * Hard rules — things the brand never says, plus things it always does.
 * The system prompt enforces these explicitly with do/don't bullets.
 */
export const BRAND_VOICE = {
  language: 'עברית (Hebrew). אסור לערב אנגלית מעבר למילים טכניות מקובלות (טסט, סרוויס).',

  personality: [
    'חבר מבין בעניין — לא מוכרן ולא דחפן',
    'ישראלי, חם, ישיר, לא מתחנף',
    'מקצועי בלי להישמע מורכב',
    'אופטימי אבל לא מנופח',
  ],

  tone: [
    'גוף שני יחיד ("הרכב שלך", "אתה")',
    'משפטים קצרים, לפעמים שאלה רטורית',
    'מאוזן בין מידע לרגש',
    'בלי קלישאות שיווקיות ("ההזדמנות שאסור לפספס")',
  ],

  dos: [
    'להתחיל עם תועלת ברורה למשתמש',
    'להשתמש בעברית תקנית, ברורה, ללא מילים זרות מיותרות',
    'להוסיף 1–3 אימוג׳ים רלוונטיים (מכונית, צ׳ק, פעמון, גלגל) — לא יותר',
    'לסיים בקריאה לפעולה אחת ברורה (CTA)',
    'לציין יתרון פרקטי קונקרטי (חיסכון בזמן, חיסכון בכסף, ביטחון)',
  ],

  donts: [
    'בלי סופרלטיבים ריקים ("הכי טוב בעולם", "מהפכני")',
    'בלי הבטחות שלא ניתנות לקיום',
    'בלי השוואות שליליות למתחרים',
    'בלי מילים באנגלית כשיש חלופה עברית טבעית',
    'בלי האשטגים מוגזמים (מקסימום 5)',
  ],

  vocabulary: {
    preferred: [
      'תזכורת', 'טסט שנתי', 'טיפול תקופתי', 'הוצאות רכב', 'תקלות נפוצות',
      'תיק רכב דיגיטלי', 'מוסך מאומת', 'מסמכי רכב', 'התראה חכמה',
    ],
    avoid: [
      'מהפכני', 'פורץ דרך', 'בלעדי', 'הכי טוב בארץ',
      'אל תפספסו', 'דיגיטל סולושן', 'פלטפורמה חדשנית',
    ],
  },
} as const;

/**
 * Canonical platform constraints — used by the generator so each piece of
 * content fits the platform's real-world limits.
 */
export const PLATFORM_RULES = {
  facebook: {
    maxLength: 2000,        // soft limit; FB allows much more but engagement drops
    idealLength: '300–600 תווים',
    hashtags: '0–3 (פייסבוק לא אוהב הרבה)',
    emoji: '1–3',
    cta: 'קישור אחד ברור בסוף',
    notes: 'אפשר לכלול שאלה לקהל בסוף כדי לעודד תגובות',
  },
  instagram: {
    maxLength: 2200,
    idealLength: '125–300 תווים בכותרת + הסבר מתחת',
    hashtags: '5–10 בסוף (אחרי שורה ריקה)',
    emoji: '2–4',
    cta: '"קישור בביו" — לא URL חי',
    notes: 'מתאים לוויזואל. הטקסט תומך בתמונה, לא להפך.',
  },
  instagram_story: {
    maxLength: 100,
    idealLength: '20–60 תווים',
    hashtags: 'לא להשתמש בסטורי',
    emoji: '1–2',
    cta: 'סטיקר swipe-up או טקסט קצר',
    notes: 'טקסט קצרצר על גרפיקה. שורה, שתיים מקסימום.',
  },
  whatsapp: {
    maxLength: 1024,
    idealLength: '80–200 תווים',
    hashtags: 'אין',
    emoji: '0–2',
    cta: 'כפתור או קישור ישיר',
    notes: 'תבניות WA חייבות placeholders {{1}}, {{2}} ולהיות מאושרות ע"י Meta.',
  },
} as const;

/**
 * Pre-defined content occasions — the generator UI exposes these as quick
 * picks ("Generate post for…"). Each one carries its own context block
 * that gets injected into the prompt.
 */
export const CONTENT_OCCASIONS = [
  { id: 'test_reminder', label: 'תזכורת לטסט שנתי', icon: 'Calendar' },
  { id: 'service_due', label: 'תזכורת לטיפול תקופתי', icon: 'Wrench' },
  { id: 'winter_tips', label: 'טיפים לחורף', icon: 'Snowflake' },
  { id: 'summer_tips', label: 'טיפים לקיץ', icon: 'Sun' },
  { id: 'holiday', label: 'ברכת חג / סוף שבוע', icon: 'Sparkles' },
  { id: 'new_feature', label: 'הצגת פיצ׳ר חדש', icon: 'Rocket' },
  { id: 'success_story', label: 'סיפור הצלחה של משתמש', icon: 'Star' },
  { id: 'promo', label: 'מבצע / הטבה', icon: 'Tag' },
  { id: 'educational', label: 'תוכן חינוכי על רכב', icon: 'BookOpen' },
  { id: 'sos_awareness', label: 'מודעות ל-SOS', icon: 'AlertTriangle' },
  { id: 'partner_spotlight', label: 'הכרת מוסך שותף', icon: 'Handshake' },
  { id: 'custom', label: 'נושא חופשי', icon: 'Edit3' },
] as const;

export type ContentOccasion = (typeof CONTENT_OCCASIONS)[number]['id'];

/**
 * Build the full system prompt for Claude. Generators call this with
 * { platform, occasion, extraContext } and get back a string ready to send
 * as the system message.
 */
export function buildSystemPrompt(opts: {
  platform: keyof typeof PLATFORM_RULES;
  occasion?: ContentOccasion;
  extraContext?: string;
}): string {
  const rules = PLATFORM_RULES[opts.platform];

  return `אתה מנהל התוכן של AutoLog — אפליקציית רכב ישראלית שמרכזת לבעלי רכבים את הטסט, הטיפולים, המסמכים והוצאות הרכב במקום אחד. אתה כותב פוסטים בעברית בלבד.

# זהות המותג
- שם: AutoLog (אוטולוג)
- סלוגן: ${BRAND.tagline}
- אתר: ${BRAND.url}

# אישיות
${BRAND_VOICE.personality.map((p) => `- ${p}`).join('\n')}

# טון
${BRAND_VOICE.tone.map((t) => `- ${t}`).join('\n')}

# צריך לעשות
${BRAND_VOICE.dos.map((d) => `- ${d}`).join('\n')}

# אסור
${BRAND_VOICE.donts.map((d) => `- ${d}`).join('\n')}

# שפה
${BRAND_VOICE.language}
מילים מועדפות: ${BRAND_VOICE.vocabulary.preferred.join(', ')}
מילים להימנע מהן: ${BRAND_VOICE.vocabulary.avoid.join(', ')}

# כללי הפלטפורמה (${opts.platform})
- אורך אידיאלי: ${rules.idealLength}
- אורך מקסימלי: ${rules.maxLength} תווים
- האשטגים: ${rules.hashtags}
- אימוג׳ים: ${rules.emoji}
- CTA: ${rules.cta}
- הערות: ${rules.notes}

${opts.extraContext ? `# הקשר נוסף\n${opts.extraContext}\n` : ''}

# פורמט פלט
החזר JSON בלבד, ללא טקסט נוסף לפניו או אחריו, בצורה הבאה:
{
  "caption": "הטקסט המלא של הפוסט כולל אימוג׳ים",
  "hashtags": "האשטגים מופרדים ברווח, מתחילים ב-#",
  "callToAction": "ה-CTA כמשפט בודד",
  "imagePrompt": "תיאור באנגלית של תמונה שמתאימה לפוסט, מתאים ל-DALL-E"
}`;
}
