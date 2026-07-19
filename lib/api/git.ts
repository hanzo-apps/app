/**
 * Client for the same-origin Git import BFF (`/v1/git/*`).
 *
 * These endpoints resolve the user's IAM-linked GitHub token server-side and
 * return only repository/account metadata — the token stays on the server. All
 * calls are same-origin so the httpOnly `hanzo_token` cookie rides automatically
 * (`credentials: "include"`). Every helper resolves (never throws): a not-
 * connected/unauthenticated response yields empty data so the UI can show the
 * honest "Connect GitHub" CTA instead of crashing.
 */

/** The git providers the import surface can talk to. */
export type GitProvider = 'github' | 'gitlab' | 'hanzo';

export interface GitAccount {
  login: string;
  avatarUrl: string;
  provider: GitProvider;
  type: 'user' | 'org';
}

export interface GitRepo {
  name: string;
  fullName: string;
  private: boolean;
  description: string;
  language: string;
  pushedAt: string;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  provider: GitProvider;
}

/**
 * Connectability of one provider, resolved SERVER-SIDE. `connectable: false`
 * with `reason: 'needs-setup'` is the honest state when the OAuth app / IAM
 * provider isn't configured yet — the UI shows "needs setup", never a dead click.
 */
export interface GitProviderStatus {
  provider: GitProvider;
  connectable: boolean;
  reason?: 'needs-setup';
}

export interface GitAccountsResult {
  connected: boolean;
  accounts: GitAccount[];
  providers: GitProviderStatus[];
}

/**
 * Hanzo is our own git — always available to a signed-in user (no OAuth link
 * step). GitHub is always live; GitLab is honest-pending until the server says
 * otherwise.
 */
const DEFAULT_PROVIDERS: GitProviderStatus[] = [
  { provider: 'hanzo', connectable: true },
  { provider: 'github', connectable: true },
  { provider: 'gitlab', connectable: false, reason: 'needs-setup' },
];

