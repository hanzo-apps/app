/**
 * Server-side Base helpers for generated-app data access.
 *
 * Resolves the caller's Hanzo IAM token and hands back a @hanzo/base client
 * (lib/base.ts baseAs) acting as that user. Used by the /api/base/* proxy and
 * the project provisioning route.
 */

import "server-only";
import { headers } from "next/headers";
import type { BaseClient } from "@hanzo/base";
import { baseAs, isBaseConfigured } from "@/lib/base";
import { session } from "@/lib/iam";

/**
 * The VERIFIED IAM token for the current request, if any. Same one reader as
 * every other server path — a token that does not verify is not a token.
 */
export async function resolveIamToken(): Promise<string | undefined> {
  return (await session({ headers: await headers() }))?.token || undefined;
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
