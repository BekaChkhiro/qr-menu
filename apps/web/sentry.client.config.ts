import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay - only in production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Only enable in production or when DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore ResizeObserver errors (common browser quirk)
    if (error instanceof Error && error.message.includes('ResizeObserver')) {
      return null;
    }

    // Ignore network errors from extensions
    if (error instanceof Error && error.message.includes('chrome-extension')) {
      return null;
    }

    return event;
  },

  // Additional context
  initialScope: {
    tags: {
      app: 'digital-menu',
    },
  },
});
