/**
 * /v1/todo[/...] — the org-scoped work-item BFF.
 *
 * A work item is a unit of engineering work someone — human OR agent — moves
 * across a board. Hanzo has exactly ONE such primitive, the todo board's Issue
 * (cloud `apps/todo/contract.go` is law), and this route is a passthrough to
 * it. hanzo.app keeps no issues table of its own: a second store would be a
 * second answer to "what is open on this project".
 *
 * Surface (proxied verbatim to cloud `/v1/todo`):
 *   GET    /v1/todo/projects                       list boards (org)
 *   POST   /v1/todo/projects                       create board { key?, name, description? }
 *   GET    /v1/todo/projects/:key                  get board
 *   PATCH  /v1/todo/projects/:key                  update board
 *   DELETE /v1/todo/projects/:key                  delete board
 *   GET    /v1/todo/projects/:key/issues           list  ?status&kind&source&repo
 *   POST   /v1/todo/projects/:key/issues           create
 *   GET    /v1/todo/projects/:key/issues/:num      get
 *   PATCH  /v1/todo/projects/:key/issues/:num      update
 *   DELETE /v1/todo/projects/:key/issues/:num      delete
 *
 * Tenancy is the gateway's, not ours: cloud `middleware_identity.go` STRIPS every
 * client-supplied authority header and re-mints `X-Org-Id` from the validated
 * bearer, so we forward the caller's IAM token and nothing else. A browser can
 * never name the org whose board it reads.
 *
 * Security (traversal guard + CSRF gate) is `proxy`, shared with every other
 * catch-all BFF. Without the guard `/v1/todo/../iam/users` would reach IAM.
 */
import { type NextRequest } from 'next/server';

import { proxy } from '@/lib/org/server';

export const runtime = 'nodejs';

const PREFIX = '/v1/todo';

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path, PREFIX, 'GET', false);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path, PREFIX, 'POST', true);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path, PREFIX, 'PATCH', true);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path, PREFIX, 'DELETE', false);
}
