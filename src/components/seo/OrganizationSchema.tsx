/**
 * OrganizationSchema — JSON-LD Schema.org Organization markup.
 *
 * CRITICAL: The primary `name` is in HEBREW ("אוטולוג") because the SEO goal is
 * to rank for the Hebrew brand keyword. English variants live in `alternateName`.
 *
 * This is the strongest single signal that tells Google: "This entity is named אוטולוג."
 *
 * Include this in `app/layout.tsx` so it appears on every page.
 */

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "אוטולוג",
    "alternateName": [
      "AutoLog",
      "Autolog",
      "אוטולוג ישראל",
      "Autolog Israel",
      "אוטולוג רכב",
      "אוטולוג אפליקציה",
      "autolog.click"
    ],
    "url": "https://autolog.click",
    "logo": {
      "@type": "ImageObject",
      "url": "https://autolog.click/logo.png",
      "width": 512,
      "height": 512
    },
    "image": "https://autolog.click/opengraph-image",
    "description":
      "אוטולוג היא הפלטפורמה הישראלית המובילה לניהול רכב חכם — תזכורות טסט וביטוח, מעקב הוצאות, סריקת מסמכים עם AI, היסטוריית טיפולים ושירות חירום. חינם לחלוטין.",
    "inLanguage": "he-IL",
    "areaServed": {
      "@type": "Country",
      "name": "Israel",
      "alternateName": "ישראל"
    },
    "knowsLanguage": ["he", "en"],
    "sameAs": [
      "https://www.facebook.com/autologclick",
      "https://www.instagram.com/autologclick",
      "https://twitter.com/autologclick",
      "https://www.linkedin.com/company/autologclick",
      "https://www.youtube.com/@autologclick",
      "https://www.tiktok.com/@autologclick"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "email": "info@autolog.click",
        "contactType": "customer support",
        "availableLanguage": ["Hebrew", "English"],
        "areaServed": "IL"
      }
    ],
    "founder": {
      "@type": "Person",
      "name": "Eitan"
    },
    "foundingDate": "2026",
    "foundingLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IL"
      }
    },
    "slogan": "כל מה שצריך לרכב שלך במקום אחד"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
