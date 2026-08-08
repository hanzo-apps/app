/**
 * /v1/git/sync — push a builder project to its repo.
 *
 * The REVERSE of the repo-import path. The builder holds a generated static
 * project (the same `pages[]` that `/v1/publish` deploys); this route:
 *   1. Resolves who is pushing and where. `hanzo` is our own forge and needs no
 *      link — the server commits with its forge credential to the SESSION's
 *      account. GitHub/GitLab need the user's linked OAuth token, resolved from
 *      IAM SERVER-SIDE (it never reaches the browser); no linked token ⇒ 401
 *      `{connected:false}` and the honest "connect first" CTA.
 *   2. Ensures the org-scoped `/v1/projects` record exists (idempotent), reusing
 *      its already-linked repo when set so re-syncs push to the SAME repo.
 *   3. Creates-or-targets the repo and pushes the files as ONE atomic commit.
 *   4. Records the link on the project (PATCH `repo:{url,branch}`) so the console
 *      shows it and future publishes can re-sync.
 *
 * ONE HOME FOR A PROJECT. `hanzo` used to mean `api.hanzo.ai/v1/git/<org>/<slug>`
 * here while the coding agent and the per-turn commit wrote to
 * `git.hanzo.ai/<user>/<slug>`. Same project, two repos, two owners, two
 * histories — and a person looking at either found half their work missing. It
 * now goes through `lib/git/forge.ts`, to the same owner+slug `/v1/git/native`
 * commits to and the sandbox clones from.
 *
 * Auth-required, same-origin (CSRF), size/file-count capped like publish, fail-
 * closed. Org + billing are derived server-side from the bearer owner claim — the
 * browser never chooses its own tenant.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase, effectiveOrg } from '@/lib/org/server';
import { session } from '@/lib/iam';
import { requireSameOrigin } from '@/lib/org/csrf';
import { slugifyProject } from '@/lib/org/policy';
import { resolveConnection } from '@/lib/git/server';
import { ForgeError, commitFiles, ensureRepo, forgeConfigured } from '@/lib/git/forge';
import {
  GitSyncError,
  pushProject,
  toFiles,
  type GitProvider,
  type SyncResult,
} from '@/lib/git/sync';
import { commitMessage } from '@/lib/git/coauthor';

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

/**
 * The connect surface each provider points the user at when no token is linked.
 *
 * Our own forge is absent, and the TYPE is what keeps it absent: there is no
 * OAuth link to offer for it — the caller is already signed in and the server
 * commits with its own forge credential — so a hint for it could only ever be
 * shown by a mistake.
 */
const CONNECT_HINT: Record<Exclude<GitProvider, 'hanzo'>, string> = {
  github: 'Connect GitHub in your account settings, then try again.',
  gitlab: 'Connect GitLab in your account settings, then try again.',
};

function providerOf(v: unknown): GitProvider | null {
  return v === 'hanzo' || v === 'github' || v === 'gitlab' ? v : null;
}

/**
 * The caller's subscription slug, or '' when commerce names no plan.
 *
 * Asked of the same `/v1/entitlements` the paywall UI reads, so the commit and
 * the upgrade prompt cannot disagree about whether someone is paying. Any
 * failure answers '' — attribution stays, which is the safe direction.
 */
