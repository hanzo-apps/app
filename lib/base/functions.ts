/**
 * Provision a generated app's runtime functions.
 *
 * Base is ONE backend with several tiers. `provision.ts` is the tier that
 * STORES (a declared schema becomes collections); this is the tier that RUNS
 * (declared handlers become functions that execute).
 *
 * The runtime is Hanzo Functions — `/v1/functions` on the cloud gateway. Source
 * is held per org, executed in the platform sandbox, and metered through the one
 * cloud meter. It is the same product the landing page names, reached over the
 * same lane publish already uses: the caller's IAM bearer, org derived upstream
 * from that bearer's claim. Nothing here chooses a tenant.
 *
 * A project groups its functions under `namespace` (its slug). Namespace is a
 * grouping label, NOT a boundary — the registry isolates on the org — so this
 * qualifies a name, it does not protect one.
 *
 * Additive and idempotent: the registry upserts by name, so re-publishing an app
 * redeploys its handlers instead of duplicating them.
 */

/** A handler as the generated app declares it (BackendFeatures.edgeFunctions). */
export interface FunctionDef {
  name: string;
  code: string;
  /** Closed set the registry accepts; anything else is refused upstream. */
  runtime?: 'node' | 'python' | 'go' | 'deno' | 'bash';
  handler?: string;
  /** Per-invocation deadline in seconds. The registry defaults to 30, ceiling 900. */
  timeoutSec?: number;
}

export interface ProvisionFunctionsResult {
  deployed: string[];
  failed: Array<{ name: string; error: string }>;
}

/** The registry's own name rule, so a bad name fails here instead of upstream. */
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** Names the registry reserves for its own collection routes. */
const RESERVED = new Set(['metrics', 'triggers', 'deployments', 'secrets']);

/** The registry's source ceiling. Larger is refused upstream; refuse it here. */
const MAX_CODE = 256 * 1024;

/** Reject a handler the registry would reject, with the reason it would give. */
export function checkFunction(fn: FunctionDef): string | null {
  const name = (fn.name || '').trim();
  if (!name) return 'name is required';
  if (RESERVED.has(name.toLowerCase())) return 'name is reserved';
  if (!NAME.test(name)) return 'name must match ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$';
  if (!fn.code?.trim()) return 'code is required';
  if (fn.code.length > MAX_CODE) return 'code too large';
  return null;
}

/**
 * Deploy `defs` into the caller's function registry, grouped under `project`.
 *
 * `send` is the one authorized call into the cloud gateway — the caller owns
 * bearer and base URL, so this file holds no credential and picks no tenant.
 * Each handler is reported by name: deployed, or failed with the upstream
 * reason. A failure is never rewritten as success.
 */
export async function provisionFunctions(
  send: (path: string, init: { method: string; body: string }) => Promise<Response>,
  project: string,
  defs: FunctionDef[],
): Promise<ProvisionFunctionsResult> {
  const result: ProvisionFunctionsResult = { deployed: [], failed: [] };

  for (const def of defs) {
    const invalid = checkFunction(def);
    if (invalid) {
      result.failed.push({ name: def.name || '(unnamed)', error: invalid });
      continue;
    }
    try {
      const res = await send('/v1/functions', {
        method: 'POST',
        body: JSON.stringify({
          name: def.name.trim(),
          namespace: project,
          runtime: def.runtime || 'node',
          code: def.code,
          ...(def.handler ? { handler: def.handler } : {}),
          ...(def.timeoutSec ? { timeoutSec: def.timeoutSec } : {}),
        }),
      });
      if (!res.ok) {
        // The upstream reason, not a generic one: "code too large" and "unsupported
        // runtime" are different problems for whoever has to fix the app.
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        result.failed.push({ name: def.name, error: body.error || `registry returned ${res.status}` });
        continue;
      }
      result.deployed.push(def.name);
    } catch (err) {
      result.failed.push({ name: def.name, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return result;
}
