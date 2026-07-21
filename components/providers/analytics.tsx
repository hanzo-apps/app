'use client';

import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIam } from '@hanzo/iam/react';
import { createAnalytics } from '@hanzo/event';
import { AnalyticsProvider, ErrorBoundary, useAnalytics, usePageview } from '@hanzo/event/react';
import { setErrorReporter, type ErrorContext } from '@/lib/error-handling/error-logger';

/** Cloud analytics ingest — api.hanzo.ai fronts /v1/analytics (+ /v1/tracker). */
const HOST = 'https://api.hanzo.ai';

function Pageview() {
  usePageview(usePathname());
  return null;
}

function Identity() {
  const { user } = useIam();
  const analytics = useAnalytics();
  // Stable OIDC subject, never email/PII.
  useEffect(() => {
    if (user?.sub) analytics.identify(user.sub);
  }, [user?.sub, analytics]);
  return null;
}

/**
 * Telemetry root. Wraps the app in the ONE shared @hanzo/event client bound to
 * the bearer the @hanzo/iam SDK already holds — it emits pageviews, a stable-id
 * identify() once auth resolves, AND captures errors (auto: window.onerror +
 * unhandledrejection; React: the ErrorBoundary below; manual: errorLogger, wired
 * through setErrorReporter). One client, one stream — errors are just events.
 * The token is read through a live ref so a single stable client survives token
 * refresh without re-initializing.
 */
export function AnalyticsRoot({ children }: { children: ReactNode }) {
  const { accessToken } = useIam();
  const tokenRef = useRef<string | null>(accessToken);
  tokenRef.current = accessToken;

  // ONE client instance — shared with the AnalyticsProvider and the module-level
  // errorLogger (so manual reports ride the same authed stream).
  const client = useMemo(
    () =>
      createAnalytics({
        product: 'app',
        host: HOST,
        getToken: () => tokenRef.current ?? undefined,
      }),
    [],
  );

  // Route the module-level errorLogger through the authed client. Its queued
  // errors flush on wire-up (setErrorReporter drains them).
  useEffect(() => {
    setErrorReporter((error, severity, context?: ErrorContext) =>
      client.captureError(error, {
        handled: true,
        properties: { severity, ...context },
      }),
    );
  }, [client]);

  return (
    <AnalyticsProvider client={client}>
      <ErrorBoundary>
        <Pageview />
        <Identity />
        {children}
      </ErrorBoundary>
    </AnalyticsProvider>
  );
}
