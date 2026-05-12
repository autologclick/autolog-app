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
  {
    slug: 'kama-ole-test-shnati-2026',
    title: 'כמה עולה טסט שנתי לרכב 2026 — מדריך מחירים מלא',
    description: 'מחירי טסט שנתי לרכב פרטי, מסחרי, ג׳יפ ואופנוע ב-2026. מה כולל המחיר, אגרת רישוי, וטיפים לחיסכון.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['כמה עולה טסט שנתי 2026', 'מחיר טסט רכב', 'אגרת רישוי 2026', 'טסט שנתי לרכב פרטי'],
    readingTime: '7 דקות',
    category: 'מחירים',
  },
  {
    slug: 'ma-ze-ovd2',
    title: 'מה זה אבחון OBD2 — המדריך המלא לבעלי רכב 2026',
    description: 'מה זה OBD2, איך זה עובד, מה אפשר לבדוק עם סורק לרכב, וכמה זה עולה. המדריך השלם לאבחון רכב עצמאי.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['מה זה אבחון OBD2', 'סורק OBD', 'אבחון רכב', 'מחשב רכב', 'סורק תקלות לרכב'],
    readingTime: '8 דקות',
    category: 'טכני',
  },
  {
    slug: 'tizkoret-bituach-rechev',
    title: 'תזכורת חידוש ביטוח רכב — 5 דרכים לא לפספס שוב',
    description: 'איך לוודא שתזכור לחדש את ביטוח הרכב בזמן? 5 שיטות מעשיות, מהפשוטות ועד החכמות, לא להישאר ללא ביטוח אף פעם שוב.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['תזכורת חידוש ביטוח רכב', 'ביטוח רכב פג', 'חידוש ביטוח חובה', 'איך לדעת מתי הביטוח פג'],
    readingTime: '7 דקות',
    category: 'ביטוח',
  },
  {
    slug: 'bdika-lifnei-kniyat-rechev-tel-aviv',
    title: 'בדיקה לפני קניית רכב בתל אביב — מחירים, מכונים מומלצים והשוואה 2026',
    description: 'המדריך המלא לבדיקת רכב לפני קנייה בתל אביב — רשימת מכונים מובילים, השוואת מחירים, מה לבדוק וטיפים לקנייה חכמה.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['בדיקה לפני קניית רכב בתל אביב', 'מכון בדיקה תל אביב', 'בדיקת רכב לפני קניה', 'מחירי בדיקת רכב'],
    readingTime: '9 דקות',
    category: 'גיאוגרפי',
  },
  {
    slug: 'bdika-lifnei-kniyat-rechev-jerusalem',
    title: 'בדיקה לפני קניית רכב בירושלים — מדריך מלא 2026',
    description: 'איפה לבדוק רכב יד שנייה בירושלים? רשימת מכונים מומלצים, השוואת מחירים, מה כוללת הבדיקה וטיפים לקונים זהירים.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['בדיקה לפני קניית רכב בירושלים', 'מכון בדיקה ירושלים', 'בדיקת רכב יד שנייה ירושלים'],
    readingTime: '8 דקות',
    category: 'גיאוגרפי',
  },
  {
    slug: 'mechoney-bdika-rishon-letzion',
    title: 'מכוני בדיקה לרכב בראשון לציון — השוואת מחירים והמלצות 2026',
    description: 'רשימה מלאה של מכוני בדיקה לרכב בראשון לציון, מחירים, שעות פעילות, ביקורות לקוחות ומה לבדוק לפני שמזמינים תור.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['מכון בדיקה לרכב בראשון לציון', 'בדיקת רכב ראשון לציון', 'מכוני רישוי ראשון לציון'],
    readingTime: '8 דקות',
    category: 'גיאוגרפי',
  },
  {
    slug: 'ma-livdok-lifnei-kniyat-rechev-yad-shniya',
    title: 'מה לבדוק לפני קניית רכב יד שנייה — צ\'קליסט מלא 2026',
    description: 'הצ׳קליסט המקיף לקניית רכב יד שנייה — 50 דברים לבדוק לפני שאתם משלמים, כולל מסמכים, נסיעת מבחן ואיתור תקלות נפוצות.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['מה לבדוק לפני קניית רכב יד שנייה', 'קניית רכב יד שנייה', 'צ׳קליסט קניית רכב'],
    readingTime: '12 דקות',
    category: 'מדריכים',
  },
  {
    slug: '7-applikatziot-lenihul-rechev-2026',
    title: '7 אפליקציות לניהול רכב 2026 — השוואה מקיפה',
    description: 'השוואה אובייקטיבית של 7 אפליקציות לניהול רכב — Drivvo, Fuelio, AutoLog ועוד. תכונות, מחירים, יתרונות וחסרונות.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['אפליקציה לניהול רכב', 'אפליקציה לבעלי רכב', 'השוואת אפליקציות רכב', 'AutoLog Drivvo'],
    readingTime: '10 דקות',
    category: 'השוואות',
  },
  {
    slug: '12-tipim-lechisachon-bedelek',
    title: '12 טיפים לחיסכון בדלק לרכב 2026 — לחסוך עד 25%',
    description: 'איך לחסוך אלפי שקלים בדלק בשנה? 12 טיפים מעשיים שכל נהג יכול ליישם מחר בבוקר ולראות תוצאות מיידיות.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['חיסכון בדלק', 'איך לחסוך בדלק', 'צריכת דלק רכב', 'דלק רכב ייעוץ'],
    readingTime: '8 דקות',
    category: 'חיסכון',
  },
  {
    slug: 'haavarat-baalut-al-rechev-2026',
    title: 'החלפת בעלות על רכב 2026 — מדריך מלא צעד אחר צעד',
    description: 'איך מעבירים בעלות על רכב בישראל בצורה דיגיטלית? כל המסמכים, האגרות, הצעדים, וטיפים להימנע מבעיות עם רשות הרישוי.',
    publishedAt: '2026-05-12',
    author: 'AutoLog',
    keywords: ['החלפת בעלות רכב', 'העברת בעלות על רכב', 'מסמכים להעברת בעלות', 'אגרת העברת בעלות'],
    readingTime: '9 דקות',
    category: 'בירוקרטיה',
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
