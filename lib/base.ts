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

/** The Base instance URL (no trailing slash). Single source of truth. */
export function baseUrl(): string {
  return BASE_URL.replace(/\/+$/, "");
}

/**
 * Whether a Base data plane is available. Defaults true (the in-cluster
 * companion); set HANZO_BASE_URL="" to explicitly disable Base features.
 */
export function isBaseConfigured(): boolean {
  return baseUrl().length > 0;
}

/**
 * A Base client acting as the signed-in user, carrying their hanzo.id IAM
 * token. BaseClient sends `authStore.token` verbatim as the Authorization
 * header, and Base wants `Bearer <jwt>`.
 */
export function baseAs(iamToken: string): BaseClient {
  const client = new BaseClient(baseUrl());
  client.authStore.save(`Bearer ${iamToken}`, null);
  return client;
}

/**
 * Service identity for SCHEMA operations (collection provisioning).
 *
 * Why this exists — the decomplection of DATA vs SCHEMA:
 *   • DATA (record CRUD) runs as the signed-in user (`baseAs`) so Base's
 *     per-user rules (`@request.auth.id`) isolate each builder's records.
 *   • SCHEMA (creating/listing collections) requires admin authority. Hanzo
 *     Base 1.x (`apis/middlewares.go` resolveJWKSToken) only binds a JWT to
 *     the `_superusers` collection — and thus past `RequireSuperuserAuth()` —
 *     when the token claims `isAdmin`/`isGlobalAdmin` or `owner ∈
 *     {built-in,superuser}`. A non-admin builder's own JWT is bound to
 *     `users`, so provisioning under it 401s. Provisioning therefore runs as
 *     a dedicated service identity that carries an admin claim.
 *
 * The service identity is a hanzo.id account whose token is minted here via
 * the OAuth2 password grant against the canonical IAM token endpoint, using
 * KMS-sourced credentials injected as env (NEVER hard-coded, NEVER in the
 * client bundle — server-only). The token is cached until shortly before it
 * expires.
 */
const IAM_URL = (
  process.env.IAM_URL ||
  process.env.NEXT_PUBLIC_HANZO_IAM_URL ||
  "https://hanzo.id"
).replace(/\/+$/, "");

// Canonical HIP-0111 token endpoint (no legacy /oauth/*, no /api/).
const IAM_TOKEN_URL = `${IAM_URL}/v1/iam/oauth/token`;

interface CachedToken {
  token: string;
  /** epoch ms after which the token must be refreshed */
  expiresAt: number;
}
let serviceTokenCache: CachedToken | null = null;

/** Service-account credentials, sourced from KMS via env. */
function serviceCreds():
  | { email: string; password: string; clientId: string; clientSecret: string }
  | null {
  const email = process.env.HANZO_APP_BASE_SVC_EMAIL;
  const password = process.env.HANZO_APP_BASE_SVC_PASSWORD;
  const clientId = process.env.IAM_CLIENT_ID;
  const clientSecret = process.env.IAM_CLIENT_SECRET;
  if (!email || !password || !clientId || !clientSecret) return null;
  return { email, password, clientId, clientSecret };
}

/**
 * Whether a service identity is configured for schema provisioning. When
 * false, callers fall back to the signed-in user (works for admin builders,
 * 401s for non-admins — see baseClientForProvisioning).
 */
export function isServiceIdentityConfigured(): boolean {
  return serviceCreds() !== null;
}

/** Decode a JWT's `exp` (seconds) without verifying — only to schedule refresh. */
function jwtExpiryMs(jwt: string): number | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Mint (and cache) a service IAM access token via the password grant. Returns
 * null when no service credentials are configured.
 */
async function getServiceIamToken(): Promise<string | null> {
  const creds = serviceCreds();
  if (!creds) return null;

  const now = Date.now();
  if (serviceTokenCache && serviceTokenCache.expiresAt > now + 60_000) {
    return serviceTokenCache.token;
  }

  const res = await fetch(IAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      username: creds.email,
      password: creds.password,
      scope: "openid profile email",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`service IAM token grant failed: ${res.status} ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("service IAM token grant returned no access_token");
  }

  const token = data.access_token;
  const expFromJwt = jwtExpiryMs(token);
  const expFromGrant = data.expires_in ? now + data.expires_in * 1000 : null;
  // Prefer the JWT's own exp; fall back to expires_in; floor at 5 min.
  const expiresAt = expFromJwt ?? expFromGrant ?? now + 5 * 60_000;

  serviceTokenCache = { token, expiresAt };
  return token;
}

/**
 * A Base client acting as the SERVICE identity (admin), for schema/collection
 * provisioning. Returns null when no service credentials are configured so
 * callers can fall back to the signed-in user.
 */
export async function baseAsService(): Promise<BaseClient | null> {
  const token = await getServiceIamToken();
  if (!token) return null;
  return baseAs(token);
}
