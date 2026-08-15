/**
 * Server-only Git source layer — the trust boundary for repository import.
 *
 * Three git homes, and each keeps its credential in ONE place:
 *
 *   git.hanzo.ai   our own git. The verified IAM username IS the account and the
 *                  forge admin token does the reading — no OAuth step at all.
 *   github/gitlab  the org connects once through cloud's CONNECTORS plane, which
 *                  runs the OAuth leg and seals the token in KMS. Cloud answers
 *                  ABOUT the provider on the org's behalf and never hands the
 *                  token out, so this module asks CLOUD and holds no provider
 *                  credential of its own.
 *
 * Nothing here calls github.com or gitlab.com, and nothing here returns a
 * credential to the browser: the BFF routes carry repository and account
 * metadata only. Fail-closed everywhere — no session, or nothing connected, ⇒
 * `null` and the honest Connect CTA; a shared service token is NEVER
 * substituted for a user's own access.
 */
import 'server-only';

import type { NextRequest } from 'next/server';

import { session } from '@/lib/iam';
import { cloudBase } from '@/lib/org/server';
import type { GitProvider } from '@/lib/api/git';
import {
  forgeConfigured,
  forgeUser,
  forgeUserOrgs,
  forgeUserRepos,
  forgeOrgRepos,
  type ForgeRepoRow,
} from '@/lib/git/forge';

const trim = (s: string) => s.replace(/\/+$/, '');

/** Hanzo IAM base (OIDC issuer) — the same `IAM_URL` lib/iam.ts verifies against. */
function iamBase(): string {
  return trim(process.env.IAM_URL || 'https://hanzo.id');
}

// ── The connector plane — where a third-party git credential actually lives ──
//
// IAM authenticates the person; it keeps no provider access token (there is no
// `oauth_*` property anywhere in it, and a live account read carries none). The
// token a GitHub or GitLab import needs is custodied by cloud's CONNECTORS
// plane: the org connects once, cloud runs the OAuth leg and seals the token in
// KMS, and it answers questions ABOUT the provider on the org's behalf. The
// token is never handed out — which is why this module asks cloud for the
// answer instead of asking the provider itself.

/** One connector row as cloud reports it (non-secret metadata only). */
interface Connector {
  available: boolean;
  connected: boolean;
  account: string;
}

/**
 * Read the org's connector catalog as the signed-in user. Cloud derives the org
 * from the verified bearer, so a caller can only ever see their own org's
 * connections. Resolves to an empty map on any failure — the panel then shows an
 * honest empty state rather than a crash.
 */
