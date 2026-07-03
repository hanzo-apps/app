import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'production',

    // Server-specific settings
    // Note: autoSessionTracking is only available for browser

    // Integrations
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],

    // Filtering
    ignoreErrors: [
      // Common server errors to ignore
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'EPIPE',
      'EHOSTUNREACH',
      'EAI_AGAIN',
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
          delete headers['cookie'];
        }

        // Remove query params that might contain sensitive data
        if (event.request?.query_string && typeof event.request.query_string === 'string') {
          const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
          const queryString = event.request.query_string;
          sensitiveParams.forEach((param) => {
            const regex = new RegExp(`${param}=[^&]+`, 'gi');
            event.request!.query_string = queryString.replace(regex, `${param}=[REDACTED]`);
          });
        }
      }

      // Remove sensitive context
      if (event.contexts) {
        if (event.contexts.os) {
          delete event.contexts.os.kernel_version;
        }
      }

      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
        return null;
      }

      return event;
    },

    // Profiling (optional, requires additional setup)
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  });
}