/** Connected accounts for the signed-in user (empty + not-connected on any failure). */
export async function fetchGitAccounts(): Promise<GitAccountsResult> {
  try {
    const res = await fetch('/v1/git/accounts', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { connected: false, accounts: [], providers: DEFAULT_PROVIDERS };
    const body = (await res.json()) as Partial<GitAccountsResult>;
    return {
      connected: Boolean(body.connected),
      accounts: Array.isArray(body.accounts) ? body.accounts : [],
      providers: Array.isArray(body.providers) ? body.providers : DEFAULT_PROVIDERS,
    };
  } catch {
    return { connected: false, accounts: [], providers: DEFAULT_PROVIDERS };
  }
}

/** Repositories for one account, server-side filtered by `q`. Empty on any failure. */
export async function fetchGitRepos(
  account: string,
  provider: GitProvider = 'github',
  q = '',
): Promise<GitRepo[]> {
  try {
    const params = new URLSearchParams();
    if (account) params.set('account', account);
    if (provider) params.set('provider', provider);
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/v1/git/repos?${params.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { repos?: GitRepo[] };
    return Array.isArray(body.repos) ? body.repos : [];
  } catch {
    return [];
  }
}

/** The builder deep-link an imported repo opens (existing /dev?repo= wire). */
export function repoImportLink(cloneUrl: string): string {
  return `/dev?repo=${encodeURIComponent(cloneUrl)}&action=edit`;
}

/** A page to push (mirrors the publish `pages[]`). */
export interface SyncPage {
  path: string;
  html: string;
}

export interface SyncGitRequest {
  provider: GitProvider;
  name: string;
  slug?: string;
  description?: string;
  account?: string;
  repo?: string;
  private?: boolean;
  message?: string;
  pages: SyncPage[];
}

export interface SyncGitResult {
  ok: boolean;
  connected?: boolean;
  needsOnboarding?: boolean;
  provider?: GitProvider;
  repoUrl?: string;
  htmlUrl?: string;
  branch?: string;
  commitSha?: string;
  created?: boolean;
  linked?: boolean;
  slug?: string;
  error?: string;
  /** HTTP status, surfaced so the caller can branch (401 ⇒ connect first). */
  status: number;
}

/**
 * Push the builder project to the user's GitHub/GitLab repo (`POST /v1/git/sync`).
 *
 * Same-origin so the httpOnly `hanzo_token` rides automatically; the provider
 * token is resolved + used SERVER-SIDE only. Never throws — a not-connected (401)
 * or error response is returned with `ok:false` so the UI can show the honest
 * "Connect …" CTA or the error.
 */
export async function syncToGit(
  input: SyncGitRequest,
  orgHeader?: string,
): Promise<SyncGitResult> {
  try {
    const res = await fetch('/v1/git/sync', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(orgHeader ? { 'X-Org-Id': orgHeader } : {}),
      },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<SyncGitResult>;
    return { ...data, ok: res.ok && Boolean(data.ok), status: res.status };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Best-effort provider from a stored clone/remote URL (host family). Hanzo is
 *  our own git (api.hanzo.ai/…) and the default when the host is neither forge. */
export function providerFromRepoUrl(url: string): GitProvider {
  const h = (url || '').toLowerCase();
  if (h.includes('gitlab')) return 'gitlab';
  if (h.includes('github')) return 'github';
  return 'hanzo';
}

/** One file a commit touched (the History "maps to code" row + diff view). */
export interface GitCommitFile {
  path: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  patch?: string;
}

/** A normalized commit from `/v1/git/commits` — the History timeline row source. */
export interface GitCommit {
  sha: string;
  shortSha: string;
  message: string;
  rawMessage: string;
  author: string;
  authoredAt: string;
  url: string;
  filesChanged?: GitCommitFile[];
}

export interface GitCommitsResult {
  commits: GitCommit[];
  /** false ⇒ the provider (e.g. Hanzo git) exposes no commit log yet. */
  supported: boolean;
  connected: boolean;
  reason?: string;
}

/**
 * The branch commit history for a connected repo (`GET /v1/git/commits`). Never
 * throws: a not-connected (401) or error response resolves to an empty,
 * `connected:false`/`supported:false` result so the panel degrades honestly.
 */
export async function fetchGitCommits(
  provider: GitProvider,
  repo: string,
  branch = 'main',
): Promise<GitCommitsResult> {
  try {
    const params = new URLSearchParams({ provider, repo, branch });
    const res = await fetch(`/v1/git/commits?${params.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const body = (await res.json().catch(() => ({}))) as Partial<GitCommitsResult>;
    return {
      commits: Array.isArray(body.commits) ? body.commits : [],
      supported: body.supported !== false && res.ok,
      connected: res.ok || body.connected === true,
      reason: body.reason,
    };
  } catch {
    return { commits: [], supported: false, connected: false };
  }
}

/**
 * ONE commit's detail incl. its changed-files list + per-file patch (`GET …&sha=`),
 * fetched lazily when a History row expands or the Details view opens. Null on any
 * failure.
 */
export async function fetchGitCommitDetail(
  provider: GitProvider,
  repo: string,
  sha: string,
): Promise<GitCommit | null> {
  try {
    const params = new URLSearchParams({ provider, repo, sha });
    const res = await fetch(`/v1/git/commits?${params.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { commit?: GitCommit };
    return body.commit ?? null;
  } catch {
    return null;
  }
}

/**
 * Reconstruct a commit's HTML pages so the builder can PREVIEW that past version
 * (`GET …&sha=&pages=1`). Null on any failure (incl. Hanzo git, which has no
 * page reconstruction yet) so the caller keeps the working preview.
 */
export async function fetchCommitPages(
  provider: GitProvider,
  repo: string,
  sha: string,
): Promise<{ path: string; html: string }[] | null> {
  try {
    const params = new URLSearchParams({ provider, repo, sha, pages: '1' });
    const res = await fetch(`/v1/git/commits?${params.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { pages?: { path: string; html: string }[] };
    return Array.isArray(body.pages) ? body.pages : null;
  } catch {
    return null;
  }
}

/**
 * AI-clean a batch of raw commit messages for display (`POST …/summarize` with
 * `{commits}`) → a `sha → clean line` map. Server-cached by sha. On any failure
 * resolves to `{}` so the caller keeps the raw message (never blank).
 */
export async function summarizeCommitMessages(
  commits: { sha: string; message: string }[],
  orgHeader?: string,
): Promise<Record<string, string>> {
  if (commits.length === 0) return {};
  try {
    const res = await fetch('/v1/git/commits/summarize', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(orgHeader ? { 'X-Org-Id': orgHeader } : {}),
      },
      body: JSON.stringify({ commits }),
    });
    if (!res.ok) return {};
    const body = (await res.json()) as { summaries?: Record<string, string> };
    return body.summaries && typeof body.summaries === 'object' ? body.summaries : {};
  } catch {
    return {};
  }
}

/**
 * Compose ONE clean commit subject from the session's edit prompts (`POST
 * …/summarize` with `{prompts}`), authored before a push. Null on failure so the
 * caller can fall back to its own default.
 */
export async function composeCommitMessage(
  prompts: string[],
  orgHeader?: string,
): Promise<string | null> {
  try {
    const res = await fetch('/v1/git/commits/summarize', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(orgHeader ? { 'X-Org-Id': orgHeader } : {}),
      },
      body: JSON.stringify({ prompts }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { message?: string };
    return typeof body.message === 'string' && body.message.trim() ? body.message : null;
  } catch {
    return null;
  }
}

/** "updated 2h ago" — compact relative time for a repo's last push. */
export function relativeTime(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [31536000, 'y'],
    [2592000, 'mo'],
    [604800, 'w'],
    [86400, 'd'],
    [3600, 'h'],
    [60, 'm'],
  ];
  for (const [size, label] of units) {
    if (secs >= size) return `updated ${Math.floor(secs / size)}${label} ago`;
  }
  return 'updated just now';
}
