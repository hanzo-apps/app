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
import { baseAs, isBaseConfigured } from "@/lib/base";

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
