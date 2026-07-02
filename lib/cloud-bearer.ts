import type { NextRequest } from "next/server";

/**
 * The ONE server-side Hanzo cloud bearer source (HIP-0111).
 *
 * Identity in this app is owned end-to-end by the `@hanzo/iam` SDK: it runs the
 * OAuth2 PKCE flow, stores the access token, forwards it as
 * `Authorization: Bearer` on `/api/*` calls (see `lib/api.ts`), and mirrors it
 * into the `hanzo_token` cookie (see `IamClientProvider`) so edge middleware and
 * server route handlers can read the same token. This resolver reads that single
 * source — header first, then the mirrored cookie — so every server route that
 * calls a user-scoped Hanzo backend (api.hanzo.ai, commerce, …) bills the
 * signed-in user's org. No second flow, no shared provider keys.
 *
 * `HANZO_API_KEY` is an OPTIONAL self-host / local-dev fallback, injected from
 * KMS (never hardcoded, never committed). In hosted hanzo.app it is unset, so a
 * user IAM token is required.
 */
const TOKEN_COOKIE = "hanzo_token";

export function resolveCloudBearer(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth) {
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    if (token) return token;
  }

  const cookie = req.cookies.get(TOKEN_COOKIE)?.value;
  if (cookie) return cookie;

  return process.env.HANZO_API_KEY || null;
}
