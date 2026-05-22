// Server-side Sentry init. Loaded by src/instrumentation.ts when the
// Node.js runtime starts. Captures unhandled API route errors, route
// handler exceptions, and anything wrapped in Sentry.captureException.
import * as Sentry from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: 'https://431e272835582a145b757b985322a6d5@o4511223398596608.ingest.de.sentry.io/4511223404822608',

  // 10% sampling in production keeps us under Sentry's free 10K transactions/month
  // quota even at meaningful traffic. 100% in dev so we can see everything locally.
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Don't pollute Sentry with dev-only noise (HMR errors, fast refresh warnings).
  enabled: isProduction || process.env.NEXT_PUBLIC_SENTRY_DEV === 'true',

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Send PII (user IDs, IPs) — needed to correlate bug reports with users.
  // Review for GDPR compliance if expanding to EU customers.
  sendDefaultPii: true,

  // Drop common non-actionable errors before they hit Sentry quota.
  ignoreErrors: [
    'AbortError', // Request was aborted (user navigated away)
    'NEXT_REDIRECT', // Next.js redirect throw — by design, not an error
    'NEXT_NOT_FOUND', // Next.js notFound() — by design
  ],
});
