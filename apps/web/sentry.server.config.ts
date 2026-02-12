import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Only enable in production or when DSN is set
  enabled: !!process.env.SENTRY_DSN,

  // Filter out non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore expected errors
    if (error instanceof Error) {
      // Skip 404 and similar expected errors
      if (error.message.includes('not found') || error.message.includes('Not found')) {
        return null;
      }

      // Skip authentication errors (expected flow)
      if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
        return null;
      }
    }

    return event;
  },

  // Additional context
  initialScope: {
    tags: {
      app: 'digital-menu',
      runtime: 'server',
    },
  },
});
