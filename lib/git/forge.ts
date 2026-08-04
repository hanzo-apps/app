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
 * creation means the first turn commits onto a branch that already exists.
 */
export async function ensureRepo(owner: string, name: string): Promise<ForgeRepo> {
  const existing = await getRepo(owner, name);
  if (existing) return existing;
  return forge<ForgeRepo>(`/admin/users/${encodeURIComponent(owner)}/repos`, {
    method: 'POST',
    body: JSON.stringify({ name, private: true, auto_init: true, default_branch: 'main' }),
  });
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
