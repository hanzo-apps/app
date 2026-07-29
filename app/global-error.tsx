'use client';

/**
 * The last-resort shell.
 *
 * `global-error` replaces the root layout, so it renders OUTSIDE `Providers` —
 * there is no GuiProvider above it and therefore no gui config. A design-system
 * component here would ask for tokens nobody registered and crash the screen
 * whose only job is to survive a crash. So this one file is plain markup over
 * the app's own CSS variables, and it stays that way.
 */
import { useEffect } from 'react';
import { errorLogger, ErrorSeverity } from '@/lib/error-handling/error-logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errorLogger.logError(error, ErrorSeverity.CRITICAL, {
      component: 'GlobalError',
      action: 'UnhandledError',
      metadata: { digest: error.digest, message: error.message, stack: error.stack },
    });
  }, [error]);

  return (
    <html>
      <body>
        <main className="crash">
          <h1>Critical Error</h1>
          <p>
            The application encountered an unexpected error and needs to restart. Our
            team has been notified.
          </p>
          {error.digest && (
            <p className="crash-ref">
              <strong>Error reference:</strong> {error.digest}
            </p>
          )}
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error details (development only)</summary>
              <pre>{error.message}</pre>
              {error.stack && <pre>{error.stack}</pre>}
            </details>
          )}
          <div className="crash-actions">
            <button type="button" onClick={reset}>
              Try again
            </button>
            <button type="button" onClick={() => (window.location.href = '/')}>
              Go home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
