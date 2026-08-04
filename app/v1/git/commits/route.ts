/**
 * /v1/git/commits — the branch commit history for the project's connected repo.
 *
 * The READ counterpart to `/v1/git/sync`. Three modes on ONE route:
 *   - LIST   `GET ?provider=&repo=&branch=` → `{ commits: GitCommit[], supported }`
 *     newest-first (per_page ≤ 100).
 *   - DETAIL `GET ?provider=&repo=&sha=` → `{ commit: GitCommit }` with the
 *     changed-files list + per-file patch (fetched lazily when a History row
 *     expands / the Details view opens — "maps to code").
 *   - PAGES  `GET ?provider=&repo=&sha=&pages=1` → `{ pages: [{path,html}] }` — the
 *     commit's HTML pages reconstructed so the builder can PREVIEW that version.
 *
 * Resolves the signed-in user's linked-provider token SERVER-SIDE via the same
 * `resolveConnection` bearer pattern the sibling git routes use — the token never
 * reaches the browser. Fail-closed: no linked token ⇒ 401 `{connected:false}`.
 * Hanzo git without a commit-log endpoint degrades to `{ commits: [], supported:
 * false }`. Read-only ⇒ no CSRF gate; per-user ⇒ no-store.
 */
import { type NextRequest, NextResponse } from 'next/server';

import type { GitProvider } from '@/lib/api/git';
import { resolveConnection } from '@/lib/git/server';
import { session } from '@/lib/iam';
import { parseOwnerRepo } from '@/lib/git/sync';
import { forgeCommitPages, forgeConfigured, listForgeCommits } from '@/lib/git/forge';
import { GitSyncError } from '@/lib/git/sync';
import { listCommits, getCommit, getCommitPages } from '@/lib/git/log';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function parseProvider(v: string | null): GitProvider | null {
  return v === 'hanzo' || v === 'github' || v === 'gitlab' ? v : null;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const provider = parseProvider(sp.get('provider'));
  if (!provider) {
    return NextResponse.json(
      { error: 'provider must be "hanzo", "github" or "gitlab".' },
      { status: 400, headers: NO_STORE },
    );
  }

  const repo = sp.get('repo')?.trim() || '';
  if (!repo) {
    return NextResponse.json(
      { error: 'repo is required (owner/repo or clone URL).' },
      { status: 400, headers: NO_STORE },
    );
  }
  const branch = sp.get('branch')?.trim() || 'main';
  const sha = sp.get('sha')?.trim() || '';
  const wantPages = sp.get('pages') === '1';

  // NATIVE git (git.hanzo.ai) reads the FORGE, not the third-party path. The
  // write path committed here; reading the timeline anywhere else is why every
  // native repo showed an empty history. The forge is read with the server
  // credential, scoped to the caller: the repo's owner must be THIS session's
  // username, so an admin-capable token cannot read another account's repo.
  if (provider === 'hanzo') {
    const me = await session(req);
    if (!me?.name) {
      return NextResponse.json({ connected: false, commits: [], provider }, { status: 401, headers: NO_STORE });
    }
    if (!forgeConfigured()) {
      return NextResponse.json({ commits: [], supported: false, reason: 'git.hanzo.ai not configured', provider }, { headers: NO_STORE });
    }
    const parsed = parseOwnerRepo(repo);
    const owner = parsed?.owner || me.name;
    const name = parsed?.repo || repo;
    if (owner !== me.name) {
      return NextResponse.json({ error: 'not your repository', commits: [], provider }, { status: 403, headers: NO_STORE });
    }
    try {
      if (sha && wantPages) {
        const pages = await forgeCommitPages(owner, name, sha);
        return NextResponse.json({ pages, supported: true }, { headers: NO_STORE });
      }
      const commits = await listForgeCommits(owner, name, branch);
      return NextResponse.json({ commits, supported: true, provider, branch }, { headers: NO_STORE });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'forge read failed';
      return NextResponse.json({ commits: [], supported: false, reason: msg, provider }, { headers: NO_STORE });
    }
  }

  // The user's own bearer ⇒ the provider token comes back unmasked. Fail-closed
  // to an honest "connect first" when unlinked.
  const conn = await resolveConnection(req, provider);
  if (!conn) {
    return NextResponse.json(
      { connected: false, commits: [], provider },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    if (sha && wantPages) {
      // Reconstruct the commit's HTML pages so the builder can PREVIEW it.
      const pages = await getCommitPages(provider, conn.token, repo, sha);
      return NextResponse.json({ pages, supported: true }, { headers: NO_STORE });
    }
    if (sha) {
      const commit = await getCommit(provider, conn.token, repo, sha);
      return NextResponse.json({ commit, supported: true }, { headers: NO_STORE });
    }
    const commits = await listCommits(provider, conn.token, repo, branch);
    return NextResponse.json({ commits, supported: true, provider, branch }, { headers: NO_STORE });
  } catch (e) {
    if (e instanceof GitSyncError) {
      // Hanzo (or any provider) without a commit-log endpoint ⇒ honest empty
      // timeline the panel can fall back around, not a hard error.
      if (e.code === 'unsupported') {
        return NextResponse.json(
          { commits: [], supported: false, reason: e.message, provider },
          { headers: NO_STORE },
        );
      }
      const payload: Record<string, unknown> = { error: e.message, commits: [], provider };
      if (e.code === 'forbidden') payload.connected = false;
      return NextResponse.json(payload, { status: e.status, headers: NO_STORE });
    }
    return NextResponse.json(
      { error: `${provider} unreachable`, commits: [], provider },
      { status: 502, headers: NO_STORE },
    );
  }
}
