/**
 * /v1/functions[/...] — the org-scoped serverless-function BFF.
 *
 * Surface (proxied verbatim to cloud /v1/functions):
 *   GET /v1/functions    the org's deployed functions, with their runtime,
 *                        status and recent invocation counts
 *
 * READ ONLY. Deploying, invoking and deleting a function each have their own
 * caller; a verb this route does not export is a verb this surface does not
 * offer. The org is pinned server-side from the bearer, so a caller sees its own
 * tenant's functions and can neither name nor widen the scope.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

export const GET = bffRoutes({ prefix: '/v1/functions' }).GET;
