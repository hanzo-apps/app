/**
 * /v1/projects[/...] — the org-scoped projects BFF.
 *
 * This is the ONE canonical, shared, org-scoped store of buildable/deployable
 * sites. The SAME records are read/written by hanzo.app (this builder) and
 * console.hanzo.ai (the Projects module) — there is no second copy. This route
 * forwards to the cloud projects service as the signed-in user (their IAM bearer); the
 * cloud gateway derives the tenant from the bearer `owner` claim, so every
 * project/deploy is org-scoped + billed to the right org WITHOUT the browser ever
 * choosing its own tenant (least privilege).
 *
 * Surface (proxied verbatim to cloud `/v1/projects`, see projects service CONTRACT.md):
 *   POST   /v1/projects                       create   { name, slug?, framework?, repo? }
 *   GET    /v1/projects                        list (org)
 *   GET    /v1/projects/:slug                  get
 *   PATCH  /v1/projects/:slug                  update
 *   DELETE /v1/projects/:slug                  delete
 *   POST   /v1/projects/:slug/deploy           deploy (tar body | git json)
 *   GET    /v1/projects/:slug/deployments      deploy history
 *
 * Security (traversal guard + CSRF gate) is `proxy`, shared with every other
 * catch-all BFF so the guards cannot drift apart between surfaces.
 */
import { type NextRequest } from 'next/server';

import { proxy } from '@/lib/org/server';

export const runtime = 'nodejs';

const PREFIX = '/v1/projects';

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
