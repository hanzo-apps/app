/**
 * Git commit-LOG reader — the READ counterpart to `lib/git/sync.ts`'s push.
 *
 * `sync.ts` writes the builder's `pages[]` to a repo as one commit; this module
 * READS the branch's commit history back so the History panel can show the real
 * git changeset timeline (newest first), which files a commit touched, the
 * per-file diff, and — for "Preview this version" — reconstruct the commit's HTML
 * pages. Same purity discipline as `sync.ts`: every function takes the resolved
 * provider token as an argument and calls the global `fetch` — no cookies, no
 * `server-only` — so it is unit-testable by mocking `fetch`. Errors are explicit
 * (`GitSyncError` carries the HTTP status the route maps through). Fail-closed.
 *
 *   - GitHub: `GET /repos/{owner}/{repo}/commits?sha={branch}&per_page=N` (list),
 *     `GET /repos/{owner}/{repo}/commits/{sha}` (detail, carries `files[]` with
 *     `patch`).
 *   - GitLab: `GET /projects/{id}/repository/commits?ref_name={branch}` (list),
 *     `.../commits/{sha}` + `/diff` (detail file list with `diff`).
 *   - Hanzo (`api.hanzo.ai/v1/git`): the Gitea-lineage backend. We ATTEMPT its
 *     GitHub/Gitea-compatible commits endpoint; if it is not exposed yet we throw
 *     `GitSyncError(code:'unsupported')` so the route degrades honestly to an
 *     empty log + `supported:false` — never a fabricated history.
 */

import {
  GITHUB_API,
  GITLAB_API,
  HANZO_GIT_API,
  GitSyncError,
  parseOwnerRepo,
  type GitProvider,
} from './sync';

/** One file a commit changed (for the "maps to code" row + the diff view). */
export interface GitCommitFile {
  path: string;
  /** Provider-normalized status: added | modified | removed | renamed. */
  status: 'added' | 'modified' | 'removed' | 'renamed';
  /** The unified diff hunk(s) for this file, when the provider returns them. */
  patch?: string;
}

/** A page (path + HTML) reconstructed from a commit — for "Preview this version". */
export interface CommitPage {
  path: string;
  html: string;
}

/** A normalized commit — the ONE shape the panel + client consume. */
export interface GitCommit {
  sha: string;
  /** First 7 of the sha (tabular display). */
  shortSha: string;
  /** Subject line (first line of the message), trimmed. */
  message: string;
  /** Full commit message (subject + body) — the AI-clean input. */
  rawMessage: string;
  /** Author display name. */
  author: string;
  /** ISO-8601 authored timestamp. */
  authoredAt: string;
  /** Web URL to view the commit on the provider. */
  url: string;
  /** Present only on the detail fetch (`getCommit`). */
  filesChanged?: GitCommitFile[];
}

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 100;

/** Subject line of a commit message, whitespace-trimmed, never empty-blank. */
export function subjectOf(message: string): string {
  return (message || '').split('\n', 1)[0].trim();
}

function clampPerPage(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PER_PAGE;
  return Math.min(Math.floor(n), MAX_PER_PAGE);
}

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hanzo-app',
  };
}

async function ghErr(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '');
  const status = res.status === 401 || res.status === 403 ? res.status : 502;
  const code = res.status === 401 || res.status === 403 ? 'forbidden' : 'git_error';
  throw new GitSyncError(
    `github ${what} failed (${res.status})${text ? `: ${text.slice(0, 300)}` : ''}`,
    status,
    code,
  );
}

interface GhCommitListItem {
  sha: string;
  html_url: string;
  commit: { message: string; author?: { name?: string; date?: string } | null };
  author?: { login?: string } | null;
}

interface GhCommitDetail extends GhCommitListItem {
  files?: { filename: string; status?: string; patch?: string }[];
}

/** GitHub `status` → normalized status. */
function ghFileStatus(s?: string): GitCommitFile['status'] {
  switch (s) {
    case 'added':
      return 'added';
    case 'removed':
      return 'removed';
    case 'renamed':
      return 'renamed';
    default:
      return 'modified';
  }
}

function normalizeGithub(c: GhCommitListItem): GitCommit {
  const rawMessage = c.commit?.message || '';
  return {
    sha: c.sha,
    shortSha: (c.sha || '').slice(0, 7),
    message: subjectOf(rawMessage) || '(no message)',
    rawMessage,
    author: c.commit?.author?.name || c.author?.login || 'unknown',
    authoredAt: c.commit?.author?.date || '',
    url: c.html_url || '',
  };
}

