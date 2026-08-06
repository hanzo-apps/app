import type { Analytics } from '@hanzo/event';

/**
 * Server-side telemetry — the SAME client, the SAME door.
 *
 * `@hanzo/event` is isomorphic by construction: `init()` returns early without a
 * DOM, `anonId()`/`sessionId()` return undefined without storage, and the
 * transport is `fetch`. So the server reports errors by building that client and
 * calling `captureError` — there is no second wire, no second endpoint and no
 * Sentry SDK. `product: 'app'` resolves the hanzo-app DSN from @hanzo/event's own
 * registry, so a server error reaches sentry.hanzo.ai AND lands as a
 * `type:'error'` row on the event stream, exactly like a browser one. The only
 * difference is `source: 'server'`.
 *
 * ONE key, under ONE name. This used to prefer a server-side `HANZO_INGEST_KEY`,
 * falling back to `NEXT_PUBLIC_HANZO_INGEST_KEY`, on the reasoning that a server
 * has no business holding the publishable browser key. Sound in the abstract, and
 * the effect was that server errors went nowhere for as long as it stood: neither
 * name is set by the Dockerfile, by release.yml, or by the pod, and no separate
 * server credential is minted anywhere in the estate. So the plane that catches
 * SSR and route-handler failures — the one worth having in production — reported
 * nothing at all, and said nothing about it.
 *
 * A publishable key is the right credential here regardless: it resolves to the
 * ORG rather than a principal, it is write-only, and it opens the same door this
 * client already posts to. If a distinct server credential is ever wanted, mint it
 * deliberately and change this line; do not reintroduce a name nothing sets.
 */
let client: Analytics | undefined;

async function telemetry(): Promise<Analytics | undefined> {
  if (client) return client;
  try {
    const { createAnalytics } = await import('@hanzo/event');
    client = createAnalytics({
      product: 'app',
      ingestKey: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
      environment: process.env.NODE_ENV,
    });
    return client;
  } catch {
    // Telemetry is never allowed to break the server it is observing.
    return undefined;
  }
}

/** Report and drain immediately. A server process has no page-unload beacon to
 *  fall back on, so a batched error could sit in the queue until the next one
 *  arrives — or be lost when the process goes away. */
async function report(error: unknown, properties: Record<string, unknown>): Promise<void> {
  try {
    const t = await telemetry();
    if (!t) return;
    t.captureError(error, { handled: false, properties: { source: 'server', ...properties } });
    t.flush();
  } catch {
    /* fail-soft, always */
  }
}

/**
 * Next's ONE server error hook: every uncaught error from a route handler, a
 * server component, SSR and middleware arrives here, in every runtime. That is
 * why there is no per-route wrapper — 70 route handlers would be 70 chances to
 * forget one.
 */
export function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; routeType?: string; renderSource?: string },
): void {
  void report(error, {
    path: request?.path,
    method: request?.method,
    routerKind: context?.routerKind,
    routePath: context?.routePath,
    routeType: context?.routeType,
    renderSource: context?.renderSource,
  });
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // A crash that escapes the request lifecycle never reaches onRequestError,
    // so the process-level handlers are the other half of the coverage. Both are
    // ADDED listeners, never a replacement: whatever Node or Next would have
    // done still happens (we do not exit, swallow, or preventDefault).
    process.on('uncaughtException', (err) => {
      void report(err, { kind: 'uncaughtException' });
    });
    process.on('unhandledRejection', (reason) => {
      void report(reason, { kind: 'unhandledRejection' });
    });

    try {
      // Dynamic imports — avoids bundling SQLite into client
      const { listDeploymentIds } = await import('@/lib/vfs/adapters/sqlite-connection');
      listDeploymentIds(); // Verify SQLite is available (throws in browser mode)

      const { Scheduler } = await import('@/lib/scheduler');
      const { createDeploymentSchedulerTask } = await import('@/lib/scheduler/deployment-scheduler');

      const scheduler = new Scheduler({ pollIntervalMs: 30000 });
      scheduler.registerTask(createDeploymentSchedulerTask());
      scheduler.start();
    } catch (err) {
      // Browser mode or SQLite not available — skip
      if (process.env.ADMIN_PASSWORD) {
        // Only log in server mode (ADMIN_PASSWORD indicates server deployment)
        console.warn('[Scheduler] Failed to initialize:', err instanceof Error ? err.message : err);
      }
    }
  }
}
