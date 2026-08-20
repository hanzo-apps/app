/**
 * Connectors client — the ONE browser client for the org-scoped connector surface.
 *
 * "Connectors" is the canonical product AND endpoint name — the only one. This
 * talks to the SAME-ORIGIN `/v1/connectors` BFF (app/v1/connectors/[[...path]]),
 * which forwards to cloud's `/v1/connectors` as the signed-in user. Cloud derives the
 * org from the bearer `owner` claim (gateway-minted `X-Org-Id`), so every
 * connection is org-scoped — and the IAM token is NEVER read by
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

// --- Types (cloud clients/connectors providerView + connectionView) ---

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
/**
 * HOW a connector is connected — the one thing that genuinely differs between
 * the two halves of the catalog.
 *
 * `oauth` sends the browser to the provider and comes back with a code.
 * `credential` cannot: WhatsApp, a carrier SMS account and SMTP hand you a token
 * (or a host and a password) in a dashboard, with no consent screen and nothing
 * to come back from. Cloud publishes this so no client keeps its own list of
 * which providers are which.
 */
export type ConnectorKind = 'oauth' | 'credential';

/** One input a credential connector asks for. The form is rendered from the
 *  catalog, so adding a connector never edits a UI. */
export interface ConnectorField {
  name: string;
  label: string;
  /** Sealed into KMS and never read back — render as a password input. */
  secret: boolean;
  required: boolean;
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Credentials configured on this deployment (the connector can be used).
   *  Always true for a credential connector: the org pastes its own account, so
   *  there is no deployment credential that could be missing. */
  available: boolean;
  /** This org has an active connection. */
  connected: boolean;
  connection: Connection | null;
  /** Which connect leg this provider takes. Defaults to `oauth`, so a cloud that
   *  does not publish the field yet keeps its current meaning. */
  kind: ConnectorKind;
  /** The form a credential connector needs; empty for oauth. */
  fields: ConnectorField[];
}

/** The connect result. An oauth connect answers with a consent URL to
 *  top-level-navigate to; a credential connect has already finished by the time
 *  it replies, and says so. */
export interface ConnectResult {
  authorizeUrl?: string;
  connected?: boolean;
  account?: string;
  error?: string;
}

export interface DisconnectResult {
  ok: boolean;
  error?: string;
}

// --- Transport (same-origin BFF; the httpOnly cookie carries auth) ---

const BASE = '/v1/connectors';

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

/** Turn a provider snake into Title Case: "github" → "GitHub", "google_drive"
 *  → "Google Drive". A raw id like "github:hanzo-app" reads as a bug in the UI. */
function providerName(provider: string, label: string): string {
  const known: Record<string, string> = { github: 'GitHub', gitlab: 'GitLab', google: 'Google', slack: 'Slack', notion: 'Notion', linear: 'Linear', figma: 'Figma' };
  const base = known[provider] ?? provider.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return label ? `${base} · ${label}` : base;
}

function normalizeProvider(v: unknown): Provider | null {
  const p = obj(v);
  if (!p) return null;
  const id = str(p.id ?? p.provider);
  if (!id) return null;
  // The live surface returns flat CONNECTION rows (id/provider/label/account/
  // connectedAt at the top level), not catalog entries with a nested
  // `connection`. A row that carries a connectedAt or an account IS a live
  // connection — read the row itself as the connection, and name it from the
  // provider + label so the card says "GitHub · hanzo-app", never
  // "github:hanzo-app". Catalog rows (nested `connection`, explicit `connected`)
  // still work — this only ADDS the flat case.
  const provider = str(p.provider) || id.split(':')[0];
  const label = str(p.label);
  const flatConn = normalizeConnection(p);
  const isLive = bool(p.connected) || !!str(p.connectedAt ?? p.connected_at) || !!str(p.account);
  return {
    id,
    name: str(p.name ?? p.title) || providerName(provider, label),
    description: str(p.description ?? p.desc),
    category: str(p.category),
    available: bool(p.available ?? p.configured) || isLive,
    connected: isLive,
    connection: normalizeConnection(p.connection ?? p.conn) ?? (isLive ? flatConn : null),
    // Anything that is not the credential kind reads as oauth — the safe
    // default, because an oauth connect navigates whereas an unrecognised value
    // would render a form with no fields in it.
    kind: str(p.kind) === 'credential' ? 'credential' : 'oauth',
    fields: normalizeFields(p.fields),
  };
}

