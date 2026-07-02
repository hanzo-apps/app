/**
 * /v1/publish — the ONE canonical publish for the builder.
 *
 * Turns the editor's built pages into an org-scoped, shared, deployable site:
 *   1. Ensure the org-scoped `/v1/projects` record exists (real name + slug —
 *      never `name: None`). This is the AUTHORITATIVE shared record that
 *      console.hanzo.ai reads from the SAME store.
 *   2. Deploy the built pages to the cloud projectsvc (a tar.gz artifact →
 *      s3.hanzo.ai, org-billed), returning a real liveUrl. Best-effort: if the
 *      cloud deploy backend isn't available in this env, the record still exists
 *      and the caller gets an honest deploy status (never a fabricated success).
 *
 * Org + auth are resolved server-side from the user's bearer (the gateway derives
 * the tenant from its owner claim), so the record is created + billed under the
 * user's org WITHOUT the browser choosing its own tenant.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase, effectiveOrg, resolveOrgIdentity } from '@/lib/org/server';
import { slugifyProject } from '@/lib/org/policy';
import { buildTarGz, type TarEntry } from '@/lib/org/targz';

export const runtime = 'nodejs';

interface PageIn {
  path: string;
  html: string;
}

/** A single page's path must be a safe relative site path (no traversal). */
function safeRel(p: string): string | null {
  const clean = (p || '').replace(/^\/+/, '').trim();
  if (!clean) return null;
  if (clean.includes('..') || clean.includes('\\') || clean.startsWith('/')) return null;
  return clean;
}

export async function POST(req: NextRequest) {
  const id = await resolveOrgIdentity(req, { validate: true });
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!id.homeOrg) {
    return NextResponse.json(
      { error: 'Set up your organization before publishing.', needsOnboarding: true },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    slug?: string;
    description?: string;
    framework?: string;
    pages?: PageIn[];
  };

  const name = (body.name || '').trim();
  const description = (body.description || '').trim().slice(0, 280);
  if (!name) return NextResponse.json({ error: 'A project name is required.' }, { status: 400 });
  const pages = Array.isArray(body.pages) ? body.pages : [];
  if (pages.length === 0) {
    return NextResponse.json({ error: 'Nothing to publish (no pages).' }, { status: 400 });
  }

  const slug = slugifyProject(body.slug || name);
  if (!slug) return NextResponse.json({ error: 'Could not derive a valid slug.' }, { status: 400 });

  const org = effectiveOrg(req, id);
  const bearer: Record<string, string> = {
    Authorization: `Bearer ${id.token}`,
    Accept: 'application/json',
  };
  if (id.isGlobalAdmin && org && org !== id.homeOrg) bearer['X-Org-Id'] = org;
  const base = cloudBase();

  // 1) Ensure the org-scoped record (idempotent: reuse an existing slug, else
  //    create). This guarantees a real name + slug in the shared store.
  let project: Record<string, unknown> | null = null;
  try {
    const getRes = await fetch(`${base}/v1/projects/${encodeURIComponent(slug)}`, {
      headers: bearer,
      cache: 'no-store',
    });
    if (getRes.ok) {
      project = await getRes.json();
    } else if (getRes.status === 404) {
      const createRes = await fetch(`${base}/v1/projects`, {
        method: 'POST',
        headers: { ...bearer, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description, framework: body.framework || 'static' }),
        cache: 'no-store',
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.error || `Could not create project (${createRes.status})` },
          { status: createRes.status },
        );
      }
      project = await createRes.json();
    } else {
      const err = await getRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error || `Projects backend error (${getRes.status})` },
        { status: getRes.status },
      );
    }
  } catch {
    return NextResponse.json({ error: 'Projects backend unreachable.' }, { status: 502 });
  }

  // 2) Best-effort deploy of the built pages (tar.gz artifact → cloud S3). A
  //    failure here does NOT fail publish — the shared record already exists.
  let deployment: unknown = null;
  let deployError: string | null = null;
  try {
    const entries: TarEntry[] = [];
    const seen = new Set<string>();
    let hasIndex = false;
    for (const pg of pages) {
      const rel = safeRel(pg.path);
      if (!rel || seen.has(rel)) continue;
      seen.add(rel);
      if (rel === 'index.html') hasIndex = true;
      entries.push({ name: rel, data: Buffer.from(typeof pg.html === 'string' ? pg.html : '', 'utf8') });
    }
    // projectsvc requires index.html at the artifact root.
    if (!hasIndex) {
      const first = pages.find((p) => safeRel(p.path));
      if (first) entries.push({ name: 'index.html', data: Buffer.from(first.html || '', 'utf8') });
    }

    if (entries.length === 0) throw new Error('no valid pages');

    const artifact = buildTarGz(entries);
    const depRes = await fetch(`${base}/v1/projects/${encodeURIComponent(slug)}/deploy`, {
      method: 'POST',
      headers: { ...bearer, 'Content-Type': 'application/gzip' },
      body: new Uint8Array(artifact),
      cache: 'no-store',
    });
    if (depRes.ok) {
      deployment = await depRes.json();
    } else {
      const err = await depRes.json().catch(() => ({}));
      deployError = err.error || `deploy unavailable (${depRes.status})`;
    }
  } catch (e) {
    deployError = e instanceof Error ? e.message : 'deploy failed';
  }

  return NextResponse.json({
    ok: true,
    project,
    slug,
    org,
    deployment,
    deployError,
  });
}
