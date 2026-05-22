// Edge runtime Sentry init. Loaded by src/instrumentation.ts when middleware
// or edge route handlers boot. Edge has a smaller surface than Node, so
// captures middleware exceptions and edge route errors.
import * as Sentry from '@sentry/nextjs';

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: 'https://431e272835582a145b757b985322a6d5@o4511223398596608.ingest.de.sentry.io/4511223404822608',

  // 10% sampling in production, 100% in dev — matches server/client configs.
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  enabled: isProduction || process.env.NEXT_PUBLIC_SENTRY_DEV === 'true',

  enableLogs: true,

  sendDefaultPii: true,

  ignoreErrors: [
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],
});
