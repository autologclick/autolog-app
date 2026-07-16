/**
 * SoftwareApplicationSchema — JSON-LD for the AutoLog product itself.
 *
 * This marks autolog as a SoftwareApplication, making it eligible for
 * "free vehicle management software" and similar category searches.
 *
 * NOTE: aggregateRating is intentionally OMITTED. Do not add fake ratings.
 * Once you have 10+ real reviews, add an aggregateRating block — never before.
 *
 * Include on the homepage only (not the entire site).
 */

export default function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "אוטולוג",
    "alternateName": "AutoLog",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Vehicle Management",
    "operatingSystem": "Web, iOS, Android (Progressive Web App)",
    "url": "https://autolog.click",
    "description":
      "אוטולוג — אפליקציית ניהול רכב חינמית בעברית. תזכורות אוטומטיות לטסט וביטוח, מעקב הוצאות, סריקת מסמכים עם AI, היסטוריית טיפולים, ועוזר רכב חכם. ללא הורדה — פשוט נרשמים ומתחילים.",
    "inLanguage": "he-IL",
    "isAccessibleForFree": true,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "ILS",
      "availability": "https://schema.org/InStock",
      "url": "https://autolog.click/auth/signup"
    },
    "featureList": [
      "תזכורות אוטומטיות לטסט שנתי",
      "תזכורות לחידוש ביטוח רכב",
      "סריקת מסמכים עם בינה מלאכותית (AI)",
      "מעקב הוצאות רכב",
      "היסטוריית טיפולים ותחזוקה",
      "קביעת תורים למוסך",
      "עוזר AI אישי לרכב",
      "הקלטה קולית בעברית",
      "שירות חירום SOS",
      "ניהול מספר רכבים בחשבון אחד"
    ],
    "screenshot": "https://autolog.click/opengraph-image",
    "softwareVersion": "1.0",
    "datePublished": "2026-05-27",
    "publisher": {
      "@type": "Organization",
      "name": "אוטולוג",
      "url": "https://autolog.click"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
