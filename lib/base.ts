import { BaseClient } from "@hanzo/base";

/**
 * Hanzo Base data plane for hanzo.app — one client, one way.
 *
 * `hanzo-app-base` is IAM-native: it validates the caller's hanzo.id JWT
 * against hanzo.id JWKS (the same IdP hanzo.app already authenticates against).
 * The server forwards the signed-in user's IAM access token; per-user
 * isolation is enforced by the caller scoping every query to the user's `sub`.
 * SQLite-backed — the only data plane, no mongo / pg / kv.
 *
 * Uses the @hanzo/base core client (BaseClient) — no compat layer.
 */
const BASE_URL =
  process.env.HANZO_BASE_URL || "http://hanzo-app-base.hanzo.svc:8090";

/**
 * A Base client acting as the signed-in user, carrying their hanzo.id IAM
 * token. BaseClient sends `authStore.token` verbatim as the Authorization
 * header, and Base wants `Bearer <jwt>`.
 */
export function baseAs(iamToken: string): BaseClient {
  const client = new BaseClient(BASE_URL);
  client.authStore.save(`Bearer ${iamToken}`, null);
  return client;
}
