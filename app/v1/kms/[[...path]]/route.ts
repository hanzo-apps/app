/**
 * /v1/kms[/...] — the org-scoped secret BFF.
 *
 * Surface (proxied verbatim to cloud /v1/kms):
 *   GET /v1/kms/secrets    the org's secret metadata — `{ names, secrets: [{ name,
 *                          path, env, scheme }], total }`. Metadata, never plaintext.
 *
 * READ ONLY, and read of NAMES only. Writing, rotating and revealing a value are
 * not exported here: a builder panel answers "which credentials exist", which is
 * the whole question it has. A value has exactly one reader and this is not it.
 *
 * The forward carries the CALLER'S own bearer (lib/org/bff), never a service
 * credential, so this route can reach nothing the caller could not already reach
 * — it grants no authority, it only saves a round trip to another origin.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

export const GET = bffRoutes({ prefix: '/v1/kms' }).GET;
