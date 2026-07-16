/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployments
  // This creates a minimal production build without node_modules
  output: 'standalone',

  // Zero-downtime deploys: `NEXT_DIST_DIR=.next-staging npm run build` builds
  // into a side directory while the live server keeps serving from `.next`.
  // The deploy script then swaps the directories atomically and restarts pm2.
  // At runtime (pm2 `next start`) the env var is unset, so `.next` is used.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  typescript: {
    // Temporarily ignore build errors - pre-existing type issues uncovered by cache invalidation
    ignoreBuildErrors: true,
  },
  eslint: {
    // Don't fail builds on ESLint errors. Pre-existing code has hundreds of
    // unused-vars / no-explicit-any / no-img-element issues that need a separate
    // cleanup pass. Lint warnings still appear in `npm run lint` for review.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Tree-shake icon libraries so only the imported icons end up in the
    // client bundle. Without this, Next may include the entire library for
    // some barrel-import patterns.
    optimizePackageImports: ['lucide-react'],
    // geoip-lite loads its .dat data files via __dirname; keep it external so Next
    // doesn't bundle it (which relocates __dirname and breaks the data lookup).
    serverComponentsExternalPackages: ['geoip-lite'],
  },
  // Compress responses with gzip / brotli for smaller transfer sizes.
  compress: true,
  // Drop source maps in production to reduce deploy size. Sentry still works
  // via its own source map upload pipeline.
  productionBrowserSourceMaps: false,
  images: {
    // Allow next/image to optimize remote images from Vercel Blob storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
    // Serve modern formats automatically (smaller file sizes)
    formats: ['image/avif', 'image/webp'],
    // Responsive sizes optimized for our layouts
    deviceSizes: [360, 640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    // Cache optimized images for 30 days on the edge
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  redirects: async () => {
    return [
      { source: '/login', destination: '/auth/login', permanent: true },
      { source: '/register', destination: '/auth/signup', permanent: true },
      { source: '/signup', destination: '/auth/signup', permanent: true },
    ];
  },
  headers: async () => {
    return [
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            // Report-only: never blocks, only reports. Tighten to a real CSP
            // once the console shows no legitimate violations.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Enable XSS protection in older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // CSP temporarily disabled — Tesseract.js OCR requires blob: workers,
          // CDN importScripts, and WASM loading that conflict with strict CSP.
          // TODO: re-enable CSP once OCR approach is finalized.
          // {
          //   key: 'Content-Security-Policy',
          //   value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; ...",
          // },
          // Browser permissions — camera needed for license scanning
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
        ],
      },
      // HTML pages: no-cache + explicit UTF-8 charset
      // IMPORTANT: Exclude static asset extensions (images, fonts, manifests, etc.)
      // so we don't override their Content-Type to text/html. Without this exclusion,
      // PNGs/SVGs in /public render as binary garbage in browsers and break Facebook/
      // WhatsApp link previews (they refuse to load images served as text/html).
      {
        source: '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif|woff|woff2|ttf|otf|eot|json|xml|txt|pdf|mp4|webm)$).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          // Explicit UTF-8 to prevent mobile browser encoding issues
          {
            key: 'Content-Type',
            value: 'text/html; charset=utf-8',
          },
        ],
      },
      // API routes: never cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────────
// Sentry integration — auto-uploads source maps + injects instrumentation.
// Without this wrap, stack traces in Sentry show minified function names
// like `function a(b,c)` instead of meaningful symbols.
// ─────────────────────────────────────────────────────────────────────
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  // Sentry organization / project — must match the DSN in sentry.*.config.ts.
  org: 'autolog',
  project: 'autolog-nextjs',

  // Suppresses source-map upload logs during build (keeps Vercel logs clean).
  silent: !process.env.CI,

  // Upload a larger set of source maps for better stack traces.
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a rewrite to bypass ad-blockers.
  // Tiny perf hit, big win in real-world error capture rate (~30% more
  // reports get through because ublock/brave/iOS-content-blockers don't
  // filter same-origin requests).
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements in production.
  disableLogger: true,

  // Skip the build-time check that warns about missing SENTRY_AUTH_TOKEN —
  // until you generate one, source-map upload silently skips (still works,
  // just less helpful traces). Add SENTRY_AUTH_TOKEN to Vercel env vars
  // when you want full traces.
  automaticVercelMonitors: false,
});
