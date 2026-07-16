import { MetadataRoute } from "next";

/**
 * Dynamic robots.txt for autolog.click — Next.js 14 App Router convention.
 * Drop this in `app/robots.ts` and Next.js automatically serves it at /robots.txt.
 *
 * Allows: all public pages
 * Disallows: auth flows, dashboards, admin, API routes
 * Points crawlers at the sitemap.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/blog",
          "/blog/*",
          "/help",
          "/help/*",
          "/garage-apply",
          "/terms",
          "/privacy",
          "/accessibility",
          "/warranty",
          "/auth/signup",
          "/auth/login"
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/auth/reset",
          "/auth/verify",
          "/_next/",
          "/private/",
          "/*?*"  // discourage crawling of query-string variants
        ]
      },
      // Block AI training crawlers (optional — uncomment if you want to)
      // {
      //   userAgent: "GPTBot",
      //   disallow: "/"
      // },
      // {
      //   userAgent: "CCBot",
      //   disallow: "/"
      // }
    ],
    sitemap: "https://autolog.click/sitemap.xml",
    host: "https://autolog.click"
  };
}
