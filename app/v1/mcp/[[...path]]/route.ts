/**
 * /v1/mcp[/...] — the org-scoped MCP BFF.
 *
 * Surface (proxied verbatim to cloud /v1/mcp):
 *   GET    /v1/mcp                tools from the org's registered MCP servers
 *   GET    /v1/mcp/servers        the org's registered external MCP servers
 *   POST   /v1/mcp/servers        register one (its secret goes to KMS in cloud)
 *   DELETE /v1/mcp/servers/:id    deregister one
 *
 * A server's credential is never held here: cloud stores it under KMS and this
 * route only carries the create request through.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

// /v1/tools/servers is where the server registry lived before it moved to
// /v1/mcp/servers; kept as a fallback so a cloud that has not rolled yet still
// answers instead of blanking the page.
const h = bffRoutes({ prefix: '/v1/mcp', fallbacks: ['/v1/tools'] });
export const GET = h.GET;
export const POST = h.POST;
export const DELETE = h.DELETE;
