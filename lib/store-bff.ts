// BFF glue: resolve the per-request store binding (org + storeId + currency +
// auth) server-side, then map commerce errors to HTTP responses. The org is
// NEVER taken from client input — it comes from the store config (Base row by
// space_id) or the deployment env — so a shopper cannot swap tenants.

import "server-only";
import { NextResponse } from "next/server";
import { resolveIamToken } from "@/lib/base/server";
import { resolveStoreConfig, type StoreConfig } from "@/lib/store-config";
import { CommerceError, type StoreBinding } from "@/lib/store";

export interface ResolvedBinding {
  binding: StoreBinding;
  config: StoreConfig;
}

/**
 * Resolve the store binding for the current request. `spaceId` (optional) picks
 * a specific project's config; otherwise the env-configured first-party store
 * is used. The merchant's IAM token (if signed in) is forwarded to commerce as
 * the storefront read auth (path a); lib/store falls back to the KMS-injected
 * per-org storefront key (path b) when no session is present.
 */
export async function resolveBinding(
  spaceId?: string,
): Promise<ResolvedBinding | null> {
  const token = await resolveIamToken();
  const config = await resolveStoreConfig(token, spaceId);
  if (!config) return null;
  return {
    binding: {
      org: config.org,
      storeId: config.storefront.store_id,
      currency: config.storefront.currency,
      token,
    },
    config,
  };
}

/** Standard "store not configured" response (honest, not a fake catalog). */
export function notConfigured() {
  return NextResponse.json(
    {
      error: "store_not_configured",
      message:
        "This project is not bound to a store. Set a store config (org + mode) to become a store.",
    },
    { status: 409 },
  );
}

/** Map a thrown error to a JSON response, preserving commerce status codes. */
export function commerceErrorResponse(e: unknown) {
  if (e instanceof CommerceError) {
    // 401 from commerce means the storefront needs a Published token (path b)
    // or a signed-in merchant (path a). Surface it honestly.
    return NextResponse.json(
      { error: "commerce_error", status: e.status, message: e.message },
      { status: e.status === 401 ? 401 : e.status >= 500 ? 502 : e.status },
    );
  }
  const message = e instanceof Error ? e.message : "Unknown error";
  return NextResponse.json({ error: "internal_error", message }, { status: 500 });
}
