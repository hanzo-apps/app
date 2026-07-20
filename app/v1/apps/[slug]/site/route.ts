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

// SSRF allowlist for the artifact fetch: a published site lives either at its
// vanity host (`<slug>.hanzo.app`) OR directly in the Hanzo sites object store
// (`s3.hanzo.ai/hanzo-sites/<org>/<slug>/…`, the record's authoritative liveUrl).
// Nothing else is ever fetched.
function safeHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 's3.hanzo.ai' || h.endsWith('.hanzo.app');
}

/**
 * The directory URL (no trailing slash) the site's pages are served from,
 * derived from an allowlisted URL. A URL whose last path segment is a file
 * (`…/index.html`) is reduced to its containing directory so page discovery
 * fetches siblings correctly (this is the shape of the record's S3 liveUrl).
 */
function siteBase(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || !safeHost(u.hostname)) return null;
  let p = u.pathname;
  if (/\/[^/]+\.[a-z0-9]+$/i.test(p)) p = p.replace(/\/[^/]+$/, ''); // strip trailing file
  return (u.origin + p).replace(/\/+$/, '');
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

async function fetchPage(base: string, rel: string): Promise<string | null> {
  try {
    const url = rel ? `${base}/${rel}` : base;
    const res = await fetch(url, {
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
    org?: string;
    bucket?: string;
  } | null;

  // Source the pages from the record's OWN authoritative artifact first (its
  // liveUrl — an s3.hanzo.ai object URL that is always up), then the canonical
  // object path from org+bucket, then the vanity subdomain. The vanity host
  // depends on the edge/DNS being wired; the S3 bases do not, so a project
  // reloads into the editor even mid-rollout of the sites edge.
  const org = (record?.org || '').replace(/[^a-z0-9_-]/gi, '');
  const bucket = (record?.bucket || 'hanzo-sites').replace(/[^a-z0-9_.-]/gi, '');
  const bases = [
    record?.liveUrl ? siteBase(record.liveUrl) : null,
    org ? siteBase(`https://s3.hanzo.ai/${bucket}/${org}/${clean}/index.html`) : null,
    siteBase(`https://${clean}.hanzo.app/index.html`),
  ].filter((b): b is string => !!b);

  // The friendly URL shown in the editor ("your live site"): the vanity host when
  // the project is live, else whatever the record declares.
  const liveUrl =
    record?.status === 'live' ? `https://${clean}.hanzo.app` : record?.liveUrl || null;

  let base: string | null = null;
  let index: string | null = null;
  for (const b of bases) {
    const html = await fetchPage(b, 'index.html').then(async (h) => h ?? (await fetchPage(b, '')));
    // A page referencing /_next/static is the platform shell (wildcard
    // *.hanzo.app fallthrough / console), NOT the published artifact — skip it.
    if (html && !html.includes('/_next/static')) {
      base = b;
      index = html;
      break;
    }
  }

  // Honest: nothing fetchable — the editor opens on the record (name) with an
  // empty preview rather than dead-ending.
  if (!base || !index) {
    return NextResponse.json({ liveUrl, pages: [] });
  }

  const extras = await Promise.all(
    localPages(index).map(async (path) => {
      const html = await fetchPage(base as string, path);
      return html ? { path, html } : null;
    }),
  );

  return NextResponse.json(
    {
      liveUrl,
      pages: [{ path: 'index.html', html: index }, ...extras.filter(Boolean)],
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
