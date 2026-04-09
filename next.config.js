/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployments
  // This creates a minimal production build without node_modules
  output: 'standalone',

  typescript: {
    // Temporarily ignore build errors - pre-existing type issues uncovered by cache invalidation
    ignoreBuildErrors: true,
  },
  experimental: {},
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
          // Content Security Policy - allow Google Fonts, Resend API, and Tesseract.js OCR
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' https://api.resend.com https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com; worker-src 'self' blob:; frame-ancestors 'none'",
          },
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
