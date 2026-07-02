import type { NextRequest } from 'next/server';
import MY_TOKEN_KEY from '@/lib/get-cookie-name';

/**
 * Hanzo Cloud session binding — the SINGLE source of truth for "which bearer
 * bills this AI request against api.hanzo.ai".
 *
 * The builder's native AI runs entirely on Hanzo Cloud (api.hanzo.ai/v1, the
 * same unified gateway hanzo.chat uses). An authenticated user signs in via
 * hanzo.id (IAM SSO, see lib/hanzo/iam.ts); the OAuth callback stores their IAM
 * JWT in the httpOnly `hanzo_token` cookie (app/api/auth/callback/route.ts).
 *
 * That JWT is itself a valid gateway credential: api.hanzo.ai accepts it in
 * `Authorization: Bearer <jwt>` and debits the org named by the token's `owner`
 * claim (org == tenant). So forwarding the session JWT === correct per-tenant
 * billing automatically — no separate key to mint or store, no plaintext secret.
 *
 * Provider `hanzo` (lib/llm/providers/registry.ts) points at api.hanzo.ai/v1;
 * this module supplies its credential for logged-in users. An explicit client
 * key (BYO provider key) always wins; the session token is the zero-config
 * default so a signed-in user can build with AI immediately.
 */

/** Canonical Hanzo Cloud provider id — the api.hanzo.ai/v1 gateway. */
export const HANZO_CLOUD_PROVIDER = 'hanzo' as const;

/**
 * Resolve the logged-in user's Hanzo Cloud bearer from the request, or null
 * when the request is unauthenticated. Read-only: never mints, never falls back
 * to a shared key (callers decide the guest path).
 */
export function resolveCloudBearer(request: NextRequest): string | null {
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  return token && token.length > 0 ? token : null;
}