async function listCommitsGithub(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  perPage: number,
): Promise<GitCommit[]> {
  const url =
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/commits?sha=${encodeURIComponent(branch)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: ghHeaders(token), cache: 'no-store' });
  if (!res.ok) return ghErr(res, 'list commits');
  const raw = (await res.json()) as GhCommitListItem[];
  return Array.isArray(raw) ? raw.map(normalizeGithub) : [];
}

async function getCommitGithub(
  token: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<GitCommit> {
  const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`;
  const res = await fetch(url, { headers: ghHeaders(token), cache: 'no-store' });
  if (!res.ok) return ghErr(res, 'get commit');
  const c = (await res.json()) as GhCommitDetail;
  return {
    ...normalizeGithub(c),
    filesChanged: (c.files || []).map((f) => ({
      path: f.filename,
      status: ghFileStatus(f.status),
      patch: f.patch,
    })),
  };
}

// ---------------------------------------------------------------------------
// GitLab
// ---------------------------------------------------------------------------

function glHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'hanzo-app',
  };
}

async function glErr(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '');
  const status = res.status === 401 || res.status === 403 ? res.status : 502;
  const code = res.status === 401 || res.status === 403 ? 'forbidden' : 'git_error';
  throw new GitSyncError(
    `gitlab ${what} failed (${res.status})${text ? `: ${text.slice(0, 300)}` : ''}`,
    status,
    code,
  );
}

interface GlCommitListItem {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  authored_date: string;
  web_url: string;
}

interface GlDiffItem {
  old_path: string;
  new_path: string;
  diff?: string;
  new_file?: boolean;
  deleted_file?: boolean;
  renamed_file?: boolean;
}

function normalizeGitlab(c: GlCommitListItem): GitCommit {
  const rawMessage = c.message || c.title || '';
  return {
    sha: c.id,
    shortSha: c.short_id || (c.id || '').slice(0, 7),
    message: (c.title || subjectOf(rawMessage) || '(no message)').trim(),
    rawMessage,
    author: c.author_name || 'unknown',
    authoredAt: c.authored_date || '',
    url: c.web_url || '',
  };
}

/** GitLab diff flags → normalized status. */
function glFileStatus(d: GlDiffItem): GitCommitFile['status'] {
  if (d.new_file) return 'added';
  if (d.deleted_file) return 'removed';
  if (d.renamed_file) return 'renamed';
  return 'modified';
}

async function listCommitsGitlab(
  token: string,
  projectPath: string,
  branch: string,
  perPage: number,
): Promise<GitCommit[]> {
  const url =
    `${GITLAB_API}/projects/${encodeURIComponent(projectPath)}/repository/commits` +
    `?ref_name=${encodeURIComponent(branch)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: glHeaders(token), cache: 'no-store' });
  if (!res.ok) return glErr(res, 'list commits');
  const raw = (await res.json()) as GlCommitListItem[];
  return Array.isArray(raw) ? raw.map(normalizeGitlab) : [];
}

async function getCommitGitlab(
  token: string,
  projectPath: string,
  sha: string,
): Promise<GitCommit> {
  const base = `${GITLAB_API}/projects/${encodeURIComponent(projectPath)}/repository/commits/${encodeURIComponent(sha)}`;
  const metaRes = await fetch(base, { headers: glHeaders(token), cache: 'no-store' });
  if (!metaRes.ok) return glErr(metaRes, 'get commit');
  const meta = (await metaRes.json()) as GlCommitListItem;

  // The diff is a separate endpoint on GitLab.
  const diffRes = await fetch(`${base}/diff`, { headers: glHeaders(token), cache: 'no-store' });
  const filesChanged: GitCommitFile[] = diffRes.ok
    ? ((await diffRes.json()) as GlDiffItem[]).map((d) => ({
        path: d.new_path || d.old_path,
        status: glFileStatus(d),
        patch: d.diff,
      }))
    : [];
  return { ...normalizeGitlab(meta), filesChanged };
}

// ---------------------------------------------------------------------------
// Hanzo (api.hanzo.ai/v1/git) — Gitea-lineage; commits API is best-effort
// ---------------------------------------------------------------------------

function hzHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'hanzo-app',
  };
}

/**
 * The Hanzo git service addresses repos by NAME (tenancy = the gateway-derived
 * JWT owner). We ATTEMPT the Gitea-compatible commits endpoint. A 404/501 (not
 * exposed) becomes `code:'unsupported'` so the route degrades to an honest empty
 * log — we NEVER fabricate commits for a backend that does not answer.
 */
function hzUnsupported(status: number): never {
  throw new GitSyncError(
    'Hanzo git commit log is not available yet.',
    status === 401 || status === 403 ? status : 501,
    status === 401 || status === 403 ? 'forbidden' : 'unsupported',
  );
}

