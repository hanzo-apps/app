import 'server-only';

/**
 * git.hanzo.ai — the DEFAULT home for a project built on hanzo.app.
 *
 * Every site gets a repo on our own forge, owned by the person who built it, so
 * ci.hanzo.ai can test it and cd.hanzo.ai can deploy it. GitHub/GitLab remain
 * available through `/v1/git/sync`, but as an EXPORT of a project that already
 * has a home — not as the home itself. Before this, a project had none: it lived
 * in browser storage until someone linked a third-party account.
 *
 * WHY AN ADMIN TOKEN, AND WHAT BOUNDS IT. The forge federates with Hanzo IAM
 * (`oauth2_client` auto-registration), so a signed-in user already HAS a forge
 * account under their IAM username — but the browser holds no forge credential
 * and must not. So the server acts on their behalf with the forge admin token,
 * and the only thing that keeps that safe is that the OWNER is never taken from
 * the request: it comes from the verified session, exactly as `/v1/publish` and
 * `/v1/git/sync` bind their targets. A caller cannot name someone else's account.
 *
 * Verified against the live forge before this was written:
 *   POST /v1/admin/users/<user>/repos      → 201, repo owned by <user>
 *   POST /v1/repos/<owner>/<repo>/contents → 201, MANY FILES IN ONE COMMIT
 * The second is why a turn is one commit rather than one commit per file.
 */

const BASE = (process.env.GIT_FORGE_URL || 'https://git.hanzo.ai').replace(/\/+$/, '');
const TOKEN = process.env.GIT_FORGE_TOKEN || '';

/** True when the forge credential is wired, so routes can 501 honestly. */
export function forgeConfigured(): boolean {
  return Boolean(TOKEN);
}

/**
 * What a git client needs to speak to the forge as us: a repo URL with NO secret
 * in it, and the one line `git credential-store` reads the secret out of.
 *
 * Two values rather than the obvious `https://user:token@host/owner/repo.git`,
 * because a URL carrying a credential is a credential that leaks: it lands in the
 * clone's `.git/config`, in the argv of every git process (so in `ps`), and in
 * the text of every error git prints about the remote. The pair below keeps the
 * secret off every command line — it travels on the command's STDIN and lands in
 * a 0600 file — while the URL that appears in configs and logs is clean.
 *
 * The token is percent-encoded because git parses that line as a URL and decodes
 * it; a `@` or `:` in a credential would otherwise re-cut the line in the wrong
 * places.
 */
export function forgeRemote(owner: string, name: string): { url: string; credential: string } {
  const origin = new URL(BASE);
  return {
    url: `${BASE}/${encodeURIComponent(owner)}/${encodeURIComponent(name)}.git`,
    credential: `${origin.protocol}//x-access-token:${encodeURIComponent(TOKEN)}@${origin.host}`,
  };
}

export class ForgeError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

