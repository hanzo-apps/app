// Store config — how a hanzo.app project declares "become a store", per
// universe/docs/architecture/hanzo-app-cloud-integration.md §4.
//
// One project, one store config, one org (org == tenant). Stored as a Base row
// in the `store_configs` collection keyed by the project's `space_id`, so it
// travels with the project and is per-org by construction. It holds NO secrets
// — Square creds stay in commerce/KMS; the storefront authenticates to commerce
// as the org (see lib/store.ts).
//
// For a single deployed first-party storefront (the maxpower first slice), the
// binding may also come from the deployment environment (HANZO_STORE_ORG etc.).
// Resolution is ONE function: an explicit space_id config wins; otherwise the
// env-configured store; otherwise "not configured" (honest, never faked).

import "server-only";
import { baseAs, isBaseConfigured } from "@/lib/base";

export type StoreMode = "ecommerce" | "b2c" | "b2b";

export interface StoreSubsystems {
  commerce: boolean;
  payments: "square"; // the only processor — never Stripe
  base: boolean;
  iam_customers: boolean;
  search: boolean;
  analytics: boolean;
}

// `type` (not `interface`) so these satisfy the BaseClient generic's
// `BaseRecord` constraint — only type-alias object literals get the implicit
// string index signature (same pattern as lib/db/history.ts).
export type StoreConfig = {
  /** The project this configures ("namespace/repoId"). Optional for env store. */
  space_id?: string;
  /** The binding — IAM owner claim; authoritative. */
  org: string;
  mode: StoreMode;
  subsystems: StoreSubsystems;
  storefront: {
    store_id: string;
    currency: string;
    domain?: string;
  };
};

type StoreConfigRow = StoreConfig & {
  id: string;
};

const COLLECTION = "store_configs";

const DEFAULT_SUBSYSTEMS: StoreSubsystems = {
  commerce: true,
  payments: "square",
  base: true,
  iam_customers: true,
  search: true,
  analytics: true,
};

/** Escape single quotes for a Base filter literal. */
const lit = (s: string) => s.replace(/'/g, "\\'");

/**
 * The env-configured store binding for the deployed first-party storefront.
 * Returns null when no org is configured (the store is honestly not set up).
 */
export function envStoreConfig(): StoreConfig | null {
  const org = (process.env.HANZO_STORE_ORG || "").trim();
  if (!org) return null;
  return {
    org,
    mode: (process.env.HANZO_STORE_MODE as StoreMode) || "ecommerce",
    subsystems: DEFAULT_SUBSYSTEMS,
    storefront: {
      store_id: (process.env.HANZO_STORE_ID || "default").trim(),
      currency: (process.env.HANZO_STORE_CURRENCY || "USD").trim().toUpperCase(),
      domain: process.env.HANZO_STORE_DOMAIN || undefined,
    },
  };
}

/**
 * Read a project's store config from Base by space_id, acting as the caller.
 * Returns null when Base is unconfigured or the row is absent.
 */
export async function getStoreConfig(
  token: string,
  spaceId: string,
): Promise<StoreConfig | null> {
  if (!isBaseConfigured()) return null;
  try {
    const row = await baseAs(token)
      .collection(COLLECTION)
      .getFirstListItem<StoreConfigRow>(`space_id='${lit(spaceId)}'`);
    return row;
  } catch {
    return null; // not found
  }
}

/**
 * Resolve the binding for a request: an explicit project config (by space_id)
 * wins; otherwise the env-configured first-party store; otherwise null.
 */
export async function resolveStoreConfig(
  token: string | undefined,
  spaceId?: string,
): Promise<StoreConfig | null> {
  if (spaceId && token) {
    const cfg = await getStoreConfig(token, spaceId);
    if (cfg) return cfg;
  }
  return envStoreConfig();
}

/**
 * Create or update a project's store config (the "become a store" switch).
 * Admin-of-the-org only — enforced by Base/IAM on the write. `org` is the
 * authoritative binding and must equal the caller's IAM owner claim.
 */
export async function upsertStoreConfig(
  token: string,
  config: StoreConfig,
): Promise<StoreConfig> {
  if (!config.space_id) {
    throw new Error("space_id is required to persist a store config");
  }
  const coll = baseAs(token).collection(COLLECTION);
  const existing = await getStoreConfig(token, config.space_id);
  const payload = {
    space_id: config.space_id,
    org: config.org,
    mode: config.mode,
    subsystems: config.subsystems,
    storefront: config.storefront,
  };
  if (existing && (existing as StoreConfigRow).id) {
    return coll.update<StoreConfigRow>((existing as StoreConfigRow).id, payload);
  }
  return coll.create<StoreConfigRow>(payload);
}

export { DEFAULT_SUBSYSTEMS };
