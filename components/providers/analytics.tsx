'use client';

import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIam } from '@hanzo/iam/react';
import { useUser } from '@/hooks/useUser';
import { createAnalytics } from '@hanzo/event';
import { AnalyticsProvider, ErrorBoundary, useAnalytics, usePageview } from '@hanzo/event/react';
import { ObserveProvider } from '@hanzo/observe/react';
import { setErrorReporter, type ErrorContext } from '@/lib/error-handling/error-logger';
import { currentOrg } from '@/lib/org-scope';

/** The Hanzo Cloud event-stream door — POST api.hanzo.ai/v1/event. The client
 *  never sends the org; Cloud resolves the tenant server-side from the validated
 *  bearer (or the publishable key).
 *
 *  NOTE: this door does NOT fan out to sentry. An earlier comment here claimed
 *  Cloud fanned the one stream into the error (sentry) lens — it does not, and
 *  that mistaken belief is why this app reported zero errors to sentry.hanzo.ai.
 *  A `type:'error'` event lands in the cloud event warehouse (readable via
 *  GET /v1/errors); reaching sentry requires the DSN below. */
const HOST = 'https://api.hanzo.ai';

/** Hanzo-minted Sentry DSN for the `hanzo-app` project — the ERROR plane.
 *  "https://<version>:<hmac>@<host>/v1/sentry/<projectId>". Publishable and
 *  write-only, so it is safe in the bundle. Unset => the error plane is inert
 *  (fail-safe: analytics keeps working, nothing throws). Set in the build env;
 *  never committed. Mint: POST /v1/sentry/projects */
const EVENT_DSN = process.env.NEXT_PUBLIC_HANZO_EVENT_DSN || undefined;

/** Optional publishable ingest key (pk_…) that lets LOGGED-OUT marketing/public
 *  views emit accepted telemetry (pageviews + errors + unload beacons) — the key
 *  HMAC-verifies to the org server-side, so anonymous events light up all three
 *  lenses. Provision one per org via POST /v1/ingest/keys and set the env var.
 *  When unset the authed-bearer path is used and anonymous events are best-effort. */
const INGEST_KEY = process.env.NEXT_PUBLIC_EVENT_INGEST_KEY || undefined;

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
  // The org. Cloud already resolves the tenant server-side for billing; group()
  // is what makes ORG-level funnels queryable ("which orgs stalled before their
  // first deploy?"). Read after auth resolves so the scope is the real one.
  useEffect(() => {
    if (!user?.id) return;
    const org = currentOrg();
    if (org) analytics.group(org);
  }, [user?.id, analytics]);
  return null;
}

/**
 * Telemetry root. Wraps the app in the ONE shared @hanzo/event client bound to
 * the bearer the @hanzo/iam SDK already holds — it emits pageviews, a stable-id
 * identify() once auth resolves, AND captures errors (auto: window.onerror +
 * unhandledrejection; React: the ErrorBoundary below; manual: errorLogger, wired
 * through setErrorReporter). One client, two planes: every captured error goes to
 * sentry.hanzo.ai as a Sentry envelope AND stays correlated on the event stream.
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
        // Error plane -> sentry.hanzo.ai. Inert (fail-safe) when the DSN is unset.
        dsn: EVENT_DSN,
        environment: process.env.NODE_ENV,
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
      {/* Autocapture rides the SAME client: default-on $click/$input/$change/$submit
          with a semantic DOM hierarchy. nav={false} keeps the event layer the single
          pageview counter (no double-count); enabled mirrors the DNT consent gate;
          input values are redacted by default (PII-free). */}
      <ObserveProvider client={client} nav={false} enabled={!doNotTrack()}>
        <ErrorBoundary>
          <Pageview />
          <Identity />
          {children}
        </ErrorBoundary>
      </ObserveProvider>
    </AnalyticsProvider>
  );
}
