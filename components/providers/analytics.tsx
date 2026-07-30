'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIam } from '@hanzo/iam/react';
import { TelemetryProvider, useTelemetry } from '@hanzogui/telemetry';
import { useUser } from '@/hooks/useUser';
import { setErrorReporter, type ErrorContext } from '@/lib/error-handling/error-logger';
import { currentOrg } from '@/lib/org-scope';

/**
 * The ONE place this app binds telemetry identity. It is the only part of the
 * telemetry story an app still owns, because only the app knows who is signed in.
 *
 *  - identify(user.id) — the stable OIDC subject, never email/PII.
 *  - group(org)        — Cloud already resolves the tenant server-side for billing;
 *                        group() is what makes ORG-level funnels queryable
 *                        ("which orgs stalled before their first deploy?").
 */
function Identity() {
  // Through the ONE user facade (useUser) — its `id` IS the OIDC subject.
  const { user } = useUser();
  const telemetry = useTelemetry();

  useEffect(() => {
    if (user?.id) telemetry.identify(user.id);
  }, [user?.id, telemetry]);

  // Read the org after auth resolves, so the scope is the real one.
  useEffect(() => {
    if (!user?.id) return;
    const org = currentOrg();
    if (org) telemetry.group(org);
  }, [user?.id, telemetry]);

  return null;
}

/**
 * Routes the module-level errorLogger onto the telemetry client, so a manual
 * `errorLogger.log(...)` from anywhere in the app rides the SAME stream as an
 * unhandled one. `setErrorReporter` drains whatever queued before this mounted.
 */
function ManualErrors() {
  const telemetry = useTelemetry();
  useEffect(() => {
    setErrorReporter((error, severity, context?: ErrorContext) =>
      telemetry.captureError(error, { handled: true, properties: { severity, ...context } }),
    );
  }, [telemetry]);
  return null;
}

/**
 * Telemetry root — the ONE surface, `@hanzogui/telemetry`, which every Hanzo app
 * mounts rather than keeping a private copy. It composes the mechanism packages
 * (`@hanzo/event` = the client and the wire, `@hanzo/observe` = the capture
 * engine, dynamically imported in an idle callback so it cannot cost LCP) and is
 * the only thing this app configures.
 *
 * Everything below is RESOLVED, not passed:
 *
 *  - The door. POST https://api.hanzo.ai/v1/event. Cloud lenses the one stream
 *    into sentry.hanzo.ai (errors + session capture), analytics.hanzo.ai
 *    (pageviews) and insights.hanzo.ai (product events). Three dashboards, one
 *    stream — those hosts are never ingest endpoints.
 *  - The error plane. `product="app"` IS the configuration: @hanzo/event maps it
 *    to the hanzo-app Sentry project's publishable DSN (its `dsnForProduct`
 *    registry). There is no DSN prop and no DSN env var to forget — and forgetting
 *    one is exactly why this app reported nothing: `NEXT_PUBLIC_HANZO_EVENT_DSN`
 *    was read here and set nowhere.
 *  - The ingest key, from NEXT_PUBLIC_HANZO_INGEST_KEY — the name the shared
 *    package resolves, which is why the app-local spelling is gone (the release
 *    workflow now passes that name).
 *  - Consent. Do-Not-Track and Global Privacy Control are honored with no app
 *    code, and an explicit stored choice outranks the browser in both directions.
 *
 * We pass only what the package cannot know: the route (Next's router is the
 * clock for pageviews) and the bearer. The token is read through a live ref, so
 * one stable client survives a token refresh without being rebuilt.
 *
 * NOTE on render errors: the provider's own boundary reports and RE-THROWS, but
 * it sits ABOVE the app's `<ErrorBoundary>` (see app/providers.tsx), which stops
 * a render error before it ever gets here. That boundary therefore reports the
 * error itself, through the ambient `captureError` — same client, same stream.
 */
export function AnalyticsRoot({ children }: { children: ReactNode }) {
  const { accessToken } = useIam();
  const tokenRef = useRef<string | null>(accessToken);
  tokenRef.current = accessToken;

  return (
    <TelemetryProvider
      product="app"
      path={usePathname()}
      getToken={() => tokenRef.current ?? undefined}
    >
      <Identity />
      <ManualErrors />
      {children}
    </TelemetryProvider>
  );
}