interface HzCommitItem {
  sha?: string;
  html_url?: string;
  url?: string;
  message?: string;
  commit?: { message?: string; author?: { name?: string; date?: string } };
  author?: { name?: string; login?: string };
  created?: string;
  files?: { filename?: string; path?: string; status?: string; patch?: string }[];
}

function normalizeHanzo(c: HzCommitItem): GitCommit {
  const rawMessage = c.commit?.message || c.message || '';
  const sha = c.sha || '';
  return {
    sha,
    shortSha: sha.slice(0, 7),
    message: subjectOf(rawMessage) || '(no message)',
    rawMessage,
    author: c.commit?.author?.name || c.author?.name || c.author?.login || 'unknown',
    authoredAt: c.commit?.author?.date || c.created || '',
    url: c.html_url || c.url || '',
  };
}

async function listCommitsHanzo(
  token: string,
  name: string,
  branch: string,
  perPage: number,
): Promise<GitCommit[]> {
  const url =
    `${HANZO_GIT_API}/repos/${encodeURIComponent(name)}/commits` +
    `?branch=${encodeURIComponent(branch)}&sha=${encodeURIComponent(branch)}&limit=${perPage}&per_page=${perPage}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: hzHeaders(token), cache: 'no-store' });
  } catch {
    return hzUnsupported(502);
  }
  if (!res.ok) return hzUnsupported(res.status);
  const raw = (await res.json().catch(() => null)) as HzCommitItem[] | null;
  if (!Array.isArray(raw)) return hzUnsupported(501);
  return raw.map(normalizeHanzo);
}

async function getCommitHanzo(token: string, name: string, sha: string): Promise<GitCommit> {
  const url = `${HANZO_GIT_API}/repos/${encodeURIComponent(name)}/commits/${encodeURIComponent(sha)}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: hzHeaders(token), cache: 'no-store' });
  } catch {
    return hzUnsupported(502);
  }
  if (!res.ok) return hzUnsupported(res.status);
  const c = (await res.json().catch(() => null)) as HzCommitItem | null;
  if (!c) return hzUnsupported(501);
  return {
    ...normalizeHanzo(c),
    filesChanged: (c.files || []).map((f) => ({
      path: f.path || f.filename || '',
      status: ghFileStatus(f.status),
      patch: f.patch,
    })),
  };
}

// ---------------------------------------------------------------------------
// Reconstruct a commit's HTML pages (for "Preview this version")
// ---------------------------------------------------------------------------

/** Cap the number of files we reconstruct so a huge repo can't fan out. */
const MAX_PREVIEW_FILES = 60;

const isHtmlPath = (p: string): boolean => /\.html?$/i.test(p);

/** Decode base64 to UTF-8 (Node runtime Buffer; atob fallback for other envs). */
function decodeBase64(b64: string): string {
  const clean = (b64 || '').replace(/\s+/g, '');
  if (typeof Buffer !== 'undefined') return Buffer.from(clean, 'base64').toString('utf-8');
  // eslint-disable-next-line no-undef
  const bin = atob(clean);
  let out = '';
  for (let i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i));
  try {
    return decodeURIComponent(escape(out));
  } catch {
    return out;
  }
}

