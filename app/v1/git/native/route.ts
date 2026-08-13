/**
 * /v1/git/native — commit a builder project to git.hanzo.ai, its DEFAULT home.
 *
 * Every site built here gets a repo on our own forge, owned by the person who
 * built it, so ci.hanzo.ai can test it and cd.hanzo.ai can deploy it. This is
 * the default; `/v1/git/sync` (GitHub/GitLab) stays as the optional export of a
 * project that already has a home.
 *
 * The OWNER is never taken from the request. It is the verified session's IAM
 * username, which is also the forge account name (the forge auto-registers
 * against IAM), so a caller cannot commit into someone else's account — the
 * same binding `/v1/publish` and `/v1/git/sync` use for their targets. That
 * binding is the whole reason it is safe for the server to hold an admin token
 * the browser never sees.
 *
 * POST { name?, pages, message? } → { repo, url, branch, commit }
 */
import { type NextRequest, NextResponse } from 'next/server';

import { session } from '@/lib/iam';
import { requireSameOrigin } from '@/lib/org/csrf';
import { slugifyProject } from '@/lib/org/policy';
import { cloudBase } from '@/lib/org/server';
import { commitMessage } from '@/lib/git/coauthor';
import { ForgeError, commitFiles, ensureRepo, forgeConfigured } from '@/lib/git/forge';
import { MAX_PROJECT_PAGES } from '@/lib/api/git';
import type { Page } from '@/types';

export const runtime = 'nodejs';

/** Same ceiling as /v1/publish — a builder project is a static site, not a mono-repo. */
const MAX_PAGES = MAX_PROJECT_PAGES;
const MAX_BYTES = 12 * 1024 * 1024;

/** The caller's subscription slug, or '' — asked of the same /v1/entitlements the
 *  paywall reads, so a native commit and the upgrade prompt cannot disagree. Any
 *  failure answers '' (attribution stays), which is the safe direction. */
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

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const id = await session(request);
  if (!id) {
    return NextResponse.json({ ok: false, openLogin: true, message: 'Sign in to save your project' }, { status: 401 });
  }
  if (!forgeConfigured()) {
    // Honest, and it names the missing piece rather than pretending to save.
    return NextResponse.json(
      { ok: false, message: 'git.hanzo.ai is not wired on this deployment (GIT_FORGE_TOKEN).' },
      { status: 501 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    message?: string;
    pages?: Page[];
  } | null;

  const pages = body?.pages ?? [];
  if (!pages.length) {
    return NextResponse.json({ ok: false, message: 'Nothing to commit (no pages).' }, { status: 400 });
  }
  if (pages.length > MAX_PAGES) {
    return NextResponse.json({ ok: false, message: `Too many pages (max ${MAX_PAGES}).` }, { status: 413 });
  }
  const bytes = pages.reduce((n, p) => n + (p.html?.length ?? 0), 0);
  if (bytes > MAX_BYTES) {
    return NextResponse.json({ ok: false, message: 'Project exceeds the 12 MiB limit.' }, { status: 413 });
  }

  // The forge account is the IAM username — `session.name` IS that username
  // (IAM's discovery states `name`/`preferred_username` are the username and
  // `displayName` is the human's name), which is what the forge auto-registered.
  const owner = id.name;
  if (!owner) {
    return NextResponse.json({ ok: false, message: 'No account name on this session.' }, { status: 401 });
  }
  const repo = slugifyProject(body?.name?.trim() || 'untitled-site') || 'untitled-site';

  try {
    const { repo: created } = await ensureRepo(owner, repo);
    const branch = created.default_branch || 'main';
    const { commit } = await commitFiles(
      owner,
      repo,
      branch,
      pages.map((p) => ({ path: p.path, content: p.html ?? '' })),
      commitMessage((body?.message || 'Update from hanzo.app').slice(0, 500), {
        omitAttribution: (body as { omitAttribution?: boolean } | null)?.omitAttribution === true,
        tier: await resolveTier(id.token),
      }),
    );
    // LINK IT. The history panel finds commits through `project.repo` — without
    // this, repos are created and committed to and the UI can see none of it, so
    // revisions, bookmarks and fork all read an empty list. `/v1/git/sync` has
    // always recorded the same link for the same reason.
    //
    // Best-effort: the commit is already durable, and a project with no record
    // yet (a brand-new build) has nothing to patch. Failing the request here
    // would discard a successful commit over a bookkeeping step.
    let linked = false;
    try {
      const patch = await fetch(`${cloudBase()}/v1/projects/${encodeURIComponent(repo)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${id.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo: { url: created.html_url, branch } }),
        cache: 'no-store',
      });
      linked = patch.ok;
    } catch {
      /* the repo is committed; the link is retriable next turn */
    }

    return NextResponse.json({
      ok: true,
      repo: created.full_name,
      url: created.html_url,
      branch,
      commit,
      // The history panel reads commits through `project.repo`. When the link did
      // not land — no project record yet, or cloud refused — say so, so the client
      // can retry the PATCH on the next turn instead of showing an empty history
      // it has no reason to distrust.
      linked,
    });
  } catch (e) {
    const status = e instanceof ForgeError ? e.status : 502;
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Could not commit to git.hanzo.ai' },
      // A forge 4xx is about this request; anything else is the service. Passing
      // the status through is what lets the UI tell "name taken" from "down".
      { status: status >= 400 && status < 500 ? status : 502 },
    );
  }
}
