// Client-side Sentry init. Runs on every page load in the user's browser.
// Captures unhandled errors, promise rejections, and navigation traces.
import * as Sentry from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: 'https://431e272835582a145b757b985322a6d5@o4511223398596608.ingest.de.sentry.io/4511223404822608',

  // 10% sampling in production keeps us under the free 10K transactions/month
  // quota. Bumped to 100% in development so we can see everything locally.
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Don't pollute Sentry with dev-only noise (HMR errors, fast refresh warnings).
  enabled: isProduction || process.env.NEXT_PUBLIC_SENTRY_DEV === 'true',

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Send PII (user IDs, emails) so bug reports can be tied to specific users.
  sendDefaultPii: true,

  // Drop common non-actionable browser errors before they hit Sentry quota.
  ignoreErrors: [
    // Network errors when user has flaky connection — we can't fix these
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // User navigated away mid-request
    'AbortError',
    // Browser extensions that inject themselves into the page
    'extension://',
    'top.GLOBALS',
    // Known iOS Safari quirk that's harmless
    'ResizeObserver loop',
    // Next.js redirect throw — by design, not a real error
    'NEXT_REDIRECT',
  ],

  // Block common URLs that aren't ours (e.g. injected scripts from extensions).
  denyUrls: [
    /chrome-extension:\/\//,
    /moz-extension:\/\//,
    /safari-extension:\/\//,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
