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
export type GitProvider = 'github' | 'gitlab';

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

/** GitHub is always live; GitLab is honest-pending until the server says otherwise. */
const DEFAULT_PROVIDERS: GitProviderStatus[] = [
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

export type GitProvider = 'github' | 'gitlab';

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
