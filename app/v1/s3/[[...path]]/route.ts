/**
 * /v1/s3[/...] — the org-scoped object-store BFF.
 *
 * Surface (proxied verbatim to cloud /v1/s3, the same file-manager plane the
 * console's Storage module reads):
 *   GET /v1/s3/buckets                       the org's buckets
 *   GET /v1/s3/buckets/:bucket/objects       one bucket's objects
 *
 * READ ONLY. Creating a bucket, uploading and deleting are the console's, and a
 * verb this route does not export is a verb this surface does not offer.
 *
 * The org is pinned server-side from the bearer's owner claim, so a caller sees
 * its own tenant's namespace and can neither name nor widen it.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

export const GET = bffRoutes({ prefix: '/v1/s3' }).GET;
