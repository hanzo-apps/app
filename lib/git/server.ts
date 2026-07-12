/**
 * Server-only Git connection layer — the trust boundary for repository import.
 *
 * hanzo.app users authenticate via Hanzo IAM (HIP-0111 OIDC). When a user signs
 * in with — or links — a git provider, Casdoor (IAM) stores that user's provider
 * OAuth token in their account `Properties["oauth_<Provider>_accessToken"]`. IAM
 * masks per-provider tokens for every caller EXCEPT the user themselves, so
 * calling `GET /v1/iam/get-account` with the user's OWN bearer (which we already
 * hold as the httpOnly `hanzo_token` cookie) returns the token unmasked.
 *
 * This module reads that token SERVER-SIDE and uses it to call the provider's
 * REST API on the user's behalf. The provider token NEVER reaches the browser —
 * the BFF routes return only repository/account metadata. Fail-closed everywhere:
 * no IAM bearer, or no linked provider token, ⇒ `null` (the UI shows an honest
 * "Connect" CTA); a shared service token is NEVER substituted.
 */
import 'server-only';

import type { NextRequest } from 'next/server';

import MY_TOKEN_KEY from '@/lib/get-cookie-name';
import type { GitProvider } from '@/lib/api/git';

const trim = (s: string) => s.replace(/\/+$/, '');

/** Hanzo IAM base (OIDC issuer). Same source lib/auth.ts uses. */
function iamBase(): string {
  return trim(process.env.IAM_ENDPOINT || 'https://hanzo.id');
}

const GITHUB_API = 'https://api.github.com';

/** GitLab API base — gitlab.com by default; self-managed via GITLAB_ENDPOINT. */
function gitlabApi(): string {
  return `${trim(process.env.GITLAB_ENDPOINT || 'https://gitlab.com')}/api/v4`;
}

/**
 * Is GitLab connect live? GitHub is always connectable; GitLab requires the
 * gitlab.com OAuth app to be registered AND `provider-gitlab` enabled on the
 * `hanzo-app` IAM application. The operator flips `GITLAB_CONNECT_ENABLED=true`
 * once that setup is done — until then the UI shows an honest "needs setup"
 * state instead of a dead click.
 */
export function gitlabConnectable(): boolean {
  return process.env.GITLAB_CONNECT_ENABLED === 'true';
}

/**
 * Read the user's IAM bearer. Production is COOKIE-ONLY (the httpOnly
 * `hanzo_token` set from the @hanzo/iam SDK) so a client can never inject a
 * bearer; a header is honored only outside production for local curl/testing.
 */
function readBearer(req: NextRequest): string | null {
  const cookie = req.cookies.get(MY_TOKEN_KEY())?.value;
  if (cookie) return cookie;
  if (process.env.NODE_ENV !== 'production') {
    const h = req.headers.get('authorization');
    if (h) return h.startsWith('Bearer ') ? h.slice(7) : h;
  }
  return null;
}

/** A resolved git-provider connection for the signed-in user. */
export interface GitConnection {
  provider: GitProvider;
  /** The provider OAuth access token (SERVER-SIDE ONLY — never serialized out). */
  token: string;
  /** The user's provider login, when IAM recorded it. */
  login: string;
}

/** Shape of the IAM get-account response we consume (best-effort). */
interface IamAccount {
  status?: string;
  data?: {
    github?: string;
    gitlab?: string;
    properties?: Record<string, string>;
  };
}

/**
 * The external providers linked via IAM OAuth. Hanzo is NOT here: it is our own
 * git and needs no OAuth link — the user's IAM bearer is the credential (see
 * `resolveConnection`). This is the set `resolveAllConnections` iterates.
 */
const OAUTH_PROVIDERS = ['github', 'gitlab'] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/** IAM property keys per OAuth provider (Casdoor's `oauth_<Type>_*` convention). */
const IAM_KEYS: Record<OAuthProvider, { token: string; username: string; login?: string }> = {
  github: { token: 'oauth_GitHub_accessToken', username: 'oauth_GitHub_username', login: 'github' },
  gitlab: { token: 'oauth_GitLab_accessToken', username: 'oauth_GitLab_username', login: 'gitlab' },
};