async function forge<T>(path: string, init?: RequestInit): Promise<T> {
  if (!TOKEN) throw new ForgeError('git.hanzo.ai credential is not configured', 501);
  let res: Response;
  try {
    res = await fetch(`${BASE}/v1${path}`, {
      ...init,
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: 'no-store',
    });
  } catch (e) {
    throw new ForgeError(`git.hanzo.ai unreachable: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!res.ok) {
    // The forge states a reason; passing it through is what lets a caller tell
    // "name already taken" from "the forge is down" — collapsing them is how a
    // taken name becomes an outage in the UI.
    let detail = text.slice(0, 300);
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) detail = j.message;
    } catch {
      /* not JSON — keep the raw prefix */
    }
    throw new ForgeError(`git.hanzo.ai ${path}: ${detail}`, res.status);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null as T;
  }
}

export interface ForgeRepo {
  full_name: string;
  html_url: string;
  default_branch: string;
}

/** A repo already there, or null. Absence is a legitimate answer here. */
export async function getRepo(owner: string, name: string): Promise<ForgeRepo | null> {
  try {
    return await forge<ForgeRepo>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
  } catch (e) {
    if (e instanceof ForgeError && e.status === 404) return null;
    throw e;
  }
}

/**
 * The project's repo, created if it does not exist yet. Idempotent, so a turn
 * never has to know whether it is the first one.
 *
 * `auto_init` matters: an EMPTY repo has no default branch, and committing into
 * one fails in a way that reads as a permissions problem. Initialising at
 * creation means the first turn commits onto a branch that already exists — and
 * that a clone of it lands on a branch rather than in a detached void.
 *
 * `created` comes back because the lookup that answers it already happened here.
 * A caller that wants to say "repository created" would otherwise have to ask the
 * forge the same question a second time, and could get a different answer.
 */
export async function ensureRepo(
  owner: string,
  name: string,
): Promise<{ repo: ForgeRepo; created: boolean }> {
  const existing = await getRepo(owner, name);
  if (existing) return { repo: existing, created: false };
  const repo = await forge<ForgeRepo>(`/admin/users/${encodeURIComponent(owner)}/repos`, {
    method: 'POST',
    body: JSON.stringify({ name, private: true, auto_init: true, default_branch: 'main' }),
  });
  return { repo, created: true };
}

export interface ForgeFile {
  path: string;
  /** UTF-8 text; encoded here because the forge takes base64. */
  content: string;
}

/**
 * Write `files` as ONE commit.
 *
 * Existing paths must be sent as `update` and new ones as `create`, so the
 * current tree is read first — sending `create` for a path that exists is
 * rejected, and a turn that edits one page and adds another needs both in the
 * same commit.
 */
export async function commitFiles(
  owner: string,
  name: string,
  branch: string,
  files: ForgeFile[],
  message: string,
): Promise<{ commit: string | null }> {
  const present = new Set<string>();
  try {
    const tree = await forge<{ tree?: { path: string; type: string }[] }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${encodeURIComponent(branch)}?recursive=true`,
    );
    for (const e of tree?.tree ?? []) if (e.type === 'blob') present.add(e.path);
  } catch {
    // An unreadable tree means we cannot tell create from update. Treating every
    // file as `create` would fail the whole commit on the first existing path,
    // so fall through with an empty set only for a genuinely new repo — an
    // auto_init repo contains just README.md, which we never write.
  }

  const payload = {
    branch,
    message,
    files: files.map((f) => ({
      operation: present.has(f.path) ? 'update' : 'create',
      path: f.path,
      content: Buffer.from(f.content, 'utf8').toString('base64'),
    })),
  };
  const res = await forge<{ commit?: { sha?: string } }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return { commit: res?.commit?.sha ?? null };
}

/* --------------------------------------------------------------------------- *
 * READS — the history timeline, one commit, and a commit's pages.
 *
 * The write path put commits on git.hanzo.ai; the read path used to look for
 * them on api.hanzo.ai with the owner stripped, so every native repo's history
 * rendered empty and fork/preview threw "not available yet". These read the
 * forge, by owner AND name, with the same server credential the writes use.
 * The caller (the /v1/git/commits route) verifies the owner is the session's,
 * so an admin-scoped token cannot be turned into a read of someone else's repo.
 * --------------------------------------------------------------------------- */

export interface ForgeCommit {
  sha: string;
  message: string;
  author: string;
  at: string;
  url: string;
}

/** Newest-first commit history for a branch. */
export async function listForgeCommits(
  owner: string,
  name: string,
  branch: string,
  limit = 50,
): Promise<ForgeCommit[]> {
  const o = encodeURIComponent(owner);
  const n = encodeURIComponent(name);
  const raw = await forge<
    { sha: string; html_url?: string; commit?: { message?: string; author?: { name?: string; date?: string } } }[]
  >(`/repos/${o}/${n}/commits?sha=${encodeURIComponent(branch)}&limit=${limit}&page=1`);
  return (raw ?? []).map((c) => ({
    sha: c.sha,
    message: c.commit?.message ?? '',
    author: c.commit?.author?.name ?? '',
    at: c.commit?.author?.date ?? '',
    url: c.html_url ?? '',
  }));
}

/**
 * Binary by extension, so it is never decoded as text.
 *
 * A revision is read in order to be PREVIEWED and FORKED, and a fork writes every
 * file back as UTF-8 — which turns a PNG into a corrupt PNG. Extension rather than
 * sniffing because the tree already names every path and nothing else about a blob
 * is known before it is fetched; a wrong guess here costs one skipped asset, and
 * the alternative costs a broken file with no sign that anything happened.
 */
const BINARY =
  /\.(png|jpe?g|gif|webp|avif|ico|bmp|tiff?|svgz|mp[34]|m4a|wav|ogg|opus|webm|mov|avi|mkv|woff2?|ttf|otf|eot|zip|gz|tgz|bz2|xz|7z|rar|pdf|wasm|so|dylib|dll|exe|bin|class|jar|db|sqlite3?|node|psd)$/i;

/** A blob past this is not source, and a revision is not a file server. */
const MAX_BLOB_BYTES = 1024 * 1024;

/** And a revision is not a whole dependency tree either. */
const MAX_BLOBS = 500;

