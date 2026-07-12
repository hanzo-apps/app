/**
 * Git-provider push client — the REVERSE of the repo-import path.
 *
 * The builder holds a generated static project (the same `pages[]` that
 * `/v1/publish` deploys). This module PUSHES those files to a repo the user owns
 * on GitHub or GitLab, as ONE atomic commit, using the REST APIs (no local git
 * binary / clone in the Next.js runtime):
 *
 *   - GitHub: the Git Data API — create ONE tree (all files inline) with the
 *     current commit as `base_tree` (non-destructive: existing README/LICENSE/CI
 *     are preserved), ONE commit, then move the branch ref. A single commit for N
 *     files, not N commits.
 *   - GitLab: the atomic Commits API — one POST with a `create`/`update` action
 *     per file (existence resolved from the repo tree), one commit.
 *   - Hanzo: our own git (`api.hanzo.ai/v1/git`). The service accepts a single
 *     push with the files inline — no local git client, no per-file round-trip.
 *     The "token" here is the user's own IAM bearer (they are already signed in),
 *     and tenancy is the gateway-minted org from that JWT — we never pick it.
 *
 * PURE with respect to the runtime: every function takes the resolved provider
 * token as an argument (the BFF resolves it from IAM server-side; it never
 * reaches here from the browser). No cookies, no `server-only` — so this is unit-
 * testable by mocking `fetch`. Errors are explicit (`GitSyncError` carries an
 * HTTP status the route maps through). Fail-closed everywhere.
 */

export type GitProvider = 'github' | 'gitlab' | 'hanzo';

/** A file to write: a site-relative path and its UTF-8 contents. */
export interface SyncFile {
  path: string;
  content: string;
}

/** The outcome of a successful push. */
export interface SyncResult {
  provider: GitProvider;
  /** The clone/remote URL recorded on the project (`…/owner/repo.git`). */
  repoUrl: string;
  /** The human web URL (`https://github.com/owner/repo`). */
  htmlUrl: string;
  /** The branch the commit landed on. */
  branch: string;
  /** The created commit SHA. */
  commitSha: string;
  /** True when this call created the repo (vs pushed to an existing one). */
  created: boolean;
}

/** An explicit, typed failure carrying the HTTP status the BFF should return. */
export class GitSyncError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status = 502, code = 'git_error') {
    super(message);
    this.name = 'GitSyncError';
    this.status = status;
    this.code = code;
  }
}

const GITHUB_API = 'https://api.github.com';
const GITLAB_API = 'https://gitlab.com/api/v4';

/**
 * Hanzo git base (`…/v1/git`). Resolved from the SAME env the cloud base uses
 * (`CLOUD_API_URL` / `HANZO_API_URL`) so there is one-and-only-one source of
 * truth for the api.hanzo.ai origin — no second literal to drift. In-cluster
 * deploys point at the internal gateway via that env; the public gateway is the
 * default. Kept as a bare const (not imported from `server.ts`) so this module
 * stays runtime-pure / unit-testable.
 */
const HANZO_GIT_API = `${(
  process.env.CLOUD_API_URL ||
  process.env.HANZO_API_URL ||
  'https://api.hanzo.ai'
).replace(/\/+$/, '')}/v1/git`;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * A safe repo-relative path: strip leading slashes, reject traversal / absolute /
 * backslash / control chars. Mirrors the publish artifact's `safeRel` so a page
 * can never write outside the repo tree. Returns null for an unusable path.
 */
export function safeRelPath(p: string): string | null {
  const clean = (p || '').replace(/^\/+/, '').trim();
  if (!clean) return null;
  if (clean.includes('..') || clean.includes('\\') || clean.startsWith('/')) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(clean)) return null;
  return clean;
}

/** Deduplicate + sanitize pages into pushable files; guarantees an index.html. */
export function toFiles(pages: { path?: string; html?: string }[]): SyncFile[] {
  const files: SyncFile[] = [];
  const seen = new Set<string>();
  let hasIndex = false;
  for (const pg of pages) {
    const rel = safeRelPath(pg?.path || '');
    if (!rel || seen.has(rel)) continue;
    seen.add(rel);
    if (rel === 'index.html') hasIndex = true;
    files.push({ path: rel, content: typeof pg?.html === 'string' ? pg.html : '' });
  }
  if (!hasIndex && files.length > 0) {
    files.unshift({ path: 'index.html', content: files[0].content });
  }
  return files;
}

