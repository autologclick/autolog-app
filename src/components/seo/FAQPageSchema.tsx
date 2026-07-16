/**
 * FAQPageSchema — JSON-LD Schema.org FAQPage markup.
 *
 * Adds eligibility for "FAQ rich results" in Google — collapsible Q&A blocks
 * directly in search results that boost CTR significantly.
 *
 * Use on the homepage and on articles with FAQ sections.
 *
 * Each question/answer in `faqs` MUST already exist as visible text on the page.
 * Google penalizes schema that doesn't match visible content.
 */

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageSchemaProps {
  faqs: FAQItem[];
}

export default function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "inLanguage": "he-IL",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Homepage FAQs — use these EXACT strings both in the schema and in the visible
 * FAQ section on the homepage. The text MUST match.
 */
export const HOMEPAGE_FAQS: FAQItem[] = [
  {
    question: "מה זה אוטולוג?",
    answer:
      "אוטולוג היא הפלטפורמה הישראלית המובילה לניהול רכב חכם. עם אוטולוג מקבלים תזכורות אוטומטיות לטסט וביטוח, סורקים מסמכים עם בינה מלאכותית, עוקבים אחרי הוצאות הרכב, ומקבלים עוזר AI אישי לכל שאלה על הרכב. הכל חינם, ללא הורדת אפליקציה."
  },
  {
    question: "האם אוטולוג בחינם?",
    answer:
      "כן, אוטולוג בחינם לחלוטין לכל המשתמשים הפרטיים. אין דמי הרשמה, אין דמי שימוש חודשיים, ואין הגבלה על מספר הרכבים שאפשר לנהל בחשבון."
  },
  {
    question: "האם צריך להוריד אפליקציה כדי להשתמש באוטולוג?",
    answer:
      "לא. אוטולוג היא פלטפורמת ווב — נכנסים מהדפדפן בנייד או במחשב ומתחילים מיד. ניתן להוסיף את אוטולוג למסך הבית כ-PWA כדי לקבל חוויה דמוית-אפליקציה ללא צורך בחנות אפליקציות."
  },
  {
    question: "איך אוטולוג שולחת תזכורות?",
    answer:
      "אוטולוג שולחת תזכורות באימייל, בדחיפת התראות לדפדפן (Push), ובאפשרות גם ב-SMS. תזכורות נשלחות אוטומטית לפני שפג תוקף הטסט, הביטוח או הרישיון — בזמן שתוגדר בהעדפות שלך."
  },
  {
    question: "האם המידע שלי באוטולוג מאובטח?",
    answer:
      "כן. אוטולוג מצפינה את כל המידע האישי באמצעות הצפנת AES-256-GCM. כל התעבורה בין הדפדפן לאוטולוג מתבצעת ב-HTTPS עם תעודת SSL. הגישה לחשבון מוגנת ב-JWT עם רוטציית טוקנים, נעילת חשבון אוטומטית, וזיהוי דו-שלבי (TOTP/MFA)."
  },
  {
    question: "האם אפשר לנהל באוטולוג יותר מרכב אחד?",
    answer:
      "בהחלט. באוטולוג ניתן להוסיף ולנהל מספר בלתי מוגבל של רכבים בחשבון אחד — מתאים גם לבעלי משפחה עם כמה רכבים, וגם לעסקים קטנים עם צי רכבים."
  },
  {
    question: "מי הקים את אוטולוג?",
    answer:
      "אוטולוג נוסדה בשנת 2026 בידי יזם ישראלי שהתעצבן על הסטרס שכרוך בניהול רכב — לזכור מתי הטסט, מתי הביטוח, איפה שמת את הקבלה מהמוסך. אוטולוג נבנתה כדי לפתור את כל זה בכלי אחד פשוט."
  }
];
