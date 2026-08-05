'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIam } from '@hanzo/iam/react';
import { TelemetryProvider, useTelemetry } from '@hanzogui/telemetry';
import { useUser } from '@/hooks/useUser';
import { identityTraits } from '@/lib/analytics-identity';
import { setErrorReporter, type ErrorContext } from '@/lib/error-handling/error-logger';
import { currentOrg } from '@/lib/org-scope';

/** Publishable ingest key (pk_…) that lets LOGGED-OUT marketing/public views emit
 *  accepted telemetry (pageviews + errors + unload beacons) — the key HMAC-verifies
 *  to the org server-side, so anonymous events light up all three lenses. Write-only,
 *  so it is safe in the bundle. Provisioned per org (POST /v1/ingest/keys), read from
 *  KMS by the release workflow and baked in as this env var by Dockerfile.production.
 *  Passed explicitly because THIS is the name the build sets; when it is unset the
 *  package still resolves its own NEXT_PUBLIC_HANZO_INGEST_KEY, and with neither the
 *  authed-bearer path is used and anonymous events are best-effort. */
const INGEST_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || undefined;

/**
 * The ONE place this app binds telemetry identity. It is the only part of the
 * telemetry story an app still owns, because only the app knows who is signed in.
 *
 *  - identify(user.id, traits) — the stable OIDC subject, plus the attributes that
 *                        make that subject legible.
 *  - group(org)        — Cloud already resolves the tenant server-side for billing;
 *                        group() is what makes ORG-level funnels queryable
 *                        ("which orgs stalled before their first deploy?").
 */

function Identity() {
  // Through the ONE user facade (useUser) — its `id` IS the OIDC subject.
  const { user } = useUser();
  const telemetry = useTelemetry();

  // The stable OIDC subject, plus the attributes that make it legible. A bare
  // identify(id) wrote an opaque subject: the warehouse could count users and
  // never say which one. Email and name are first-party facts about our own
  // users that useUser already decoded off the same claims as the id — they
  // were dropped on the floor rather than withheld for any reason.
  useEffect(() => {
    if (user?.id) telemetry.identify(user.id, identityTraits(user));
    // The traits ride the id: re-running on every `user` identity would re-send
    // on each render that reshapes it, and the id is what changes when the
    // person does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
 *  - The door. POST https://api.hanzo.ai/v1/event. It carries pageviews, product
 *    events and a `type:'error'` record into the cloud event warehouse, which
 *    analytics.hanzo.ai and insights.hanzo.ai read (errors included, via
 *    GET /v1/errors). That door does NOT fan out to sentry — believing it did is
 *    exactly why this app once reported zero errors to sentry.hanzo.ai.
 *  - The error plane, which is the SEPARATE, DSN-authenticated half: reaching
 *    sentry.hanzo.ai means POSTing a Sentry envelope to a DSN. `product="app"` IS
 *    that configuration — @hanzo/event maps it to the hanzo-app project's
 *    publishable DSN through its own `dsnForProduct` registry, so there is no DSN
 *    prop and no DSN env var to forget. Forgetting one is what broke it before:
 *    `NEXT_PUBLIC_HANZO_EVENT_DSN` was read in this file and set nowhere. The
 *    package still honors that variable as an override; nothing here needs to.
 *  - Consent. Do-Not-Track and Global Privacy Control are honored with no app
 *    code, and an explicit stored choice outranks the browser in both directions.
 *  - Pageviews, off the `path` below — one counter, no double-count (the provider
 *    mounts @hanzo/event's own AnalyticsProvider with autoPageview disabled).
 *
 * We pass only what the package cannot know: the route (Next's router is the
 * clock for pageviews), the bearer, and the ingest key under the name THIS build
 * sets. The token is read through a live ref, so one stable client survives a
 * token refresh without being rebuilt.
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
      ingestKey={INGEST_KEY}
      getToken={() => tokenRef.current ?? undefined}
    >
      <Identity />
      <ManualErrors />
      {children}
    </TelemetryProvider>
  );
}
