/**
 * /v1/plugins[/...] — the org-scoped plugins BFF.
 *
 * Surface (proxied verbatim to cloud /v1/plugins):
 *   GET    /v1/plugins                  what this deployment mounted (?all=true incl. off)
 *   POST   /v1/plugins/build            build a connector plugin from TypeScript or an API spec
 *   GET    /v1/plugins/authored         the org's own built plugins
 *   DELETE /v1/plugins/authored/:id     remove one
 *
 * A build request carries source or documentation, never a credential: cloud
 * refuses source that looks like it holds a key, because a plugin reads its
 * credential from the connectors plane at run time.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

const h = bffRoutes({ prefix: '/v1/plugins' });
export const GET = h.GET;
export const POST = h.POST;
export const DELETE = h.DELETE;