/**
 * Fetch the signed-in user's IAM account once. Shared by every provider resolve
 * so a multi-provider accounts page makes ONE IAM round-trip, not N.
 */
async function fetchIamAccount(bearer: string): Promise<IamAccount | null> {
  let res: Response;
  try {
    res = await fetch(`${iamBase()}/v1/iam/get-account`, {
      headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let body: IamAccount;
  try {
    body = (await res.json()) as IamAccount;
  } catch {
    return null;
  }
  if (body.status && body.status !== 'ok') return null;
  return body;
}

/** Pull one OAuth provider's connection out of an already-fetched IAM account. */
function connectionFromAccount(
  account: IamAccount,
  provider: OAuthProvider,
): GitConnection | null {
  const props = account.data?.properties || {};
  const keys = IAM_KEYS[provider];
  const token = props[keys.token] || '';
  if (!token || token === '***') return null;
  const login =
    (keys.login ? (account.data as Record<string, string | undefined>)?.[keys.login] : '') ||
    props[keys.username] ||
    '';
  return { provider, token, login };
}

/**
 * Resolve the signed-in user's connection for ONE provider.
 *
 * Hanzo is our own git: there is NO separate OAuth link — the user's IAM bearer
 * IS the credential and tenancy is the gateway-derived JWT owner. So Hanzo is
 * always connected whenever a session exists; it fails closed to null ONLY when
 * there is no bearer (⇒ the normal sign-in CTA), never to a service token.
 *
 * GitHub/GitLab resolve their OAuth token from IAM: null when unauthenticated OR
 * the provider isn't linked (the honest "not connected" state). A masked value
 * ("***") is treated as absent.
 */
export async function resolveConnection(
  req: NextRequest,
  provider: GitProvider,
): Promise<GitConnection | null> {
  const bearer = readBearer(req);
  if (!bearer) return null;
  if (provider === 'hanzo') {
    // The push client sends this bearer as Authorization; the gateway derives
    // the org. No IAM get-account round-trip needed.
    return { provider: 'hanzo', token: bearer, login: '' };
  }
  const account = await fetchIamAccount(bearer);
  if (!account) return null;
  return connectionFromAccount(account, provider);
}

/**
 * Resolve ALL linked git connections for the signed-in user in one IAM call.
 * Empty array ⇒ unauthenticated or nothing linked.
 */
export async function resolveAllConnections(req: NextRequest): Promise<GitConnection[]> {
  const bearer = readBearer(req);
  if (!bearer) return [];
  const account = await fetchIamAccount(bearer);
  if (!account) return [];
  const out: GitConnection[] = [];
  for (const provider of OAUTH_PROVIDERS) {
    const conn = connectionFromAccount(account, provider);
    if (conn) out.push(conn);
  }
  return out;
}

/** A connected Git account (the user, or an org/group they belong to). */
export interface GitAccount {
  login: string;
  avatarUrl: string;
  provider: GitProvider;
  type: 'user' | 'org';
}

/** A repository row for the import list. */
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

// ── GitHub ──────────────────────────────────────────────────────────────────

async function gh(token: string, path: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'hanzo-app',
    },
    cache: 'no-store',
  });
}

async function githubAccounts(conn: GitConnection): Promise<GitAccount[] | null> {
  const meRes = await gh(conn.token, '/user');
  if (meRes.status === 401) return null;
  if (!meRes.ok) throw new Error(`github /user ${meRes.status}`);
  const me = (await meRes.json()) as { login: string; avatar_url: string };

  const accounts: GitAccount[] = [
    { login: me.login, avatarUrl: me.avatar_url || '', provider: 'github', type: 'user' },
  ];
  // Orgs are best-effort: a token without org scope simply yields none.
  try {
    const orgRes = await gh(conn.token, '/user/orgs?per_page=100');
    if (orgRes.ok) {
      const orgs = (await orgRes.json()) as { login: string; avatar_url: string }[];
      for (const o of orgs) {
        accounts.push({ login: o.login, avatarUrl: o.avatar_url || '', provider: 'github', type: 'org' });
      }
    }
  } catch {
    /* orgs are optional */
  }
  return accounts;
}