/** Field rows, tolerant of a missing or garbage list: a connector whose form
 *  cannot be read renders as having none rather than throwing the page away. */
function normalizeFields(v: unknown): ConnectorField[] {
  if (!Array.isArray(v)) return [];
  const out: ConnectorField[] = [];
  for (const raw of v) {
    const f = obj(raw);
    if (!f) continue;
    const name = str(f.name);
    if (!name) continue; // could not be submitted under any key
    out.push({
      name,
      label: str(f.label) || name,
      secret: bool(f.secret),
      required: bool(f.required),
    });
  }
  return out;
}

/** Pull the provider array out of any of the envelope shapes cloud/console use.
 *
 * `connectors` is FIRST and it is load-bearing: the live cloud surface answers
 * `{ connectors: [...] }`, and every key here missing that name meant a
 * workspace with real connected orgs (github:hanzo-app, …) rendered "No
 * connectors available yet" — the connections were fetched and then dropped on
 * the floor by an envelope reader that did not know the envelope. */
function providerRows(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const b = obj(body);
  if (!b) return [];
  for (const key of ['connectors', 'providers', 'data', 'items', 'rows'] as const) {
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
 * The org's connector catalog + connection status (`GET /v1/connectors`).
 * Returns BOTH available connectors and the org's live connections in one list.
 * Empty on any failure (unauthenticated, cloud unreachable, surface not yet
 * deployed) so the page degrades to an honest empty state — never a crash,
 * never fabricated rows.
 */
export async function fetchConnectors(): Promise<Provider[]> {
  try {
    const res = await fetch(BASE, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...orgHeader() },
    });
    if (!res.ok) return [];
    return normalizeProviders(await res.json());
  } catch {
    return [];
  }
}

/**
 * Read a catalog response into provider cards. Pure, so it is testable without
 * a network — and EXPORTED for that reason, the way console exports its twin.
 * These two normalizers are the pair this file's header says mirror each other;
 * that is only checkable if both can be called.
 */
export function normalizeProviders(body: unknown): Provider[] {
  return providerRows(body)
    .map(normalizeProvider)
    .filter((p): p is Provider => p !== null);
}

/**
 * Begin connecting a provider (`POST /v1/connectors/:id/connect`).
 *
 * OAuth providers return `{ authorizeUrl }` — the caller TOP-LEVEL-navigates there
 * (leaving hanzo.app for the provider's consent screen). The provider then
 * redirects to cloud's public, state-authed callback DIRECTLY (api.hanzo.ai), which
 * seals the token to KMS and lands the user back on the shared connectors surface
 * with `?connected=<id>`. Never throws: a failure resolves to `{ error }`.
 */
export async function connectProvider(
  id: string,
  values?: Record<string, string>,
): Promise<ConnectResult> {
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/connect`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(values ? { 'Content-Type': 'application/json' } : {}),
        ...orgHeader(),
      },
      // A credential connect sends the pasted fields; an oauth connect sends
      // nothing. ONE route, one method — what differs is the body.
      ...(values ? { body: JSON.stringify(values) } : {}),
    });
    if (!res.ok) return { error: await readError(res) };
    const b = (await res.json()) as Raw;
    // A credential connect is already DONE when it replies: it verified the
    // credentials against the provider and sealed them, so there is no URL to
    // follow and `connected` is the answer.
    if (bool(b.connected)) return { connected: true, account: str(b.account) };
    // Tolerate authorizeUrl / authorize_url / url (console normalizes the same).
    const url = str(b.authorizeUrl ?? b.authorize_url ?? b.url);
    return url ? { authorizeUrl: url } : { error: 'This connector is not available to connect yet.' };
  } catch {
    return { error: 'Connectors backend unreachable.' };
  }
}

/**
 * Disconnect a provider for this org (`POST /v1/connectors/:id/disconnect`).
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
