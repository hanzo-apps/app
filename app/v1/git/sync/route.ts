/**
 * /v1/git/sync — push a builder project to the user's own GitHub/GitLab repo.
 *
 * The REVERSE of the repo-import path. The builder holds a generated static
 * project (the same `pages[]` that `/v1/publish` deploys); this route:
 *   1. Resolves the signed-in user's linked-provider OAuth token from IAM
 *      SERVER-SIDE (the user's own bearer; the token NEVER reaches the browser).
 *      No linked token ⇒ 401 `{connected:false}` — the UI shows the honest
 *      "Connect GitHub/GitLab first" CTA (a service token is NEVER substituted).
 *   2. Ensures the org-scoped `/v1/projects` record exists (idempotent), reusing
 *      its already-linked repo when set so re-syncs push to the SAME repo.
 *   3. Creates-or-targets the repo and pushes the files as ONE atomic commit via
 *      the provider REST APIs (no local git binary / clone) — see lib/git/sync.ts.
 *   4. Records the link on the project (PATCH `repo:{url,branch}`) so the console
 *      shows it and future publishes can re-sync.
 *
 * Auth-required, same-origin (CSRF), size/file-count capped like publish, fail-
 * closed. Org + billing are derived server-side from the bearer owner claim — the
 * browser never chooses its own tenant.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase, effectiveOrg, resolveOrgIdentity } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';
import { slugifyProject } from '@/lib/org/policy';
import { resolveConnection } from '@/lib/git/server';
import { GitSyncError, pushProject, toFiles, type GitProvider } from '@/lib/git/sync';

export const runtime = 'nodejs';

// Mirror the publish artifact budget so a huge/malicious payload can't OOM.
const MAX_PAGES = 500;
const MAX_PAGE_BYTES = 2 * 1024 * 1024; // 2 MiB per file
const MAX_TOTAL_BYTES = 12 * 1024 * 1024; // 12 MiB total
const MAX_REQUEST_BYTES = 24 * 1024 * 1024;

interface PageIn {
  path: string;
  html: string;
}

/** The connect surface each provider points the user at when no token is linked. */
const CONNECT_HINT: Record<GitProvider, string> = {
  github: 'Connect GitHub in your account settings, then try again.',
  gitlab: 'Connect GitLab in your account settings, then try again.',
};

function providerOf(v: unknown): GitProvider | null {
  return v === 'github' || v === 'gitlab' ? v : null;
}

export async function POST(req: NextRequest) {
  // CSRF: this creates a repo + commit + project record — refuse a cross-origin
  // POST before any identity/backend/provider work.
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const clen = Number(req.headers.get('content-length') || 0);
  if (clen && clen > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }

  const id = await resolveOrgIdentity(req, { validate: true });
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!id.homeOrg) {
    return NextResponse.json(
      { error: 'Set up your organization before syncing.', needsOnboarding: true },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    provider?: string;
    name?: string;
    slug?: string;
    description?: string;
    account?: string;
    repo?: string;
    private?: boolean;
    message?: string;
    pages?: PageIn[];
  };

  const provider = providerOf(body.provider);
  if (!provider) {
    return NextResponse.json({ error: 'provider must be "github" or "gitlab".' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'A project name is required.' }, { status: 400 });

  const pages = Array.isArray(body.pages) ? body.pages : [];
  if (pages.length === 0) {
    return NextResponse.json({ error: 'Nothing to sync (no pages).' }, { status: 400 });
  }
  if (pages.length > MAX_PAGES) {
    return NextResponse.json({ error: `Too many pages (max ${MAX_PAGES}).` }, { status: 413 });
  }
  let totalBytes = 0;
  for (const pg of pages) {
    const bytes = Buffer.byteLength(typeof pg?.html === 'string' ? pg.html : '', 'utf8');
    if (bytes > MAX_PAGE_BYTES) {
      return NextResponse.json({ error: 'A page exceeds the 2 MiB limit.' }, { status: 413 });
    }
    totalBytes += bytes;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json({ error: 'Project exceeds the 12 MiB limit.' }, { status: 413 });
    }
  }

  const slug = slugifyProject(body.slug || name);
  if (!slug) return NextResponse.json({ error: 'Could not derive a valid slug.' }, { status: 400 });

  const files = toFiles(pages);
  if (files.length === 0) {
    return NextResponse.json({ error: 'No valid files to sync.' }, { status: 400 });
  }

  // Resolve the linked-provider connection SERVER-SIDE (the user's own bearer ⇒
  // token comes back unmasked). Fail-closed to an honest "connect first" when
  // unlinked. resolveConnection is the ONE shared token-resolution path (also
  // used by the accounts/repos routes) — no duplicate get-account round-trip.
  const conn = await resolveConnection(req, provider);
  if (!conn) {
    return NextResponse.json(
      { error: CONNECT_HINT[provider], connected: false, provider },
      { status: 401 },
    );
  }

  // Org gating: `id` is VALIDATED, so effectiveOrg honors a cross-org X-Org-Id
  // ONLY for a genuine global admin; a normal user is pinned to their home org.
  const org = effectiveOrg(req, id);
  const bearer: Record<string, string> = {
    Authorization: `Bearer ${id.token}`,
    Accept: 'application/json',
  };
  if (org && org !== id.homeOrg) bearer['X-Org-Id'] = org;
  const base = cloudBase();

  // 1) Ensure the org-scoped record (idempotent), and read any already-linked
  //    repo so a re-sync pushes to the SAME repo.
  let project: Record<string, unknown> | null = null;
  let existingRepoUrl = '';
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
        body: JSON.stringify({
          name,
          slug,
          description: (body.description || '').slice(0, 280),
          framework: 'static',
        }),
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

  // Only reuse a linked repo that MATCHES the chosen provider (else create fresh
  // for this provider and re-link).
  const repoView = (project?.repo || {}) as { url?: string; provider?: string };
  if (repoView.url && (!repoView.provider || repoView.provider === provider)) {
    existingRepoUrl = repoView.url;
  }

  // 2) Push the files as ONE commit to the provider.
  let result;
  try {
    result = await pushProject({
      provider,
      token: conn.token,
      files,
      message: (body.message || `Sync ${name} from hanzo.app`).slice(0, 500),
      existingRepoUrl: existingRepoUrl || undefined,
      account: body.account?.trim() || undefined,
      repoName: body.repo?.trim() || slug,
      private: body.private,
      description: (body.description || '').trim(),
    });
  } catch (e) {
    if (e instanceof GitSyncError) {
      const payload: Record<string, unknown> = { error: e.message, provider };
      if (e.code === 'forbidden') payload.connected = false;
      return NextResponse.json(payload, { status: e.status });
    }
    return NextResponse.json({ error: 'Sync failed.', provider }, { status: 502 });
  }

  // 3) Record the link on the project (best-effort: the push already succeeded).
  let linked = false;
  try {
    const patchRes = await fetch(`${base}/v1/projects/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: { ...bearer, 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: { url: result.repoUrl, branch: result.branch } }),
      cache: 'no-store',
    });
    if (patchRes.ok) {
      project = await patchRes.json();
      linked = true;
    }
  } catch {
    /* the repo is pushed + the record exists; the link is a convenience */
  }

  return NextResponse.json({
    ok: true,
    provider: result.provider,
    repoUrl: result.repoUrl,
    htmlUrl: result.htmlUrl,
    branch: result.branch,
    commitSha: result.commitSha,
    created: result.created,
    linked,
    slug,
    org,
    project,
  });
}
