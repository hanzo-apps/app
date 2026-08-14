/**
 * /v1/sandboxes[/...] — the org-scoped sandbox BFF.
 *
 * Surface (proxied verbatim to cloud /v1/sandboxes):
 *   GET /v1/sandboxes    the org's sandboxes, with class, project and status
 *
 * READ ONLY, and deliberately beside `sandboxes/stop` rather than over it: that
 * route is a static segment and Next matches it first, so stopping a sandbox
 * keeps its own single-purpose caller and this one cannot answer for it.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

export const GET = bffRoutes({ prefix: '/v1/sandboxes' }).GET;
