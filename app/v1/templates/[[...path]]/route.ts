/**
 * /v1/templates[/...] — same-origin BFF for the READ-ONLY Hanzo starter-kit
 * gallery (the real hanzoai/gallery catalog, ~69 templates).
 *
 * Unlike /v1/projects, this surface is PUBLIC reference content — there is no
 * tenant, no per-user data, and the cloud endpoint takes no bearer. So we do NOT
 * attach identity or scope: we just forward the GET to `<cloud>/v1/templates`
 * verbatim and stream the response back. Keeping the browser on a same-origin
 * path (rather than calling api.hanzo.ai directly) avoids CORS and lets a
 * standalone/in-cluster deploy retarget the cloud with CLOUD_API_URL.
 *
 * Surface (proxied verbatim to cloud, see cloud clients/templates):
 *   GET /v1/templates          list the catalog     -> { data: [Template] }
 *   GET /v1/templates/:slug    one template by slug  -> Template (404 if absent)
 *
 * Security: GET only (read-only), and the appended subpath is traversal-guarded
 * so a caller can NEVER escape the `/v1/templates` prefix to reach another cloud
 * surface. A malformed percent-escape is rejected 400, never a 500.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase } from '@/lib/org/server';
import { getCatalog } from '@/lib/gallery-catalog';

export const runtime = 'nodejs';

/** Minimal HTML-attribute/text escaper for the few interpolated fields. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * `/v1/templates/:slug/html` — the template's ready-to-show preview as a
 * self-contained HTML document, so the builder can render it in the preview
 * IMMEDIATELY (before/without any AI call) and let the AI only augment from
 * there.
 *
 * Gallery templates are multi-file repos (github.com/hanzo-apps/<slug>), not a
 * single fetchable index.html — so the honest, always-correct "existing" view
 * is the template's REAL screenshot. We wrap it full-bleed in a tiny document
 * (no external CSS/JS) that renders cleanly as an iframe `srcDoc`. Never
 * fabricated: 404 when the catalog has no screenshot for the slug.
 */
async function templateHtmlResponse(slug: string): Promise<Response> {
  const clean = slug.trim();
  if (!clean) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });

  try {
    const catalog = await getCatalog();
    const t = (catalog.templates ?? []).find((x) => x.slug === clean);
    const shot = t?.screenshotUrl || t?.screenshot || '';
    if (!t || !shot) {
      return NextResponse.json({ error: 'no preview for slug' }, { status: 404 });
    }
    const title = t.displayName || t.name || clean;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{min-height:100%;background:#0a0a0a}
  img{display:block;width:100%;height:auto}
</style>
</head>
<body>
<img src="${esc(shot)}" alt="${esc(title)} template preview" />
</body>
</html>`;
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'template preview unavailable' }, { status: 502 });
  }
}

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

/** Reject any traversal/escape so the forward stays under /v1/templates. */
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

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;

  // `/v1/templates/:slug/html` → the template's immediate, self-contained
  // preview document (handled locally from the gallery catalog, not proxied).
  if (Array.isArray(path) && path.length === 2 && path[1] === 'html') {
    return templateHtmlResponse(path[0]);
  }

  const base = cleanSubpath(path);
  if (base === null) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  }
  const qs = req.nextUrl.search || '';
  const url = `${cloudBase()}/v1/templates${base}${qs}`;

  // A single-slug lookup (`/v1/templates/<slug>`). The cloud catalog and the
  // `/v1/gallery` snapshot don't list the SAME slugs (e.g. `circle` is in the
  // gallery but 404s on the cloud single-template endpoint), so a bare proxy
  // leaked a raw 404 into the builder's template flow (`?template=…`). When the
  // cloud 404s a single slug, fall back to the gallery snapshot and return the
  // matching card in the template shape — so every gallery slug resolves.
  const isSingleSlug = Array.isArray(path) && path.length === 1;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      // Reference content changes rarely — let the platform cache it briefly
      // rather than hammer the cloud on every browse.
      next: { revalidate: 300 },
    });

    if (res.status === 404 && isSingleSlug) {
      const fromGallery = await templateFromGallery(path![0]);
      if (fromGallery) return NextResponse.json(fromGallery);
    }

    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    // Cloud unreachable — still try the gallery snapshot for a single slug.
    if (isSingleSlug) {
      const fromGallery = await templateFromGallery(path![0]);
      if (fromGallery) return NextResponse.json(fromGallery);
    }
    return NextResponse.json({ error: 'templates backend unreachable' }, { status: 502 });
  }
}

/** Resolve a slug from the `/v1/gallery` snapshot and shape it like a cloud
 *  Template, so a gallery-only slug still returns 200 on /v1/templates/:slug. */
async function templateFromGallery(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${cloudBase()}/v1/gallery`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { templates?: Array<Record<string, unknown>> };
    const rows = Array.isArray(body?.templates) ? body.templates : [];
    const g = rows.find((r) => String(r.slug) === slug);
    if (!g) return null;
    const str = (v: unknown) => (typeof v === 'string' ? v : '');
    return {
      slug: str(g.slug) || slug,
      title: str(g.displayName) || str(g.name) || slug,
      category: str(g.category),
      description: str(g.description),
      framework: str(g.framework),
      features: Array.isArray(g.features) ? g.features : [],
      useCase: str(g.useCase),
      tier: typeof g.tier === 'number' ? g.tier : undefined,
      rating: typeof g.rating === 'number' ? g.rating : undefined,
      source: str(g.templateUrl) || str(g.repo) || `https://gallery.hanzo.ai/templates/${slug}`,
      preview: str(g.screenshotUrl) || str(g.screenshot),
    };
  } catch {
    return null;
  }
}
