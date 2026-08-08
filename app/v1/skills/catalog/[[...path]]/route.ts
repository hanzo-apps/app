/**
 * /v1/skills/catalog[/…] — the public agent-skills catalog, same-origin.
 *
 *   GET /v1/skills/catalog                       the master index (528 skills)
 *   GET /v1/skills/catalog/<name>/SKILL.md       one skill's body
 *
 * A static segment outranks the sibling `[[...path]]` catch-all, so this owns
 * `catalog` and the org-scoped BFF keeps everything else under /v1/skills. The
 * two are different things and stay apart: that one is a caller's OWN skills
 * behind a validated principal, this one is the public menu everyone browses.
 *
 * Same-origin for the reason /v1/catalog already documents — the gateway grants
 * CORS to https://hanzo.app and to no other origin, so a direct browser fetch
 * works in production and fails on localhost.
 */
import { NextResponse } from 'next/server';
import { getSkillsCatalog, getSkillBody } from '@/lib/skills-catalog';

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

// Freshness is declared where the data is fetched (lib/skills-catalog passes
// `next: { revalidate }` on both upstream calls), not here. A route-level
// `revalidate` would additionally ask Next to cache the ROUTE, and this one
// answers with two different content types and a 404 — three shapes one cache
// entry cannot hold.
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const cache = 'public, s-maxage=3600, stale-while-revalidate=86400';

  if (!path?.length) {
    const catalog = await getSkillsCatalog();
    return NextResponse.json(catalog, { headers: { 'Cache-Control': cache } });
  }

  const body = await getSkillBody(path);
  if (body === null) {
    return NextResponse.json({ message: 'skill not found' }, { status: 404 });
  }
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': cache },
  });
}
