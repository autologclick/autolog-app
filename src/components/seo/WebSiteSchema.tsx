/**
 * WebSiteSchema — JSON-LD Schema.org WebSite markup with SearchAction.
 *
 * Adds two important signals:
 * 1. Brand entity recognition ("אוטולוג" as the WebSite name).
 * 2. SearchAction — eligible for Google's "sitelinks search box" in SERPs,
 *    which dramatically increases brand visibility once you rank.
 *
 * Include this in `app/layout.tsx` alongside OrganizationSchema.
 */

export default function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "אוטולוג",
    "alternateName": ["AutoLog", "autolog.click"],
    "url": "https://autolog.click",
    "inLanguage": "he-IL",
    "description":
      "אוטולוג — הפלטפורמה הישראלית לניהול רכב חכם. תזכורות, מעקב הוצאות, סריקת מסמכים עם AI.",
    "publisher": {
      "@type": "Organization",
      "name": "אוטולוג",
      "url": "https://autolog.click"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://autolog.click/blog?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
