/**
 * Platform bearer-proxy — the builder's authenticated window onto /v1/platform.
 *
 * Forwards any /v1/platform sub-path (GET/POST/DELETE) to the cloud control
 * plane AS the logged-in user: the user's IAM token is minted server-side and
 * attached as the bearer; no org/namespace is ever sent (the cloud derives the
 * tenant from the token owner), so a caller can only reach their own resources.
 *
 * This is a thin pass-through — it holds NO business logic. Project/app/deploy
 * mechanics live in /v1/platform; the cohesive "Deploy" one-shot lives in the
 * sibling ./deploy route. Together they let the builder BIND to the control
 * plane without reimplementing it.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/session';
import { PLATFORM_BASE } from '@/lib/platform';

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { path } = await ctx.params;
  // Traversal guard: segments are literal path parts — never let one escape the
  // /v1/platform prefix.
  if (path.some((seg) => seg === '..' || seg.includes('/') || seg === '')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const search = new URL(req.url).search;
  const url = `${PLATFORM_BASE}/${path.map(encodeURIComponent).join('/')}${search}`;

  const hasBody = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    },
    body: hasBody ? await req.text() : undefined,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text || null, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export const GET = (req: NextRequest, ctx: Ctx) => proxy(req, ctx);
export const POST = (req: NextRequest, ctx: Ctx) => proxy(req, ctx);
export const DELETE = (req: NextRequest, ctx: Ctx) => proxy(req, ctx);
