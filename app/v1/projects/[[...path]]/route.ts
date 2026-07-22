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
 * Security: the appended subpath is traversal-guarded so a caller can NEVER
 * escape the `/v1/projects` prefix to reach another cloud surface (e.g. /v1/iam).
 */
import { type NextRequest, NextResponse } from 'next/server';

import { forwardProjects } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';

export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

/** Reject any traversal/escape so the forward stays under /v1/projects. A
 *  malformed percent-escape (decodeURIComponent throws) is treated as hostile
 *  → rejected as invalid (400), never a 500. */
function cleanSubpath(segments: string[] | undefined): string | null {
  if (!segments || segments.length === 0) return '';
  for (const s of segments) {
    if (!s) continue;
    let decoded: string;
    try {
      decoded = decodeURIComponent(s);
    } catch {
      return null; // malformed % escape → reject
    }
    const lower = decoded.toLowerCase();
    const raw = s.toLowerCase();
    if (
      lower === '..' ||
      lower.includes('/') ||
      lower.includes('\\') ||
      raw.includes('%2e') ||
      raw.includes('%2f') ||
      raw.includes(';')
    ) {
      return null;
    }
  }
  return '/' + segments.map((s) => encodeURIComponent(s)).join('/');
}

/** Build the forward subpath (guarded) + preserve the original query string. */
async function subpathOf(req: NextRequest, ctx: Ctx): Promise<string | null> {
  const { path } = await ctx.params;
  const base = cleanSubpath(path);
  if (base === null) return null;
  const qs = req.nextUrl.search || '';
  return base + qs;
}

async function proxy(req: NextRequest, ctx: Ctx, method: string, withBody: boolean) {
  // CSRF: a cross-origin mutating request (POST/PATCH/DELETE) is refused BEFORE
  // any identity/forward work. GET is a no-op here.
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const sub = await subpathOf(req, ctx);
  if (sub === null) return NextResponse.json({ error: 'invalid path' }, { status: 400 });

  let body: BodyInit | null = null;
  let contentType: string | undefined;
  if (withBody) {
    // Pass the body through unchanged (JSON create/update OR a tar deploy
    // artifact). Reading as an ArrayBuffer preserves binary tars.
    contentType = req.headers.get('content-type') || undefined;
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? buf : null;
  }

  return forwardProjects(req, sub, { method, body, contentType });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'GET', false);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'POST', true);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'PATCH', true);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'DELETE', false);
}
