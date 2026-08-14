/**
 * /v1/git/import — import a repository, with the history it already has.
 *
 * POST { url, name? } → { ok, repo, slug, branch, commit }
 *
 * The repository is cloned onto git.hanzo.ai under the signed-in user, which is
 * where every project built here already lives: from that moment it IS an
 * ordinary project — the history panel lists its commits, the sandbox clones it,
 * autosave commits onto it, and Publish deploys it. Nothing downstream needs to
 * know it came from somewhere else.
 *
 * That is the whole reason the import is a clone rather than a file copy. A copy
 * would start the project at one commit and silently discard however many years
 * of history the source had.
 *
 * The OWNER is the verified session's IAM username, never anything the caller
 * names — the same binding `/v1/git/native` and `/v1/publish` use, and what makes
 * it safe for the server to hold the forge's admin token. A private source is
 * reached with the user's OWN linked provider token, resolved server-side; with
 * none linked the forge clones what is public and says so when it cannot.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { session } from '@/lib/iam';
import { requireSameOrigin } from '@/lib/org/csrf';
import { slugifyProject } from '@/lib/org/policy';
import { ForgeError, forgeConfigured, listForgeCommits, migrateRepo } from '@/lib/git/forge';
import { CLONE_USERNAME, resolveConnection } from '@/lib/git/server';
import { gitUrlGateMessage, parseGitUrl } from '@/lib/git/url';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const id = await session(request);
  if (!id?.name) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: 'Sign in to import a repository' },
      { status: 401 },
    );
  }
  if (!forgeConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'git.hanzo.ai is not wired on this deployment (GIT_FORGE_TOKEN).' },
      { status: 501 },
    );
  }

  const body = (await request.json().catch(() => null)) as { url?: string; name?: string } | null;
  const url = (body?.url || '').trim();

  // The same recognizer and the same sentence the composer and the import panel
  // gate on, so a URL accepted there cannot be refused here for a different
  // reason — or refused here in different words.
  const parsed = parseGitUrl(url);
  if (!parsed) {
    return NextResponse.json({ ok: false, message: 'That is not a repository URL.' }, { status: 400 });
  }
  const gate = gitUrlGateMessage(url);
  if (gate) return NextResponse.json({ ok: false, message: gate }, { status: 400 });

  const slug = slugifyProject(body?.name?.trim() || parsed.name);
  if (!slug) {
    return NextResponse.json({ ok: false, message: 'That repository has no usable name.' }, { status: 400 });
  }

  // A private source needs the user's own credential. `resolveConnection` answers
  // null when that provider is not linked, which is not an error: the forge then
  // clones what is public, and refuses with the source's own reason if it cannot.
  const linked =
    parsed.provider === 'github' || parsed.provider === 'gitlab'
      ? await resolveConnection(request, parsed.provider, id.token)
      : null;

  try {
    const repo = await migrateRepo(id.name, slug, {
      url: parsed.httpsUrl,
      ...(linked ? { username: CLONE_USERNAME[parsed.provider as 'github' | 'gitlab'], password: linked.token } : {}),
    });
    const branch = repo.default_branch || 'main';
    const [head] = await listForgeCommits(id.name, slug, branch, 1);
    return NextResponse.json({
      ok: true,
      repo: repo.full_name,
      url: repo.html_url,
      slug,
      branch,
      commit: head?.sha ?? null,
    });
  } catch (e) {
    const status = e instanceof ForgeError ? e.status : 502;
    return NextResponse.json(
      {
        ok: false,
        message:
          status === 409
            ? `You already have a repository called ${slug}. Rename it or import under another name.`
            : e instanceof Error
              ? e.message
              : 'Could not import that repository.',
      },
      { status: status >= 400 && status < 500 ? status : 502 },
    );
  }
}
