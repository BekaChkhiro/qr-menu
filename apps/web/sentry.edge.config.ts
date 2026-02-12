import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring - lower sample rate for edge
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Only enable when DSN is set
  enabled: !!process.env.SENTRY_DSN,

  // Additional context
  initialScope: {
    tags: {
      app: 'digital-menu',
      runtime: 'edge',
    },
  },
});
