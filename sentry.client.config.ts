import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.01, // 1% of sessions
    replaysOnErrorSampleRate: 0.1, // 10% of sessions with errors

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'production',

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
        maskAllInputs: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',

      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      'The request is not allowed by the user agent',

      // User-caused
      'AbortError',
      'Request aborted',
      'User cancelled',

      // Third-party
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],

    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        // Remove cookies
        if (event.request.cookies) {
          delete event.request.cookies;
        }

        // Remove auth headers
        if (event.request.headers) {
          const headers = event.request.headers;
          delete headers['authorization'];
          delete headers['x-api-key'];
        }
      }

      // Remove sensitive user data
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }

      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
        return null;
      }

      return event;
    },
  });
}