async function connectors(bearer: string): Promise<Map<string, Connector>> {
  const out = new Map<string, Connector>();
  let res: Response;
  try {
    res = await fetch(`${cloudBase()}/v1/integrations`, {
      headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return out;
  }
  if (!res.ok) return out;
  let body: { providers?: { id?: string; available?: boolean; connected?: boolean; connection?: { account?: string } }[] };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    return out;
  }
  for (const p of body.providers ?? []) {
    if (!p?.id) continue;
    out.set(p.id, {
      available: p.available === true,
      connected: p.connected === true,
      account: p.connection?.account || '',
    });
  }
  return out;
}

/**
 * Which providers a Connect button can actually complete on, asked of the plane
 * that runs the connect: a connector is `available` when this deployment holds
 * its OAuth credentials. So the answer lives in exactly one place and the button
 * lights up the moment the credentials land — no flag to remember.
 *
 * This replaced `GITLAB_CONNECT_ENABLED`, an env nothing ever set, so the answer
 * was pinned to "no" however well GitLab was configured.
 *
 * With no session there is nobody to ask as, and the button's first act for a
 * signed-out visitor is to sign them in — which always works — so both are
 * reported connectable until there is a session to ask with.
 */
export async function connectableProviders(req: NextRequest): Promise<Set<OAuthProvider>> {
  const s = await session(req);
  if (!s?.token) return new Set(OAUTH_PROVIDERS);
  const rows = await connectors(s.token);
  const live = new Set<OAuthProvider>();
  for (const p of OAUTH_PROVIDERS) {
    if (rows.get(p)?.available) live.add(p);
  }
  return live;
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

/**
 * The username each provider's OAuth token authenticates a git clone under —
 * what the forge sends when importing a source the user can reach but the public
 * cannot. The token is the password; these names are the providers' own.
 */
export const CLONE_USERNAME: Record<OAuthProvider, string> = {
  github: 'x-access-token',
  gitlab: 'oauth2',
};

/** IAM account property keys per OAuth provider — the `oauth_<Type>_*` convention. */
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
  bearerOverride?: string,
): Promise<GitConnection | null> {
  // `bearerOverride` lets a route that already resolved its session hand the
  // verified bearer straight in. Verifying it here (a local JWKS check) is what
  // yields the username the native forge listing is keyed on.
  const s = await session(req, bearerOverride);
  if (!s?.token) return null;
  if (provider === 'hanzo') {
    // Our own git: the account IS the verified IAM username (`session.name`, the
    // name the forge auto-registered), and the admin token does the reading. With
    // no forge credential there is nothing to list, so fail to the honest
    // not-connected state rather than a guaranteed error.
    if (!forgeConfigured() || !s.name) return null;
    return { provider: 'hanzo', token: s.token, login: s.name };
  }
  const account = await fetchIamAccount(s.token);
  if (!account) return null;
  return connectionFromAccount(account, provider);
}

/**
 * A git account this panel can LIST repositories for.
 *
 * Deliberately not a {@link GitConnection}: `bearer` is OUR OWN IAM bearer, the
 * credential we ask git.hanzo.ai and the connector plane WITH — never a provider
 * token, and never anything that leaves for github.com or gitlab.com. Keeping
 * the two types apart is what makes sending the wrong one a type error.
 */
export interface GitSource {
  provider: GitProvider;
  /** The connected account (a forge username, or the provider account cloud holds). */
  login: string;
  /** The signed-in user's IAM bearer. */
  bearer: string;
}

/**
 * Every git account the signed-in user can import from.
 *
 * git.hanzo.ai leads — it is our own git, so a signed-in user always has it and
 * there is no OAuth step. GitHub and GitLab come from the org's connectors: a
 * provider appears once the org has CONNECTED it, which is the same fact cloud
 * holds the token under. Empty ⇒ unauthenticated or nothing connected, which
 * draws the honest Connect CTA and never a fabricated row.
 */
export async function resolveSources(req: NextRequest): Promise<GitSource[]> {
  const s = await session(req);
  if (!s?.token) return [];
  const out: GitSource[] = [];
  if (forgeConfigured() && s.name) {
    out.push({ provider: 'hanzo', login: s.name, bearer: s.token });
  }
  const rows = await connectors(s.token);
  for (const provider of OAUTH_PROVIDERS) {
    const row = rows.get(provider);
    if (row?.connected) out.push({ provider, login: row.account, bearer: s.token });
  }
  return out;
}

/** One provider's source, or null when this user cannot import from it. */
export async function resolveSource(
  req: NextRequest,
  provider: GitProvider,
): Promise<GitSource | null> {
  return (await resolveSources(req)).find((s) => s.provider === provider) ?? null;
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

// ── GitHub + GitLab, through the connector plane ─────────────────────────────
//
// We never call github.com or gitlab.com from here. The org's token is sealed in
// KMS by cloud and cloud answers ABOUT the provider on the org's behalf, so this
// module asks cloud with the user's own IAM bearer and the credential stays where
// it was sealed. One rule for both providers; adding a third is a route name.

/** Cloud's listing route per provider — the ONE place a provider's noun lives. */
const CLOUD_REPOS: Record<OAuthProvider, { path: string; key: string }> = {
  github: { path: '/v1/integrations/github/repos', key: 'repos' },
  gitlab: { path: '/v1/integrations/gitlab/projects', key: 'projects' },
};

/** One repository row as cloud reports it (both providers share this shape). */
interface CloudRepo {
  name?: string;
  fullName?: string;
  private?: boolean;
  description?: string;
  defaultBranch?: string;
  pushedAt?: string;
  cloneUrl?: string;
  htmlUrl?: string;
}

/**
 * The repositories the org's connection reaches. `null` when cloud says the
 * connection is gone (401) or does not serve this provider's listing yet (404),
 * which the caller reports as not-connected rather than as an empty account.
 */
async function cloudRepos(src: GitSource): Promise<GitRepo[] | null> {
  const route = CLOUD_REPOS[src.provider as OAuthProvider];
  let res: Response;
  try {
    res = await fetch(`${cloudBase()}${route.path}`, {
      headers: { Authorization: `Bearer ${src.bearer}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new Error(`${src.provider} unreachable`);
  }
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(`${src.provider} repos ${res.status}`);
  let body: Record<string, unknown>;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new Error(`${src.provider} repos unreadable`);
  }
  const rows = body[route.key];
  if (!Array.isArray(rows)) return null;
  return (rows as CloudRepo[])
    .filter((r) => typeof r?.fullName === 'string' && r.fullName)
    .map((r) => ({
      name: r.name || (r.fullName as string).split('/').pop() || '',
      fullName: r.fullName as string,
      private: r.private === true,
      description: r.description || '',
      // Neither listing carries a language, and inventing one from the name
      // would put a guess where a fact belongs. The row reads "Repository".
      language: '',
      pushedAt: r.pushedAt || '',
      defaultBranch: r.defaultBranch || 'main',
      cloneUrl: r.cloneUrl || '',
      htmlUrl: r.htmlUrl || '',
      provider: src.provider,
    }));
}

/**
 * The accounts a provider connection reaches, DERIVED from the repositories it
 * grants — the owner of every `owner/name` it can see. That is the same set the
 * dropdown needs and it costs no second call; a connection that reaches nothing
 * still shows the connected account itself, so the panel never goes blank on a
 * fresh connect.
 */
async function cloudAccounts(src: GitSource): Promise<GitAccount[] | null> {
  const repos = await cloudRepos(src);
  if (repos === null) return null;
  const owners = new Set<string>();
  for (const r of repos) {
    const owner = r.fullName.split('/')[0];
    if (owner) owners.add(owner);
  }
  if (owners.size === 0 && src.login) owners.add(src.login);
  return [...owners].sort().map((login) => ({
    login,
    avatarUrl: '',
    provider: src.provider,
    // The connected account is the user; anything else the connection reaches is
    // an organisation or group they belong to.
    type: login === src.login ? 'user' : 'org',
  }));
}

// ── Hanzo (git.hanzo.ai — the default home) ───────────────────────────────────

function normalizeForge(r: ForgeRepoRow): GitRepo {
  return {
    name: r.name,
    fullName: r.full_name,
    private: Boolean(r.private),
    description: r.description || '',
    language: r.language || '',
    pushedAt: r.updated_at || '',
    defaultBranch: r.default_branch || 'main',
    cloneUrl: r.clone_url,
    htmlUrl: r.html_url,
    provider: 'hanzo',
  };
}

async function hanzoAccounts(src: GitSource): Promise<GitAccount[] | null> {
  const username = src.login;
  if (!username) return null;
  const me = await forgeUser(username);
  const accounts: GitAccount[] = [
    { login: username, avatarUrl: me?.avatarUrl || '', provider: 'hanzo', type: 'user' },
  ];
  // Orgs are best-effort: a user in none simply yields their personal account.
  try {
    for (const o of await forgeUserOrgs(username)) {
      accounts.push({ login: o.login, avatarUrl: o.avatarUrl, provider: 'hanzo', type: 'org' });
    }
  } catch {
    /* orgs are optional */
  }
  return accounts;
}

async function hanzoRepos(
  src: GitSource,
  account: string,
  q: string,
  cap: number,
): Promise<GitRepo[] | null> {
  const username = src.login;
  if (!username) return null;
  const isSelf = !account || account === username;
  const raw = isSelf ? await forgeUserRepos(username) : await forgeOrgRepos(account);
  const needle = q.trim().toLowerCase();
  return raw
    .map(normalizeForge)
    .filter((r) => (needle ? (r.fullName + ' ' + r.description).toLowerCase().includes(needle) : true))
    // Gitea does not promise activity order on this endpoint; sort ourselves so
    // the "newest first" contract holds the same as GitHub/GitLab.
    .sort((a, b) => (b.pushedAt || '').localeCompare(a.pushedAt || ''))
    .slice(0, cap);
}

// ── Provider dispatch ─────────────────────────────────────────────────────────

/** The accounts a source reaches (the user, plus the orgs or groups it grants). */
export function listAccounts(src: GitSource): Promise<GitAccount[] | null> {
  return src.provider === 'hanzo' ? hanzoAccounts(src) : cloudAccounts(src);
}

/**
 * Repositories for one account, newest activity first, filtered by `q`.
 * `null` ⇒ the connection is gone, which the caller reports as not-connected.
 */
export async function listRepos(
  src: GitSource,
  account: string,
  q: string,
  cap = 60,
): Promise<GitRepo[] | null> {
  if (src.provider === 'hanzo') return hanzoRepos(src, account, q, cap);
  const repos = await cloudRepos(src);
  if (repos === null) return null;
  // Cloud answers with everything the connection reaches, so the account and the
  // search narrow it here — one filter, applied the same way for both providers.
  const owner = account.trim().toLowerCase();
  const needle = q.trim().toLowerCase();
  return repos
    .filter((r) => (owner ? r.fullName.toLowerCase().startsWith(owner + '/') : true))
    .filter((r) => (needle ? (r.fullName + ' ' + r.description).toLowerCase().includes(needle) : true))
    .sort((a, b) => (b.pushedAt || '').localeCompare(a.pushedAt || ''))
    .slice(0, cap);
}
