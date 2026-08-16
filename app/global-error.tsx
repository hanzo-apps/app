'use client';

/**
 * The last-resort shell.
 *
 * `global-error` replaces the root layout, so it renders OUTSIDE `Providers` —
 * there is no GuiProvider above it and therefore no gui config. A design-system
 * component here would ask for tokens nobody registered and crash the screen
 * whose only job is to survive a crash. So this one file is plain markup over
 * the app's own CSS variables, and it stays that way.
 *
 * It also carries `dark` itself, for the same reason: the class is written by
 * the root layout this screen replaces, so without it the one screen a person
 * sees when everything else has failed is the only white page on a dark-only
 * app.
 *
 * The card used to make two promises it could not keep. It said the error was
 * "reported to us automatically" while the ingest endpoint refused every key,
 * so no browser error from this app had ever been recorded; and it pointed at
 * "the reference below", which renders only when Next attaches a `digest` —
 * server errors only, never the client throws that reach this screen. A person
 * following both instructions had nothing to send and no way to know it. So the
 * card now claims nothing about delivery and hands over the one thing that is
 * always true and always actionable: the report itself, on this screen, ready
 * to paste.
 */
import { useEffect, useState } from 'react';
import { errorLogger, ErrorSeverity } from '@/lib/error-handling/error-logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // The logger mints the reference, so the string on screen is the string in
    // the stored record — not a second one generated here.
    setReference(
      errorLogger.logError(error, ErrorSeverity.CRITICAL, {
        component: 'GlobalError',
        action: 'UnhandledError',
        metadata: { digest: error.digest, message: error.message, stack: error.stack },
      }),
    );
  }, [error]);

  // `digest` is the server's own reference and joins to its logs, so it wins
  // when there is one. A client throw has none, which is why this screen needs
  // a reference of its own at all.
  const ref = error.digest || reference;

  const report = [
    ref && `Reference: ${ref}`,
    `Message: ${error.message || '(none)'}`,
    typeof window !== 'undefined' && `Page: ${window.location.href}`,
    `When: ${new Date().toISOString()}`,
    error.stack && `\n${error.stack}`,
  ]
    .filter(Boolean)
    .join('\n');

  const copy = () => {
    navigator.clipboard?.writeText(report).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
      () => setCopied(false),
    );
  };

  return (
    <html lang="en" className="dark">
      <body>
        <main className="crash">
          <h1>This page crashed</h1>
          <p>
            Reloading usually works. If it keeps happening, send us the report below —
            it names the failure exactly, and that is what gets it fixed.
          </p>
          {ref && (
            <p className="crash-ref">
              <strong>Reference:</strong> {ref}
            </p>
          )}
          <details>
            <summary>Show the report</summary>
            <pre>{report}</pre>
          </details>
          <div className="crash-actions">
            <button type="button" onClick={reset}>
              Try again
            </button>
            <button type="button" onClick={copy}>
              {copied ? 'Copied' : 'Copy report'}
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
