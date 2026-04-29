export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  keywords: string[];
  readingTime: string;
  category: string;
}

/**
 * Blog posts registry. Each post has a corresponding page at /blog/[slug].
 * Content is rendered in the page component itself (for SSR + SEO).
 */
export const blogPosts: BlogPost[] = [
  {
    slug: 'matai-hatest-shel-harechev-sheli',
    title: 'מתי הטסט של הרכב שלי? המדריך המלא לבעלי רכב',
    description: 'איך לבדוק מתי הטסט של הרכב שלך, מה עולה טסט, ואיך AutoLog שולחת לך תזכורת אוטומטית כדי שלא תפספס אף מועד.',
    publishedAt: '2026-04-29',
    author: 'AutoLog',
    keywords: ['מתי הטסט של הרכב שלי', 'תזכורת טסט', 'טסט רכב', 'חידוש רישיון רכב', 'בדיקת תאריך טסט'],
    readingTime: '5 דקות',
    category: 'מדריכים',
  },
  {
    slug: 'kama-ole-rechev-bachodesh',
    title: 'כמה באמת עולה לך הרכב בחודש? המדריך לחישוב הוצאות רכב',
    description: 'רוב בעלי הרכב מזלזלים בעלות האמיתית. מדריך מלא לחישוב כל ההוצאות — דלק, ביטוח, טסט, תחזוקה, ואיך לחסוך.',
    publishedAt: '2026-04-29',
    author: 'AutoLog',
    keywords: ['הוצאות רכב חודשיות', 'עלות אחזקת רכב', 'מעקב הוצאות רכב', 'חיסכון הוצאות רכב'],
    readingTime: '6 דקות',
    category: 'חיסכון',
  },
  {
    slug: 'checklist-lifnei-test',
    title: '5 דברים שחייבים לבדוק לפני הטסט — צ\'קליסט מלא',
    description: 'מה לבדוק ברכב לפני הטסט השנתי כדי לעבור בהצלחה בפעם הראשונה. רשימה מלאה + טיפים מבעלי מוסכים.',
    publishedAt: '2026-04-29',
    author: 'AutoLog',
    keywords: ['הכנה לטסט רכב', 'בדיקה לפני טסט', 'טסט לרכב', 'מה בודקים בטסט'],
    readingTime: '4 דקות',
    category: 'מדריכים',
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