/**
 * A commit's files as { path, html } — for previewing and FORKING a revision.
 *
 * EVERY TEXT BLOB, not just `.html`. The filter used to be `/\.html?$/i`, from
 * when a project was a bag of generated pages and nothing else. A project is now
 * a repo the coding agent pushes to from its sandbox, so its files are `.tsx`,
 * `.ts`, `.json`, `.css` — and every one of them was dropped here, which made a
 * native repo's history preview and its fork both come back EMPTY while the
 * commits sat right there in the timeline.
 *
 * `html` is the field name the whole builder speaks for "the contents of a file
 * at a path"; it is the transport, not a claim about the language.
 *
 * Bounded twice, because a real repo is not a bag of pages: binaries are skipped
 * by extension and anything oversized or past `MAX_BLOBS` is left out rather than
 * fetched one round trip at a time.
 */
export async function forgeCommitPages(
  owner: string,
  name: string,
  sha: string,
): Promise<{ path: string; html: string }[]> {
  const o = encodeURIComponent(owner);
  const n = encodeURIComponent(name);
  const tree = await forge<{ tree?: { path: string; type: string; size?: number }[] }>(
    `/repos/${o}/${n}/git/trees/${encodeURIComponent(sha)}?recursive=true`,
  );
  const blobs = (tree?.tree ?? [])
    .filter(
      (e) =>
        e.type === 'blob' && !BINARY.test(e.path) && (e.size ?? 0) <= MAX_BLOB_BYTES,
    )
    .slice(0, MAX_BLOBS);
  const pages: { path: string; html: string }[] = [];
  for (const b of blobs) {
    try {
      const res = await fetch(
        `${BASE}/v1/repos/${o}/${n}/raw/${encodeURIComponent(sha)}/${b.path.split('/').map(encodeURIComponent).join('/')}`,
        { headers: { Authorization: `token ${TOKEN}` }, cache: 'no-store' },
      );
      if (res.ok) pages.push({ path: b.path, html: await res.text() });
    } catch {
      /* skip a blob we cannot read rather than fail the whole revision */
    }
  }
  return pages;
}

/* --------------------------------------------------------------------------- *
 * LISTING — the signed-in user's own repos and orgs, for the import surface.
 *
 * git.hanzo.ai is the DEFAULT home, so the import panel offers it FIRST — with no
 * OAuth link, because the user's forge account already exists (auto-registered
 * against IAM under their username). The admin token reads it; the account name
 * is the verified session's username, bound by the CALLER exactly as the write
 * path binds its owner, so an admin-scoped read can never be turned against
 * another account. Standard Gitea shapes; only the fields the import row uses.
 * --------------------------------------------------------------------------- */

export interface ForgeAccount {
  login: string;
  avatarUrl: string;
}

export interface ForgeRepoRow {
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  language?: string | null;
  updated_at: string | null;
  default_branch: string | null;
  clone_url: string;
  html_url: string;
}

/** The user's own forge account (its avatar seeds the account picker). */
export async function forgeUser(username: string): Promise<ForgeAccount | null> {
  try {
    const u = await forge<{ login: string; avatar_url?: string }>(
      `/users/${encodeURIComponent(username)}`,
    );
    return u ? { login: u.login, avatarUrl: u.avatar_url || '' } : null;
  } catch (e) {
    if (e instanceof ForgeError && e.status === 404) return null;
    throw e;
  }
}

/** Orgs the user belongs to — best-effort, since none is a legitimate answer. */
export async function forgeUserOrgs(username: string): Promise<ForgeAccount[]> {
  const raw = await forge<{ username: string; avatar_url?: string }[]>(
    `/users/${encodeURIComponent(username)}/orgs?limit=100&page=1`,
  );
  return (raw ?? []).map((o) => ({ login: o.username, avatarUrl: o.avatar_url || '' }));
}

/** The user's own repos (the admin token sees private ones too). */
export async function forgeUserRepos(username: string, limit = 100): Promise<ForgeRepoRow[]> {
  const raw = await forge<ForgeRepoRow[]>(
    `/users/${encodeURIComponent(username)}/repos?limit=${limit}&page=1`,
  );
  return raw ?? [];
}

/** One org's repos. */
export async function forgeOrgRepos(org: string, limit = 100): Promise<ForgeRepoRow[]> {
  const raw = await forge<ForgeRepoRow[]>(
    `/orgs/${encodeURIComponent(org)}/repos?limit=${limit}&page=1`,
  );
  return raw ?? [];
}
