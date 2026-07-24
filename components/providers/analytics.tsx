'use client';

import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIam } from '@hanzo/iam/react';
import { useUser } from '@/hooks/useUser';
import { createAnalytics } from '@hanzo/event';
import { AnalyticsProvider, ErrorBoundary, useAnalytics, usePageview } from '@hanzo/event/react';
import { setErrorReporter, type ErrorContext } from '@/lib/error-handling/error-logger';

/** The ONE Hanzo Cloud telemetry front door — POST api.hanzo.ai/v1/event. Cloud
 *  fans the one batched stream out to the web (analytics), product (insights), and
 *  error (sentry) lenses; the client never sends the org — Cloud resolves the
 *  tenant server-side from the validated bearer (or the publishable key). */
const HOST = 'https://api.hanzo.ai';

/** Optional publishable ingest key (pk_…) that lets LOGGED-OUT marketing/public
 *  views emit accepted telemetry (pageviews + errors + unload beacons) — the key
 *  HMAC-verifies to the org server-side, so anonymous events light up all three
 *  lenses. Provision one per org via POST /v1/ingest/keys and set the env var.
 *  When unset the authed-bearer path is used and anonymous events are best-effort. */
const INGEST_KEY = process.env.NEXT_PUBLIC_HANZO_INGEST_KEY || undefined;

/** doNotTrack reads the browser Do-Not-Track consent signal (SSR-safe). A visitor
 *  who opts out gets no telemetry at all — pageviews, events, and errors are all
 *  suppressed by the client's `enabled` gate. */
function doNotTrack(): boolean {
  if (typeof navigator === 'undefined') return false;
  const n = navigator as Navigator & { msDoNotTrack?: string | null };
  const w = typeof window !== 'undefined' ? (window as Window & { doNotTrack?: string | null }) : undefined;
  const dnt = n.doNotTrack ?? n.msDoNotTrack ?? w?.doNotTrack;
  return dnt === '1' || dnt === 'yes';
}

function Pageview() {
  usePageview(usePathname());
  return null;
}

function Identity() {
  // Through the ONE user facade (useUser) — its `id` IS the OIDC subject.
  const { user } = useUser();
  const analytics = useAnalytics();
  // Stable OIDC subject, never email/PII.
  useEffect(() => {
    if (user?.id) analytics.identify(user.id);
  }, [user?.id, analytics]);
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
        ingestKey: INGEST_KEY,
        // Consent gate: honor the browser Do-Not-Track signal.
        enabled: !doNotTrack(),
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