async function getCommitPagesGithub(
  token: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<CommitPage[]> {
  const base = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const treeRes = await fetch(`${base}/git/trees/${encodeURIComponent(sha)}?recursive=1`, {
    headers: ghHeaders(token),
    cache: 'no-store',
  });
  if (!treeRes.ok) return ghErr(treeRes, 'read tree');
  const tree = (await treeRes.json()) as { tree?: { path: string; type: string; sha: string }[] };
  const blobs = (tree.tree || [])
    .filter((t) => t.type === 'blob' && isHtmlPath(t.path))
    .slice(0, MAX_PREVIEW_FILES);

  const pages: CommitPage[] = [];
  for (const b of blobs) {
    const blobRes = await fetch(`${base}/git/blobs/${b.sha}`, {
      headers: ghHeaders(token),
      cache: 'no-store',
    });
    if (!blobRes.ok) continue;
    const blob = (await blobRes.json()) as { content?: string; encoding?: string };
    const html = blob.encoding === 'base64' ? decodeBase64(blob.content || '') : blob.content || '';
    pages.push({ path: b.path, html });
  }
  return pages;
}

async function getCommitPagesGitlab(
  token: string,
  projectPath: string,
  sha: string,
): Promise<CommitPage[]> {
  const base = `${GITLAB_API}/projects/${encodeURIComponent(projectPath)}/repository`;
  const paths: string[] = [];
  for (let page = 1; page <= 10 && paths.length < MAX_PREVIEW_FILES; page++) {
    const treeRes = await fetch(
      `${base}/tree?recursive=true&ref=${encodeURIComponent(sha)}&per_page=100&page=${page}`,
      { headers: glHeaders(token), cache: 'no-store' },
    );
    if (!treeRes.ok) break;
    const items = (await treeRes.json()) as { type: string; path: string }[];
    for (const it of items) {
      if (it.type === 'blob' && isHtmlPath(it.path)) paths.push(it.path);
    }
    const next = treeRes.headers.get('x-next-page');
    if (!next) break;
    page = Number(next) - 1;
  }

  const pages: CommitPage[] = [];
  for (const p of paths.slice(0, MAX_PREVIEW_FILES)) {
    const rawRes = await fetch(
      `${base}/files/${encodeURIComponent(p)}/raw?ref=${encodeURIComponent(sha)}`,
      { headers: glHeaders(token), cache: 'no-store' },
    );
    if (!rawRes.ok) continue;
    pages.push({ path: p, html: await rawRes.text() });
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/** For github/gitlab, resolve `owner/repo` (or full group path) from the URL. */
function requireOwnerRepo(repoUrlOrPath: string): { owner: string; repo: string; path: string } {
  const parsed = parseOwnerRepo(repoUrlOrPath);
  if (!parsed) throw new GitSyncError('linked repo URL is not a valid repository', 400, 'bad_repo');
  return parsed;
}

/** The Hanzo repo NAME parsed out of a stored clone URL (or a bare name). */
function hanzoRepoName(repoUrlOrPath: string): string {
  const parsed = parseOwnerRepo(repoUrlOrPath);
  const name = (parsed?.repo || repoUrlOrPath || '').trim().replace(/\.git$/i, '');
  if (!name) throw new GitSyncError('linked repo URL is not a valid Hanzo repo', 400, 'bad_repo');
  return name;
}

/**
 * List the branch commit history (newest first), normalized. The ONE entry point
 * the route calls for the timeline. Throws `GitSyncError` (with a status) on
 * failure; Hanzo-without-a-log throws `code:'unsupported'`.
 */
export async function listCommits(
  provider: GitProvider,
  token: string,
  repoUrlOrPath: string,
  branch: string,
  perPage: number = DEFAULT_PER_PAGE,
): Promise<GitCommit[]> {
  const n = clampPerPage(perPage);
  const ref = (branch || 'main').trim() || 'main';
  if (provider === 'github') {
    const { owner, repo } = requireOwnerRepo(repoUrlOrPath);
    return listCommitsGithub(token, owner, repo, ref, n);
  }
  if (provider === 'gitlab') {
    const { path } = requireOwnerRepo(repoUrlOrPath);
    return listCommitsGitlab(token, path, ref, n);
  }
  return listCommitsHanzo(token, hanzoRepoName(repoUrlOrPath), ref, n);
}

/**
 * Fetch ONE commit with its changed-files list + per-file patch (the "maps to
 * code" detail, fetched lazily when a row expands). Throws `GitSyncError`.
 */
export async function getCommit(
  provider: GitProvider,
  token: string,
  repoUrlOrPath: string,
  sha: string,
): Promise<GitCommit> {
  if (!sha) throw new GitSyncError('a commit sha is required', 400, 'bad_sha');
  if (provider === 'github') {
    const { owner, repo } = requireOwnerRepo(repoUrlOrPath);
    return getCommitGithub(token, owner, repo, sha);
  }
  if (provider === 'gitlab') {
    const { path } = requireOwnerRepo(repoUrlOrPath);
    return getCommitGitlab(token, path, sha);
  }
  return getCommitHanzo(token, hanzoRepoName(repoUrlOrPath), sha);
}

/**
 * Reconstruct a commit's HTML pages (`{ path, html }[]`) so the builder can
 * PREVIEW that past version. GitHub/GitLab only; Hanzo git degrades to
 * `code:'unsupported'` (the panel hides Preview for it). Throws `GitSyncError`.
 */
export async function getCommitPages(
  provider: GitProvider,
  token: string,
  repoUrlOrPath: string,
  sha: string,
): Promise<CommitPage[]> {
  if (!sha) throw new GitSyncError('a commit sha is required', 400, 'bad_sha');
  if (provider === 'github') {
    const { owner, repo } = requireOwnerRepo(repoUrlOrPath);
    return getCommitPagesGithub(token, owner, repo, sha);
  }
  if (provider === 'gitlab') {
    const { path } = requireOwnerRepo(repoUrlOrPath);
    return getCommitPagesGitlab(token, path, sha);
  }
  throw new GitSyncError('Preview from a Hanzo git commit is not available yet.', 501, 'unsupported');
}
