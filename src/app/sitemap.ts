import { MetadataRoute } from "next";

/**
 * Dynamic sitemap.xml for autolog.click — Next.js 14 App Router convention.
 * Drop this in `app/sitemap.ts` and Next.js automatically serves it at /sitemap.xml.
 *
 * IMPORTANT: Update the BLOG_SLUGS list whenever a new article is published.
 * If your blog is database-driven, replace the static array with a Prisma fetch.
 * See the commented "Dynamic version" block at the bottom of this file.
 */

const BASE_URL = "https://autolog.click";

// Currently-published blog articles (as of 2026-06-07).
// Update this list when you publish new articles, OR switch to the dynamic
// Prisma version at the bottom of this file.
const BLOG_SLUGS: { slug: string; lastModified: string; priority?: number }[] = [
  { slug: "madrich-male-baal-rechev-chadash-2026", lastModified: "2026-05-16", priority: 0.95 },
  { slug: "bdika-lifnei-kniyat-rechev-haifa", lastModified: "2026-05-16" },
  { slug: "bdika-lifnei-kniyat-rechev-petach-tikva", lastModified: "2026-05-16" },
  { slug: "bdika-lifnei-kniyat-rechev-netanya", lastModified: "2026-05-16" },
  { slug: "bdika-lifnei-kniyat-rechev-beer-sheva", lastModified: "2026-05-16" },
  { slug: "mechoney-bdika-cholon", lastModified: "2026-05-16" },
  { slug: "bituach-rechev-chova-madrich-male-2026", lastModified: "2026-05-16" },
  { slug: "bituach-rechev-makif-eich-bocharim", lastModified: "2026-05-16" },
  { slug: "rechev-chashmali-o-hibridi-2026", lastModified: "2026-05-16" },
  { slug: "hachlafat-shemen-rechev-mechir-2026", lastModified: "2026-05-16" },
  { slug: "pgia-be-rechev-chone-ma-laasot", lastModified: "2026-05-16" },
  { slug: "kama-ole-test-shnati-2026", lastModified: "2026-05-12" },
  { slug: "ma-ze-ovd2", lastModified: "2026-05-12" },
  { slug: "tizkoret-bituach-rechev", lastModified: "2026-05-12" },
  { slug: "bdika-lifnei-kniyat-rechev-tel-aviv", lastModified: "2026-05-12" },
  { slug: "bdika-lifnei-kniyat-rechev-jerusalem", lastModified: "2026-05-12" },
  { slug: "mechoney-bdika-rishon-letzion", lastModified: "2026-05-12" },
  { slug: "ma-livdok-lifnei-kniyat-rechev-yad-shniya", lastModified: "2026-05-12" },
  { slug: "7-applikatziot-lenihul-rechev-2026", lastModified: "2026-05-12" },
  { slug: "12-tipim-lechisachon-bedelek", lastModified: "2026-05-12" },
  { slug: "haavarat-baalut-al-rechev-2026", lastModified: "2026-05-12" },
  { slug: "matai-hatest-shel-harechev-sheli", lastModified: "2026-04-29" },
  { slug: "kama-ole-rechev-bachodesh", lastModified: "2026-04-29" },
  { slug: "checklist-lifnei-test", lastModified: "2026-04-29" },
  // NEW ARTICLES (added 2026-06-07) — these slugs match the articles in /content/blog/
  { slug: "ma-ze-autolog", lastModified: "2026-06-07", priority: 0.9 },
  { slug: "autolog-vs-drivvo", lastModified: "2026-06-07", priority: 0.85 },
  { slug: "autolog-vs-fuelio", lastModified: "2026-06-07", priority: 0.85 },
  { slug: "autolog-rechev-app-chinam", lastModified: "2026-06-07", priority: 0.85 },
  { slug: "eich-lehirashem-le-autolog", lastModified: "2026-06-07", priority: 0.85 },
  { slug: "autolog-bitachon-praiut", lastModified: "2026-06-07", priority: 0.85 },
  { slug: "tachzukat-toyota-corolla-aluyot-tipulim", lastModified: "2026-06-07" },
  { slug: "bdika-lifnei-kniyat-rechev-ashdod", lastModified: "2026-06-07" },
  { slug: "herchev-le-kayitz", lastModified: "2026-06-07" }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString().split("T")[0];

  // Static high-priority pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${BASE_URL}/accessibility`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${BASE_URL}/warranty`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${BASE_URL}/garage-apply`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];

  // Blog articles
  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: article.lastModified,
    changeFrequency: "monthly" as const,
    priority: article.priority ?? 0.7
  }));

  return [...staticPages, ...blogPages];
}

/* ============================================================================
   ALTERNATIVE — Dynamic Prisma-backed version (recommended once you have time)
   ============================================================================

   Replace the entire BLOG_SLUGS array and the static .map() above with this:

   import { prisma } from "@/lib/prisma";

   export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
     const articles = await prisma.blogPost.findMany({
       where: { published: true },
       select: { slug: true, updatedAt: true },
       orderBy: { updatedAt: "desc" }
     });

     const blogPages: MetadataRoute.Sitemap = articles.map((a) => ({
       url: `${BASE_URL}/blog/${a.slug}`,
       lastModified: a.updatedAt.toISOString().split("T")[0],
       changeFrequency: "monthly",
       priority: 0.7
     }));

     return [...staticPages, ...blogPages];
   }

   This way you never have to update sitemap.ts manually again.
   ============================================================================ */
