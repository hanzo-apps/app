/**
 * Connectors client — the ONE browser client for the org-scoped connector surface.
 *
 * "Connectors" is the product name; the cloud API is `/v1/integrations` (the
 * generic OAuth/apikey connector framework in cloud `clients/integrations`). This
 * talks to the SAME-ORIGIN `/v1/integrations` BFF (app/v1/integrations/[[...path]]),
 * which forwards to that cloud surface as the signed-in user. Cloud derives the
 * org from the bearer `owner` claim (gateway-minted `X-Org-Id`), so every
 * connection is org-scoped — and the httpOnly `hanzo_token` is NEVER read by
 * browser JS (the cookie rides the same-origin request; least privilege).
 *
 * The types + normalizers MIRROR console's client (console/src/lib/api/
 * integrations.ts) EXACTLY, so hanzo.app and console.hanzo.ai render the SAME
 * org connectors from the SAME cloud store — one contract, two surfaces. The
 * normalizers tolerate snake_case + alternate envelope keys so a shape drift on
 * either side never blanks the page.
 *
 * Resolves-never-throws: any failure yields empty/typed-error data so the page
 * shows an honest empty state or toast instead of crashing (mirrors lib/api/git).
 */

import { currentOrg } from '@/lib/org-scope';

// --- Types (cloud clients/integrations providerView + connectionView) ---

/** A live connection this org holds for a provider (non-secret metadata only —
 *  the OAuth/apikey token lives in KMS server-side, never here). */
export interface Connection {
  account: string;
  externalId: string;
  scopes: string[];
  /** RFC3339; may be empty. */
  connectedAt: string;
}

/** One connector in the catalog, carrying THIS org's connection status. */
export interface Provider {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Credentials configured on this deployment (the connector can be used). */
  available: boolean;
  /** This org has an active connection. */
  connected: boolean;
  connection: Connection | null;
}

/** The OAuth connect leg: a provider consent URL to top-level-navigate to. */
export interface ConnectResult {
  authorizeUrl?: string;
  error?: string;
}

export interface DisconnectResult {
  ok: boolean;
  error?: string;
}

// --- Transport (same-origin BFF; the httpOnly cookie carries auth) ---

const BASE = '/v1/integrations';

/** Stamp the selected org as X-Org-Id (mirrors the projects client). Honored
 *  server-side ONLY for a global admin; ignored for a normal user (owner-pinned),
 *  so stamping is always safe. */
function orgHeader(): Record<string, string> {
  const org = currentOrg();
  return org ? { 'X-Org-Id': org } : {};
}

// --- Defensive coercion (tolerate shape/casing drift from either surface) ---

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const bool = (v: unknown): boolean => v === true;
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;

function normalizeConnection(v: unknown): Connection | null {
  const c = obj(v);
  if (!c) return null;
  return {
    account: str(c.account ?? c.account_label ?? c.accountLabel),
    externalId: str(c.externalId ?? c.external_id),
    scopes: arr(c.scopes),
    connectedAt: str(c.connectedAt ?? c.connected_at),
  };
}

function normalizeProvider(v: unknown): Provider | null {
  const p = obj(v);
  if (!p) return null;
  const id = str(p.id ?? p.provider);
  if (!id) return null;
  return {
    id,
    name: str(p.name ?? p.title) || id,
    description: str(p.description ?? p.desc),
    category: str(p.category),
    available: bool(p.available ?? p.configured),
    connected: bool(p.connected),
    connection: normalizeConnection(p.connection ?? p.conn),
  };
}

/** Pull the provider array out of any of the envelope shapes cloud/console use. */
function providerRows(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const b = obj(body);
  if (!b) return [];
  for (const key of ['providers', 'data', 'items', 'rows'] as const) {
    if (Array.isArray(b[key])) return b[key] as unknown[];
  }
  return [];
}

async function readError(res: Response): Promise<string> {
  try {
    const b = (await res.json()) as Raw;
    return str(b.error ?? b.reason ?? b.msg) || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// --- API (matches console's IntegrationsApi: list / connect / disconnect) ---

/**
 * The org's connector catalog + connection status (`GET /v1/integrations`).
 * Returns BOTH available connectors and the org's live connections in one list.
 * Empty on any failure (unauthenticated, cloud unreachable, surface not yet
 * deployed) so the page degrades to an honest empty state — never a crash,
 * never fabricated rows.
 */
export async function fetchConnectors(): Promise<Provider[]> {
  try {
    // Bounded: a hung integrations upstream resolves to the empty state (via the
    // catch below) rather than spinning the connectors skeleton forever.
    const res = await fetch(BASE, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...orgHeader() },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const body = await res.json();
    return providerRows(body)
      .map(normalizeProvider)
      .filter((p): p is Provider => p !== null);
  } catch {
    return [];
  }
}

/**
 * Begin connecting a provider (`POST /v1/integrations/:id/connect`).
 *
 * OAuth providers return `{ authorizeUrl }` — the caller TOP-LEVEL-navigates there
 * (leaving hanzo.app for the provider's consent screen). The provider then
 * redirects to cloud's public, state-authed callback DIRECTLY (api.hanzo.ai), which
 * seals the token to KMS and lands the user back on the shared connectors surface
 * with `?connected=<id>`. Never throws: a failure resolves to `{ error }`.
 */
export async function connectProvider(id: string): Promise<ConnectResult> {
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/connect`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json', ...orgHeader() },
    });
    if (!res.ok) return { error: await readError(res) };
    const b = (await res.json()) as Raw;
    // Tolerate authorizeUrl / authorize_url / url (console normalizes the same).
    const url = str(b.authorizeUrl ?? b.authorize_url ?? b.url);
    return url ? { authorizeUrl: url } : { error: 'This connector is not available to connect yet.' };
  } catch {
    return { error: 'Connectors backend unreachable.' };
  }
}

/**
 * Disconnect a provider for this org (`POST /v1/integrations/:id/disconnect`).
 * Cloud revokes the token, deletes the KMS secrets, and removes the row
 * (idempotent). Never throws: a failure resolves to `{ ok: false, error }`.
 */
export async function disconnectProvider(id: string): Promise<DisconnectResult> {
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/disconnect`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json', ...orgHeader() },
    });
    if (!res.ok) return { ok: false, error: await readError(res) };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Connectors backend unreachable.' };
  }
}
