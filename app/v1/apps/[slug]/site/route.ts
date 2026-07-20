/**
 * /v1/apps/:slug/site — the deployed site, reconstructed as editable pages.
 *
 * Opening an existing project must load its REAL content back into the editor
 * on any device — not just the one whose local VFS happened to build it. The
 * published deployment (the tar the builder shipped) is served at the project's
 * liveUrl, so this BFF fetches the live site server-side and returns it as the
 * editor's page list:
 *
 *   GET → { liveUrl, pages: [{ path, html }] }
 *
 * Pages are discovered from index.html's relative *.html links (static sites —
 * exactly what the builder publishes). Auth: signed-in only; the project record
 * is read through the same org-scoped forward as /v1/projects. SSRF-guarded:
 * only https://<something>.hanzo.app hosts are ever fetched.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { forwardProjects } from '@/lib/org/server';

export const runtime = 'nodejs';

const MAX_PAGES = 24;
const MAX_PAGE_BYTES = 2 * 1024 * 1024; // mirror the publish cap
const FETCH_TIMEOUT_MS = 8_000;

interface Ctx {
  params: Promise<{ slug: string }>;
}

/** Only a Hanzo-served site is ever fetched (SSRF guard). */
function safeLiveUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    if (!u.hostname.endsWith('.hanzo.app')) return null;
    return u;
  } catch {
    return null;
  }
}

/** Relative same-site *.html hrefs in a page, normalized + deduped. */
function localPages(html: string): string[] {
  const found = new Set<string>();
  const re = /href=["']([^"'#?]+\.html?)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) continue;
    const rel = href.replace(/^\.\//, '').replace(/^\/+/, '');
    if (!rel || rel.includes('..') || rel.includes('\\')) continue;
    if (!/^index\.html?$/i.test(rel)) found.add(rel);
    if (found.size >= MAX_PAGES) break;
  }
  return [...found];
}

async function fetchPage(origin: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/${path}`, {
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html || Buffer.byteLength(html, 'utf8') > MAX_PAGE_BYTES) return null;
    return html;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const clean = (slug || '').trim();
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/i.test(clean)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }

  // The org-scoped record (auth + tenancy enforced by the shared forward).
  const recRes = await forwardProjects(req, `/${encodeURIComponent(clean)}`, { method: 'GET' });
  if (!recRes.ok) {
    return NextResponse.json(
      { liveUrl: null, pages: [], error: `project unavailable (${recRes.status})` },
      { status: recRes.status === 401 ? 401 : 404 },
    );
  }
  const record = (await recRes.json().catch(() => null)) as {
    liveUrl?: string;
    status?: string;
  } | null;

  const candidate =
    (record?.liveUrl && safeLiveUrl(record.liveUrl)) || safeLiveUrl(`https://${clean}.hanzo.app`);
  if (!candidate) {
    return NextResponse.json({ liveUrl: null, pages: [] });
  }
  const origin = candidate.origin;

  const index = await fetchPage(origin, 'index.html').then(
    async (html) => html ?? (await fetchPage(origin, '')),
  );
  // Honest: nothing deployed (or unreachable) — the editor starts fresh. A page
  // referencing /_next/static is the platform shell (wildcard *.hanzo.app
  // fallthrough), NOT the published artifact — never import that as the app.
  if (!index || index.includes('/_next/static')) {
    return NextResponse.json({ liveUrl: origin, pages: [] });
  }

  const extras = await Promise.all(
    localPages(index).map(async (path) => {
      const html = await fetchPage(origin, path);
      return html ? { path, html } : null;
    }),
  );

  return NextResponse.json(
    {
      liveUrl: origin,
      pages: [{ path: 'index.html', html: index }, ...extras.filter(Boolean)],
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