async function resolveTier(token: string): Promise<string> {
  try {
    const res = await fetch(`${cloudBase()}/v1/entitlements`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return '';
    const data = (await res.json()) as { tier?: unknown };
    return typeof data?.tier === 'string' ? data.tier : '';
  } catch {
    return '';
  }
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

  const id = await session(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!id.org) {
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
    /** Preference only — the server checks whether the plan permits it. */
    omitAttribution?: boolean;
    pages?: PageIn[];
  };

  const provider = providerOf(body.provider);
  if (!provider) {
    return NextResponse.json({ error: 'provider must be "hanzo", "github" or "gitlab".' }, { status: 400 });
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

  // OUR forge needs no link: the caller is signed in, the owner is their IAM
  // username, and the credential is the server's. What it does need is to BE
  // wired, and saying so beats pretending to publish — the same 501 and the same
  // sentence `/v1/git/native` answers with, because it is the same missing
  // credential.
  if (provider === 'hanzo' && !forgeConfigured()) {
    return NextResponse.json(
      { error: 'git.hanzo.ai is not wired on this deployment (GIT_FORGE_TOKEN).' },
      { status: 501 },
    );
  }
  if (provider === 'hanzo' && !id.name) {
    return NextResponse.json({ error: 'No account name on this session.' }, { status: 401 });
  }

  // Resolve the linked-provider connection SERVER-SIDE (the user's own bearer ⇒
  // token comes back unmasked). Fail-closed to an honest "connect first" when
  // unlinked. resolveConnection is the ONE shared token-resolution path (also
  // used by the accounts/repos routes) — no duplicate get-account round-trip.
  let linkedToken = '';
  if (provider !== 'hanzo') {
    const conn = await resolveConnection(req, provider);
    if (!conn) {
      return NextResponse.json(
        { error: CONNECT_HINT[provider], connected: false, provider },
        { status: 401 },
      );
    }
    linkedToken = conn.token;
  }

  // Org gating: `id` is VALIDATED, so effectiveOrg honors a cross-org X-Org-Id
  // ONLY for a genuine global admin; a normal user is pinned to their home org.
  const org = effectiveOrg(req, id);
  const bearer: Record<string, string> = {
    Authorization: `Bearer ${id.token}`,
    Accept: 'application/json',
  };
  if (org && org !== id.org) bearer['X-Org-Id'] = org;
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

  // Attribution: the trailer is added unless a PAYING caller asked to omit it.
  // `omitAttribution` arrives from the browser and is only a preference; the tier
  // is resolved here from the caller's own bearer, because a paywall the client
  // can answer is not a paywall. An unreadable entitlements service leaves `tier`
  // empty, which fails CLOSED — the trailer stays, which is the safe direction to
  // be wrong in.
  const message = commitMessage(
    (body.message || `Sync ${name} from hanzo.app`).slice(0, 500),
    { omitAttribution: body.omitAttribution === true, tier: await resolveTier(id.token) },
  );

  // 2) Push the files as ONE commit.
  let result: SyncResult;
  try {
    if (provider === 'hanzo') {
      // The OWNER is the session's IAM username and nothing else — the same
      // binding `/v1/git/native` uses, and the only thing that makes it safe for
      // the server to act with an admin-scoped forge credential. `body.account`
      // is ignored here on purpose: a caller cannot publish into someone else's
      // account by naming it.
      const owner = id.name;
      const { repo, created } = await ensureRepo(owner, slug);
      const branch = repo.default_branch || 'main';
      const { commit } = await commitFiles(owner, slug, branch, files, message);
      result = {
        provider: 'hanzo',
        repoUrl: `${repo.html_url}.git`,
        htmlUrl: repo.html_url,
        branch,
        commitSha: commit ?? '',
        created,
      };
    } else {
      result = await pushProject({
        provider,
        token: linkedToken,
        files,
        message,
        existingRepoUrl: existingRepoUrl || undefined,
        account: body.account?.trim() || undefined,
        repoName: body.repo?.trim() || slug,
        private: body.private,
        description: (body.description || '').trim(),
      });
    }
  } catch (e) {
    if (e instanceof GitSyncError) {
      const payload: Record<string, unknown> = { error: e.message, provider };
      if (e.code === 'forbidden') payload.connected = false;
      return NextResponse.json(payload, { status: e.status });
    }
    if (e instanceof ForgeError) {
      // A forge 4xx is about this request (name taken, no such account); anything
      // else is the service. Passing the status through is what lets the UI tell
      // the two apart instead of calling both an outage.
      return NextResponse.json(
        { error: e.message, provider },
        { status: e.status >= 400 && e.status < 500 ? e.status : 502 },
      );
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
