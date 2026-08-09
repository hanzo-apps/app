/**
 * /v1/analytics/top — the behavior lenses (topPages/topReferrers/topSources
 * over the events lens, plus top models/products), org-scoped by cloud from
 * the validated bearer. Static segment beside overview; same shape.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

const h = bffRoutes({ prefix: '/v1/analytics/top' });
export const GET = h.GET;
