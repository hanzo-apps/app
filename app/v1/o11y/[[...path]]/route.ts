/**
 * /v1/o11y[/...] — the org-scoped observability BFF.
 *
 * Surface (proxied verbatim to cloud /v1/o11y — spec openapi/o11y/openapi.yaml):
 *   GET  /v1/o11y/health                       o11y liveness
 *   GET  /v1/o11y/status?product=              live product service health
 *   GET  /v1/o11y/metrics?product=             org-pinned RED series + usage rollup
 *   GET  /v1/o11y/logs?product=                org request-log stream (nextCursor tail)
 *   GET  /v1/o11y/services|dashboards|rules    runtime reads
 *   POST /v1/o11y/query, /v1/o11y/query_range  composite builder query
 *
 * The org is pinned server-side from the bearer owner claim — a non-admin sees
 * only its own org's attribution, and the client never supplies a raw query.
 * A 403 from this surface is permission (SuperAdmin gates), never an outage.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

const h = bffRoutes({ prefix: '/v1/o11y' });
export const GET = h.GET;
export const POST = h.POST;
