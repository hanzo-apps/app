/**
 * /v1/edit/config — the widget's runtime configuration.
 *
 * `public/edit.js` is a STATIC asset served byte-identically to every Hanzo
 * property, so anything that varies by environment, or that must be rotatable
 * without a redeploy of every site, cannot live inside it. That is exactly the
 * Insights ingest key: it reaches the browser either way (it is a publishable,
 * write-only capability — the same class as a Stripe `pk_`), but sourcing it from
 * the environment keeps it out of git in a PUBLIC repo and lets a rotation take
 * effect on the next cache expiry instead of the next deploy of forty sites.
 *
 * PUBLIC and CACHEABLE by design: no bearer is read, no per-caller state is
 * returned, and the response is identical for everyone — so the CDN answers
 * almost all of it and the fleet costs hanzo.app roughly one request per edge per
 * five minutes. Absent `INSIGHTS_INGEST_KEY` the lane reports `enabled:false`,
 * the widget records nothing, and no page is any worse off — replay stays a
 * capability the environment grants, never one the client assumes.
 */
import type { NextRequest } from 'next/server';

import { preflight, withCors } from '@/lib/edit/cors';

export const runtime = 'nodejs';
// Env-derived: never prerendered into the build output.
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const key = (process.env.INSIGHTS_INGEST_KEY || '').trim();
  const host = (process.env.INSIGHTS_HOST || 'https://insights.hanzo.ai').replace(/\/+$/, '');

  // A sample rate is how replay volume gets governed centrally: one env change
  // throttles the whole fleet, no site redeploys.
  const rawRate = Number.parseFloat(process.env.INSIGHTS_REPLAY_SAMPLE_RATE || '1');
  const sampleRate = Number.isFinite(rawRate) ? Math.min(1, Math.max(0, rawRate)) : 1;

  const res = withCors(origin, {
    insights: {
      // No key configured ⇒ the lane is simply not on. Fail CLOSED, and say so
      // plainly rather than shipping a half-configured recorder.
      enabled: Boolean(key) && sampleRate > 0,
      host,
      key,
      sampleRate,
    },
  });
  // Short enough that a rotation or a kill-switch lands within minutes;
  // long enough that the fleet does not stampede hanzo.app.
  res.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  return res;
}
