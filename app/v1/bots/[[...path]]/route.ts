/**
 * /v1/bots[/...] — the org-scoped bot BFF.
 *
 * Surface (proxied verbatim to cloud /v1/bots):
 *   GET /v1/bots    the org's bots
 *
 * READ ONLY. Creating and configuring a bot belong to the surface that owns
 * them; this one answers "which bots does this workspace have".
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

export const GET = bffRoutes({ prefix: '/v1/bots' }).GET;
