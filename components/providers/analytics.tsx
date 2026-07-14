'use client';

import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIam } from '@hanzo/iam/react';
import { AnalyticsProvider, useAnalytics, usePageview } from '@hanzo/capture/react';

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
 * Product-analytics root. Wraps the app in the shared @hanzo/capture client
 * bound to the bearer the @hanzo/iam SDK already holds, and emits pageviews plus
 * a stable-id identify() once auth resolves. The token is read through a live ref
 * so a single stable config survives token refresh without re-initializing.
 */
export function AnalyticsRoot({ children }: { children: ReactNode }) {
  const { accessToken } = useIam();
  const tokenRef = useRef<string | null>(accessToken);
  tokenRef.current = accessToken;

  const config = useMemo(
    () => ({
      product: 'app' as const,
      host: HOST,
      getToken: () => tokenRef.current ?? undefined,
    }),
    [],
  );

  return (
    <AnalyticsProvider config={config}>
      <Pageview />
      <Identity />
      {children}
    </AnalyticsProvider>
  );
}
