/**
 * BlogPostingSchema — JSON-LD for individual blog articles.
 *
 * Adds rich result eligibility (article markup with author, date, image).
 * Pair with BreadcrumbList for breadcrumb display in search results.
 *
 * Use in `app/blog/[slug]/page.tsx` (or wherever individual articles render).
 */

interface BlogPostingSchemaProps {
  title: string;
  description: string;
  slug: string;
  publishedAt: string; // ISO 8601 — e.g., "2026-06-07"
  updatedAt?: string;
  image: string; // absolute URL
  author?: string;
  category?: string;
  wordCount?: number;
  readingTimeMinutes?: number;
}

export default function BlogPostingSchema({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  image,
  author = "צוות אוטולוג",
  category,
  wordCount,
  readingTimeMinutes
}: BlogPostingSchemaProps) {
  const url = `https://autolog.click/blog/${slug}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": [image],
    "datePublished": publishedAt,
    "dateModified": updatedAt || publishedAt,
    "author": {
      "@type": "Organization",
      "name": author,
      "url": "https://autolog.click"
    },
    "publisher": {
      "@type": "Organization",
      "name": "אוטולוג",
      "logo": {
        "@type": "ImageObject",
        "url": "https://autolog.click/logo.png",
        "width": 512,
        "height": 512
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "url": url,
    "inLanguage": "he-IL",
    "isPartOf": {
      "@type": "Blog",
      "name": "בלוג אוטולוג",
      "url": "https://autolog.click/blog"
    }
  };

  if (category) {
    schema.articleSection = category;
  }
  if (wordCount) {
    schema.wordCount = wordCount;
  }
  if (readingTimeMinutes) {
    schema.timeRequired = `PT${readingTimeMinutes}M`;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbSchema — render alongside BlogPostingSchema.
 * Shows breadcrumb trail in search results: אוטולוג > בלוג > מאמר.
 */
interface BreadcrumbSchemaProps {
  articleTitle: string;
  slug: string;
}

export function BlogBreadcrumbSchema({ articleTitle, slug }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "אוטולוג",
        "item": "https://autolog.click"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "בלוג",
        "item": "https://autolog.click/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": articleTitle,
        "item": `https://autolog.click/blog/${slug}`
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
