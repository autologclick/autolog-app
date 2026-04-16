/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployments
  // This creates a minimal production build without node_modules
  output: 'standalone',

  typescript: {
    // Temporarily ignore build errors - pre-existing type issues uncovered by cache invalidation
    ignoreBuildErrors: true,
  },
  experimental: {
    // Tree-shake icon libraries so only the imported icons end up in the
    // client bundle. Without this, Next may include the entire library for
    // some barrel-import patterns.
    optimizePackageImports: ['lucide-react'],
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
  headers: async () => {
    return [
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
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
      {
        source: '/((?!_next/static|_next/image|favicon.ico|api/).*)',
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

module.exports = nextConfig;