/** A short repo name derived from the project slug/name (`a-z0-9-._`, ≤100). */
export function repoNameFrom(input: string): string {
  const n = (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 100);
  return n || 'site';
}

/** Parse `owner/repo` (and optional `.git`) out of a github/gitlab-style URL or path. */
export function parseOwnerRepo(
  urlOrPath: string,
): { owner: string; repo: string; path: string } | null {
  let s = (urlOrPath || '').trim();
  if (!s) return null;
  // git@host:owner/repo.git  →  owner/repo
  s = s.replace(/^git@[\w.-]+:/i, '');
  // strip scheme + host
  s = s.replace(/^https?:\/\/[^/]+\//i, '');
  s = s.replace(/^\/+/, '').replace(/\.git$/i, '');
  const parts = s.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return { owner: parts[0], repo: parts[parts.length - 1], path: parts.join('/') };
}

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

function ghHeaders(token: string, json: boolean): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hanzo-app',
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function gh(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    method,
    headers: ghHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function ghJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

async function ghErr(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '');
  const status = res.status === 401 || res.status === 403 ? res.status : 502;
  const code =
    res.status === 401 || res.status === 403 ? 'forbidden' : 'git_error';
  throw new GitSyncError(`github ${what} failed (${res.status})${text ? `: ${text.slice(0, 300)}` : ''}`, status, code);
}

/** Resolve the authenticated GitHub login (owner default + org routing). */
async function ghLogin(token: string): Promise<string> {
  const res = await gh(token, 'GET', '/user');
  if (!res.ok) return ghErr(res, 'GET /user');
  return (await ghJson<{ login: string }>(res)).login;
}

/** Create the repo if absent, else target the existing one. Idempotent. */
async function ghEnsureRepo(
  token: string,
  authedLogin: string,
  owner: string,
  name: string,
  isPrivate: boolean,
  description: string,
): Promise<{ owner: string; repo: string; defaultBranch: string; created: boolean }> {
  const getRes = await gh(token, 'GET', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
  if (getRes.ok) {
    const r = await ghJson<{ name: string; default_branch: string; owner: { login: string } }>(getRes);
    return { owner: r.owner.login, repo: r.name, defaultBranch: r.default_branch || 'main', created: false };
  }
  if (getRes.status !== 404) return ghErr(getRes, 'repo lookup');

  const isSelf = !owner || owner.toLowerCase() === authedLogin.toLowerCase();
  const createPath = isSelf ? '/user/repos' : `/orgs/${encodeURIComponent(owner)}/repos`;
  // auto_init:true seeds an initial commit + default branch, so the push always
  // UPDATES an existing ref (no empty-repo edge case).
  const createRes = await gh(token, 'POST', createPath, {
    name,
    private: isPrivate,
    description: description.slice(0, 350),
    auto_init: true,
  });
  if (!createRes.ok) return ghErr(createRes, 'create repo');
  const r = await ghJson<{ name: string; default_branch: string; owner: { login: string } }>(createRes);
  return { owner: r.owner.login, repo: r.name, defaultBranch: r.default_branch || 'main', created: true };
}

/** Push files as ONE commit via the Git Data API (trees → commit → ref). */
async function ghPush(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  message: string,
  files: SyncFile[],
): Promise<string> {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  // 1) Current commit + its tree (base_tree ⇒ non-destructive overlay). Absent
  //    on a brand-new empty branch: create the ref instead of updating it.
  let baseCommitSha: string | null = null;
  let baseTreeSha: string | null = null;
  const refRes = await gh(token, 'GET', `${base}/git/ref/heads/${encodeURIComponent(branch)}`);
  if (refRes.ok) {
    baseCommitSha = (await ghJson<{ object: { sha: string } }>(refRes)).object.sha;
    const cRes = await gh(token, 'GET', `${base}/git/commits/${baseCommitSha}`);
    if (cRes.ok) baseTreeSha = (await ghJson<{ tree: { sha: string } }>(cRes)).tree.sha;
  } else if (refRes.status !== 404 && refRes.status !== 409) {
    return ghErr(refRes, 'read ref');
  }

  // 2) One tree with every file inlined (GitHub builds nested subtrees from the
  //    slashed paths automatically).
  const treeRes = await gh(token, 'POST', `${base}/git/trees`, {
    ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
    tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
  });
  if (!treeRes.ok) return ghErr(treeRes, 'create tree');
  const newTree = (await ghJson<{ sha: string }>(treeRes)).sha;

  // 3) One commit.
  const commitRes = await gh(token, 'POST', `${base}/git/commits`, {
    message,
    tree: newTree,
    ...(baseCommitSha ? { parents: [baseCommitSha] } : {}),
  });
  if (!commitRes.ok) return ghErr(commitRes, 'create commit');
  const newCommit = (await ghJson<{ sha: string }>(commitRes)).sha;

  // 4) Move (or create) the branch ref.
  const refUpd = baseCommitSha
    ? await gh(token, 'PATCH', `${base}/git/refs/heads/${encodeURIComponent(branch)}`, { sha: newCommit, force: false })
    : await gh(token, 'POST', `${base}/git/refs`, { ref: `refs/heads/${branch}`, sha: newCommit });
  if (!refUpd.ok) return ghErr(refUpd, 'update ref');
  return newCommit;
}

// ---------------------------------------------------------------------------
// GitLab
// ---------------------------------------------------------------------------

async function gl(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'hanzo-app',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${GITLAB_API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function glErr(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '');
  const status = res.status === 401 || res.status === 403 ? res.status : 502;
  const code = res.status === 401 || res.status === 403 ? 'forbidden' : 'git_error';
  throw new GitSyncError(`gitlab ${what} failed (${res.status})${text ? `: ${text.slice(0, 300)}` : ''}`, status, code);
}

interface GlProject {
  id: number;
  path_with_namespace: string;
  web_url: string;
  http_url_to_repo: string;
  default_branch: string | null;
}

/** Create the project if absent under `namespace`, else target it. Idempotent. */
async function glEnsureProject(
  token: string,
  namespace: string,
  name: string,
  isPrivate: boolean,
  description: string,
): Promise<{ id: string; webUrl: string; repoUrl: string; defaultBranch: string; created: boolean }> {
  const fullPath = `${namespace}/${name}`;
  const getRes = await gl(token, 'GET', `/projects/${encodeURIComponent(fullPath)}`);
  if (getRes.ok) {
    const p = (await getRes.json()) as GlProject;
    return {
      id: String(p.id),
      webUrl: p.web_url,
      repoUrl: p.http_url_to_repo,
      defaultBranch: p.default_branch || 'main',
      created: false,
    };
  }
  if (getRes.status !== 404) return glErr(getRes, 'project lookup');

  // Resolve a non-default namespace_id (group/other user); own namespace is the
  // default when omitted.
  let namespaceId: number | undefined;
  const meRes = await gl(token, 'GET', '/user');
  if (!meRes.ok) return glErr(meRes, 'GET /user');
  const me = (await meRes.json()) as { username: string };
  if (namespace && namespace.toLowerCase() !== me.username.toLowerCase()) {
    const nsRes = await gl(token, 'GET', `/namespaces?search=${encodeURIComponent(namespace)}`);
    if (nsRes.ok) {
      const list = (await nsRes.json()) as { id: number; path: string; full_path: string }[];
      const found = list.find(
        (n) => n.path === namespace || n.full_path === namespace,
      );
      if (found) namespaceId = found.id;
    }
  }

  const createRes = await gl(token, 'POST', '/projects', {
    name,
    path: name,
    visibility: isPrivate ? 'private' : 'public',
    description: description.slice(0, 350),
    initialize_with_readme: false,
    ...(namespaceId ? { namespace_id: namespaceId } : {}),
  });
  if (!createRes.ok) return glErr(createRes, 'create project');
  const p = (await createRes.json()) as GlProject;
  return {
    id: String(p.id),
    webUrl: p.web_url,
    repoUrl: p.http_url_to_repo,
    defaultBranch: p.default_branch || 'main',
    created: true,
  };
}

/** The set of blob paths already in the branch (empty when the branch is new). */
async function glExistingPaths(token: string, id: string, branch: string): Promise<Set<string>> {
  const existing = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    const res = await gl(
      token,
      'GET',
      `/projects/${encodeURIComponent(id)}/repository/tree?recursive=true&ref=${encodeURIComponent(branch)}&per_page=100&page=${page}`,
    );
    if (res.status === 404) break; // empty repo / branch has no commits yet
    if (!res.ok) break; // best-effort: treat as unknown → all "create"
    const items = (await res.json()) as { type: string; path: string }[];
    for (const it of items) if (it.type === 'blob') existing.add(it.path);
    const next = res.headers.get('x-next-page');
    if (!next) break;
    page = Number(next) - 1;
  }
  return existing;
}

/** Push files as ONE atomic commit via the GitLab Commits API. */
async function glPush(
  token: string,
  id: string,
  branch: string,
  message: string,
  files: SyncFile[],
): Promise<string> {
  const existing = await glExistingPaths(token, id, branch);
  const actions = files.map((f) => ({
    action: existing.has(f.path) ? 'update' : 'create',
    file_path: f.path,
    content: f.content,
  }));
  const res = await gl(token, 'POST', `/projects/${encodeURIComponent(id)}/repository/commits`, {
    branch,
    commit_message: message,
    actions,
  });
  if (!res.ok) return glErr(res, 'commit');
  return ((await res.json()) as { id: string }).id;
}

// ---------------------------------------------------------------------------
// Hanzo (api.hanzo.ai/v1/git) — our own git
// ---------------------------------------------------------------------------

/**
 * The "token" for Hanzo is the user's own IAM bearer. The gateway derives the
 * tenant (org) from that JWT, so we send ONLY Authorization — never X-Org-Id.
 */
async function hz(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'hanzo-app',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${HANZO_GIT_API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function hzErr(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '');
  const status = res.status === 401 || res.status === 403 ? res.status : 502;
  const code = res.status === 401 || res.status === 403 ? 'forbidden' : 'git_error';
  throw new GitSyncError(
    `hanzo ${what} failed (${res.status})${text ? `: ${text.slice(0, 300)}` : ''}`,
    status,
    code,
  );
}

interface HzRepo {
  name: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
}

/**
 * Create the repo if absent, else target the existing one. Idempotent: the
 * service returns 409 when it already exists — we then read it back (GET detail)
 * to recover its clone URL + default branch. Mirrors the ensure-repo shape of
 * the GitHub/GitLab paths.
 */
async function hzEnsureRepo(
  token: string,
  name: string,
  description: string,
): Promise<{ repo: HzRepo; created: boolean }> {
  const createRes = await hz(token, 'POST', '/repos', {
    name,
    description: description.slice(0, 350),
  });
  if (createRes.status === 201) {
    return { repo: (await createRes.json()) as HzRepo, created: true };
  }
  if (createRes.status === 409) {
    const getRes = await hz(token, 'GET', `/repos/${encodeURIComponent(name)}`);
    if (!getRes.ok) return hzErr(getRes, 'repo lookup');
    return { repo: (await getRes.json()) as HzRepo, created: false };
  }
  return hzErr(createRes, 'create repo');
}

/** Push all files in ONE commit via the Hanzo push endpoint (no local git). */
async function hzPush(
  token: string,
  name: string,
  branch: string,
  message: string,
  files: SyncFile[],
): Promise<{ commit: string; repo: HzRepo }> {
  const res = await hz(token, 'POST', `/repos/${encodeURIComponent(name)}/push`, {
    branch,
    message,
    files: files.map((f) => ({ path: f.path, content: f.content, encoding: 'utf-8' })),
  });
  if (!res.ok) return hzErr(res, 'push');
  const out = (await res.json()) as { commit: string; cloneUrl: string; sshUrl: string };
  return {
    commit: out.commit,
    repo: { name, cloneUrl: out.cloneUrl, sshUrl: out.sshUrl, defaultBranch: branch },
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface PushOptions {
  provider: GitProvider;
  /** Resolved provider OAuth token (server-side; never from the browser). */
  token: string;
  /** Files to push (already sanitized via `toFiles`). */
  files: SyncFile[];
  /** Commit message. */
  message: string;
  /** An already-linked repo URL — push here instead of creating (idempotent). */
  existingRepoUrl?: string;
  /** Target owner/namespace (default: the authenticated user). */
  account?: string;
  /** Desired repo name (default: derived from the project slug). */
  repoName?: string;
  /** Create private (default true). */
  private?: boolean;
  /** Repo description on create. */
  description?: string;
}

/**
 * Create-or-target a repo and push the files as one commit. The ONE entry point
 * the BFF calls. Throws `GitSyncError` (with an HTTP status) on any failure.
 */
export async function pushProject(opts: PushOptions): Promise<SyncResult> {
  if (!opts.files.length) throw new GitSyncError('nothing to push (no files)', 400, 'empty');
  const isPrivate = opts.private !== false;
  const description = (opts.description || '').trim();

  if (opts.provider === 'hanzo') {
    // Repos are addressed by name; tenancy (org) is the gateway-derived JWT
    // owner, so there is no owner/namespace to resolve. A re-sync reuses the
    // linked repo by parsing its name out of the stored clone URL.
    let name = repoNameFrom(opts.repoName || '');
    if (opts.existingRepoUrl) {
      const parsed = parseOwnerRepo(opts.existingRepoUrl);
      name = repoNameFrom(parsed?.repo || opts.repoName || '');
      if (!name) throw new GitSyncError('linked repo URL is not a valid Hanzo repo', 400, 'bad_repo');
    }
    const { repo, created } = await hzEnsureRepo(opts.token, name, description);
    const branch = repo.defaultBranch || 'main';
    const pushed = await hzPush(opts.token, repo.name, branch, opts.message, opts.files);
    return {
      provider: 'hanzo',
      repoUrl: pushed.repo.cloneUrl,
      // No separate web host in the contract — the clone URL is the canonical
      // link. Strip a trailing `.git` for the human-facing URL.
      htmlUrl: pushed.repo.cloneUrl.replace(/\.git$/i, ''),
      branch,
      commitSha: pushed.commit,
      created,
    };
  }

  if (opts.provider === 'github') {
    const authedLogin = await ghLogin(opts.token);
    let owner: string;
    let repo: string;
    let defaultBranch = 'main';
    let created = false;

    if (opts.existingRepoUrl) {
      const parsed = parseOwnerRepo(opts.existingRepoUrl);
      if (!parsed) throw new GitSyncError('linked repo URL is not a valid GitHub repo', 400, 'bad_repo');
      const ensured = await ghEnsureRepo(opts.token, authedLogin, parsed.owner, parsed.repo, isPrivate, description);
      owner = ensured.owner;
      repo = ensured.repo;
      defaultBranch = ensured.defaultBranch;
    } else {
      const targetOwner = opts.account?.trim() || authedLogin;
      const name = repoNameFrom(opts.repoName || '');
      const ensured = await ghEnsureRepo(opts.token, authedLogin, targetOwner, name, isPrivate, description);
      owner = ensured.owner;
      repo = ensured.repo;
      defaultBranch = ensured.defaultBranch;
      created = ensured.created;
    }

    const commitSha = await ghPush(opts.token, owner, repo, defaultBranch, opts.message, opts.files);
    return {
      provider: 'github',
      repoUrl: `https://github.com/${owner}/${repo}.git`,
      htmlUrl: `https://github.com/${owner}/${repo}`,
      branch: defaultBranch,
      commitSha,
      created,
    };
  }

  // GitLab
  let projectId: string;
  let webUrl: string;
  let repoUrl: string;
  let defaultBranch = 'main';
  let created = false;

  if (opts.existingRepoUrl) {
    const parsed = parseOwnerRepo(opts.existingRepoUrl);
    if (!parsed) throw new GitSyncError('linked repo URL is not a valid GitLab project', 400, 'bad_repo');
    const getRes = await gl(opts.token, 'GET', `/projects/${encodeURIComponent(parsed.path)}`);
    if (!getRes.ok) return glErr(getRes, 'project lookup');
    const p = (await getRes.json()) as GlProject;
    projectId = String(p.id);
    webUrl = p.web_url;
    repoUrl = p.http_url_to_repo;
    defaultBranch = p.default_branch || 'main';
  } else {
    const meRes = await gl(opts.token, 'GET', '/user');
    if (!meRes.ok) return glErr(meRes, 'GET /user');
    const me = (await meRes.json()) as { username: string };
    const namespace = opts.account?.trim() || me.username;
    const name = repoNameFrom(opts.repoName || '');
    const ensured = await glEnsureProject(opts.token, namespace, name, isPrivate, description);
    projectId = ensured.id;
    webUrl = ensured.webUrl;
    repoUrl = ensured.repoUrl;
    defaultBranch = ensured.defaultBranch;
    created = ensured.created;
  }

  const commitSha = await glPush(opts.token, projectId, defaultBranch, opts.message, opts.files);
  return { provider: 'gitlab', repoUrl, htmlUrl: webUrl, branch: defaultBranch, commitSha, created };
}
