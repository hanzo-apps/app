/**
 * /v1/analytics/overview — the org's web analytics KPIs, from cloud's analytics
 * read surface (org derived server-side from the validated bearer; tenancy is
 * cloud's, never asserted here). A STATIC segment, so it wins over the sibling
 * [deploymentId] dynamic route — that one belongs to the retired deployment
 * lane and reads a local store this surface does not touch.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

const h = bffRoutes({ prefix: '/v1/analytics/overview' });
export const GET = h.GET;
