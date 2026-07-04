/**
 * Server-only Git connection layer — the trust boundary for repository import.
 *
 * hanzo.app users authenticate via Hanzo IAM (HIP-0111 OIDC). When a user signs
 * in with — or links — the GitHub provider, Casdoor (IAM) stores that user's
 * GitHub OAuth token in their account `Properties["oauth_GitHub_accessToken"]`.
 * IAM masks per-provider tokens for every caller EXCEPT the user themselves, so
 * calling `GET /v1/iam/get-account` with the user's OWN bearer (which we already
 * hold as the httpOnly `hanzo_token` cookie) returns the token unmasked.
 *
 * This module reads that token SERVER-SIDE and uses it to call the GitHub REST
 * API on the user's behalf. The GitHub token NEVER reaches the browser — the BFF
 * routes return only repository/account metadata. Fail-closed everywhere: no IAM
 * bearer, or no linked GitHub token, ⇒ `null` (the UI shows an honest "Connect
 * GitHub" CTA); a shared service token is NEVER substituted.
 */
import 'server-only';

import type { NextRequest } from 'next/server';

import MY_TOKEN_KEY from '@/lib/get-cookie-name';

const trim = (s: string) => s.replace(/\/+$/, '');

/** Hanzo IAM base (OIDC issuer). Same source lib/auth.ts uses. */
function iamBase(): string {
  return trim(process.env.IAM_ENDPOINT || 'https://hanzo.id');
}

/** GitHub REST API base. */
const GITHUB_API = 'https://api.github.com';

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

/** A resolved GitHub connection for the signed-in user. */
export interface GithubConnection {
  /** The GitHub OAuth access token (SERVER-SIDE ONLY — never serialized out). */
  token: string;
  /** The user's GitHub login, when IAM recorded it. */
  login: string;
}

/** Shape of the IAM get-account response we consume (best-effort). */
interface IamAccount {
  status?: string;
  data?: {
    github?: string;
    properties?: Record<string, string>;
  };
}

/**
 * Resolve the signed-in user's GitHub token from IAM.
 *
 * Returns null when the user is unauthenticated OR has no GitHub linked (the
 * honest "not connected" state). A masked value ("***") is treated as absent.
 */
export async function resolveGithubConnection(
  req: NextRequest,
): Promise<GithubConnection | null> {
  const bearer = readBearer(req);
  if (!bearer) return null;

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

  const props = body.data?.properties || {};
  const token = props['oauth_GitHub_accessToken'] || '';
  if (!token || token === '***') return null;

  const login = body.data?.github || props['oauth_GitHub_username'] || '';
  return { token, login };
}

/** A connected Git account (the user, or an org they belong to). */
export interface GitAccount {
  login: string;
  avatarUrl: string;
  provider: 'github';
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
}

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

/**
 * List the connected accounts: the authenticated user plus every org they can
 * act in. A 401 (token revoked/expired) surfaces as `null` so the caller reports
 * "not connected" rather than a hard error.
 */
export async function listAccounts(
  conn: GithubConnection,
): Promise<GitAccount[] | null> {
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
        accounts.push({
          login: o.login,
          avatarUrl: o.avatar_url || '',
          provider: 'github',
          type: 'org',
        });
      }
    }
  } catch {
    /* orgs are optional */
  }
  return accounts;
}

interface RawRepo {
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

function normalizeRepo(r: RawRepo): GitRepo {
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
  };
}

/**
 * List repositories for one account, newest-push first, filtered by `q`.
 *
 * `account === conn.login` ⇒ the user's own repos (`/user/repos?type=owner`);
 * otherwise the org's repos (`/orgs/:account/repos`). One page of up to 100 is
 * fetched from GitHub and filtered server-side, capped at `cap` rows. Private
 * repos appear only when the stored token carries the `repo` scope.
 */
export async function listRepos(
  conn: GithubConnection,
  account: string,
  q: string,
  cap = 60,
): Promise<GitRepo[] | null> {
  const isSelf = !account || account === conn.login;
  const path = isSelf
    ? '/user/repos?per_page=100&sort=pushed&type=owner'
    : `/orgs/${encodeURIComponent(account)}/repos?per_page=100&sort=pushed&type=all`;

  const res = await gh(conn.token, path);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`github repos ${res.status}`);

  const raw = (await res.json()) as RawRepo[];
  const needle = q.trim().toLowerCase();
  const repos = raw
    .map(normalizeRepo)
    .filter((r) =>
      needle
        ? (r.fullName + ' ' + r.description).toLowerCase().includes(needle)
        : true,
    );
  return repos.slice(0, cap);
}
