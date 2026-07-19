/**
 * Connectors client — a THIN consumer of the ONE shared connector store.
 *
 * A "connector" is an org-scoped connection to an external provider (Slack,
 * GitHub, Google, …): the org connects a resource ONCE and it's available across
 * every Hanzo surface (console, chat, app builder) and usable by the built apps.
 * The canonical store lives in cloud (`hanzoai/cloud clients/integrations`) and
 * is exposed at `/v1/integrations` — the SAME endpoint console.hanzo.ai reads.
 * hanzo.app is just another consumer: it hits its own same-origin `/v1/
 * integrations` BFF, which forwards the user's IAM bearer; cloud derives the
 * tenant from the bearer's `owner` claim (org-scoping is server-side and
 * authoritative — the browser never picks its own tenant).
 *
 * Wire shape mirrors console (`console/src/lib/api/integrations.ts`) exactly, so
 * the two surfaces stay one contract. No icon on the wire — derived from `id`.
 */

export interface Connection {
  account: string;
  externalId: string;
  scopes: string[];
  connectedAt: string;
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  category: string;
  /** App creds configured on this deployment → Connect is live. */
  available: boolean;
  /** This org has an active connection. */
  connected: boolean;
  connection: Connection | null;
}

/** Defensive normalization — cloud may envelope the list under various keys. */
function providerRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    for (const key of ['providers', 'data', 'items', 'rows', 'integrations']) {
      if (Array.isArray(o[key])) return o[key] as unknown[];
    }
  }
  return [];
}

function toProvider(row: unknown): Provider | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const id = String(o.id ?? o.provider ?? '').trim();
  if (!id) return null;
  const conn = o.connection && typeof o.connection === 'object' ? (o.connection as Record<string, unknown>) : null;
  return {
    id,
    name: String(o.name ?? id),
    description: String(o.description ?? ''),
    category: String(o.category ?? 'Integration'),
    available: o.available === true,
    connected: o.connected === true,
    connection: conn
      ? {
          account: String(conn.account ?? ''),
          externalId: String(conn.externalId ?? conn.external_id ?? ''),
          scopes: Array.isArray(conn.scopes) ? conn.scopes.map(String) : [],
          connectedAt: String(conn.connectedAt ?? conn.connected_at ?? ''),
        }
      : null,
  };
}

/** List the org's connectors (connected + available-to-connect). */
export async function listConnectors(): Promise<Provider[]> {
  const res = await fetch('/v1/integrations', { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    // 401 (signed out) / 502 (backend down) / 404 (endpoint not deployed) → the
    // page renders an honest empty/needs-auth state; never fabricate a list.
    throw new Error(`integrations ${res.status}`);
  }
  return providerRows(await res.json())
    .map(toProvider)
    .filter((p): p is Provider => p !== null);
}

/** Begin an OAuth connect: cloud returns an authorize URL to top-level-navigate. */
export async function connect(id: string): Promise<string> {
  const res = await fetch(`/v1/integrations/${encodeURIComponent(id)}/connect`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`connect ${res.status}`);
  const data = (await res.json()) as { authorizeUrl?: string };
  if (!data.authorizeUrl) throw new Error('no authorize url');
  return data.authorizeUrl;
}

/** Revoke + clear the org's connection to a provider (keeps the provider row). */
export async function disconnect(id: string): Promise<void> {
  const res = await fetch(`/v1/integrations/${encodeURIComponent(id)}/disconnect`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`disconnect ${res.status}`);
}