interface GhRepo {
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  pushed_at: string | null;
  updated_at: string | null;
  default_branch: string;
  clone_url: string;
  html_url: string;
}

function normalizeGithub(r: GhRepo): GitRepo {
  return {
    name: r.name,
    fullName: r.full_name,
    private: Boolean(r.private),
    description: r.description || '',
    language: r.language || '',
    pushedAt: r.pushed_at || r.updated_at || '',
    defaultBranch: r.default_branch || 'main',
    cloneUrl: r.clone_url,
    htmlUrl: r.html_url,
    provider: 'github',
  };
}

async function githubRepos(
  conn: GitConnection,
  account: string,
  q: string,
  cap: number,
): Promise<GitRepo[] | null> {
  const isSelf = !account || account === conn.login;
  const path = isSelf
    ? '/user/repos?per_page=100&sort=pushed&type=owner'
    : `/orgs/${encodeURIComponent(account)}/repos?per_page=100&sort=pushed&type=all`;
  const res = await gh(conn.token, path);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`github repos ${res.status}`);
  const raw = (await res.json()) as GhRepo[];
  const needle = q.trim().toLowerCase();
  return raw
    .map(normalizeGithub)
    .filter((r) => (needle ? (r.fullName + ' ' + r.description).toLowerCase().includes(needle) : true))
    .slice(0, cap);
}

// ── GitLab ──────────────────────────────────────────────────────────────────

async function gl(token: string, path: string): Promise<Response> {
  return fetch(`${gitlabApi()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'hanzo-app',
    },
    cache: 'no-store',
  });
}

async function gitlabAccounts(conn: GitConnection): Promise<GitAccount[] | null> {
  const meRes = await gl(conn.token, '/user');
  if (meRes.status === 401) return null;
  if (!meRes.ok) throw new Error(`gitlab /user ${meRes.status}`);
  const me = (await meRes.json()) as { username: string; avatar_url: string };
  return [
    { login: me.username, avatarUrl: me.avatar_url || '', provider: 'gitlab', type: 'user' },
  ];
}

interface GlProject {
  name: string;
  path: string;
  path_with_namespace: string;
  visibility: string;
  description: string | null;
  last_activity_at: string | null;
  default_branch: string | null;
  http_url_to_repo: string;
  web_url: string;
}

function normalizeGitlab(p: GlProject): GitRepo {
  return {
    name: p.path || p.name,
    fullName: p.path_with_namespace,
    private: p.visibility !== 'public',
    description: p.description || '',
    language: '',
    pushedAt: p.last_activity_at || '',
    defaultBranch: p.default_branch || 'main',
    cloneUrl: p.http_url_to_repo,
    htmlUrl: p.web_url,
    provider: 'gitlab',
  };
}

async function gitlabRepos(
  conn: GitConnection,
  q: string,
  cap: number,
): Promise<GitRepo[] | null> {
  const params = new URLSearchParams({
    membership: 'true',
    per_page: '100',
    order_by: 'last_activity_at',
    sort: 'desc',
  });
  if (q.trim()) params.set('search', q.trim());
  const res = await gl(conn.token, `/projects?${params.toString()}`);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`gitlab projects ${res.status}`);
  const raw = (await res.json()) as GlProject[];
  return raw.map(normalizeGitlab).slice(0, cap);
}

// ── Provider dispatch ─────────────────────────────────────────────────────────

/** List the connected accounts for a provider (user + orgs on GitHub). */
export function listAccounts(conn: GitConnection): Promise<GitAccount[] | null> {
  return conn.provider === 'gitlab' ? gitlabAccounts(conn) : githubAccounts(conn);
}

/**
 * List repositories for one account, newest-activity first, filtered by `q`.
 * A 401 (token revoked/expired) ⇒ `null` so the caller reports "not connected".
 */
export function listRepos(
  conn: GitConnection,
  account: string,
  q: string,
  cap = 60,
): Promise<GitRepo[] | null> {
  return conn.provider === 'gitlab'
    ? gitlabRepos(conn, q, cap)
    : githubRepos(conn, account, q, cap);
}
