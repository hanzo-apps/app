/**
 * Server-side Base helpers for generated-app data access.
 *
 * Resolves the caller's Hanzo IAM token and hands back a @hanzo/base client
 * (lib/base.ts baseAs) acting as that user. Used by the /api/base/* proxy and
 * the project provisioning route.
 */

import "server-only";
import { cookies, headers } from "next/headers";
import type { BaseClient } from "@hanzo/base";
import { baseAs, baseAsService, isBaseConfigured } from "@/lib/base";

const COOKIE_NAME = "hanzo_token";

/** Extract the raw IAM access token from the current request, if present. */
export async function resolveIamToken(): Promise<string | undefined> {
  const h = await headers();
  const authHeader = h.get("authorization") || h.get("Authorization");
  if (authHeader) {
    return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  }
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Build a Base client for the current request. Returns null when Base is
 * unconfigured or the request is unauthenticated, so callers can map those to
 * 503 / 401 respectively.
 */
export async function baseClientForRequest(): Promise<BaseClient | null> {
  if (!isBaseConfigured()) return null;
  const token = await resolveIamToken();
  if (!token) return null;
  return baseAs(token);
}

/**
 * Build a Base client for SCHEMA provisioning (creating/listing collections).
 *
 * Prefers the service identity (admin) so any signed-in builder — including
 * non-admins — can provision a backend; collection management requires
 * `_superusers` authority in Base 1.x and the end-user JWT lacks it. Falls
 * back to the signed-in user when no service identity is configured, which
 * still works for admin builders and preserves the prior behavior with no
 * regression.
 *
 * Returns null when Base is unconfigured (→ 503) or, in the fallback path,
 * when the request is unauthenticated (→ 401).
 */
export async function baseClientForProvisioning(): Promise<BaseClient | null> {
  if (!isBaseConfigured()) return null;
  const svc = await baseAsService();
  if (svc) return svc;
  // No service identity configured — fall back to the caller's own token.
  const token = await resolveIamToken();
  if (!token) return null;
  return baseAs(token);
}
