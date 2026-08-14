import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@hanzo/iam/server';

/**
 * What a request COSTS us, and therefore which budget it draws from.
 *
 * Cost, not audience. A signed-in dashboard GET and an anonymous landing GET
 * are both a document read and both cheap; a POST that calls a model is
 * expensive whoever sends it. Naming the tiers after cost is what keeps the
 * classification honest when a new route shows up.
 */
export type Tier = 'read' | 'api' | 'auth' | 'ai' | 'payment';

export interface Budget {
  windowMs: number;
  max: number;
}

/**
 * READS ARE LOOSE ON PURPOSE, and that is the whole fix.
 *
 * One navigation is not one request: Next fetches the document, then an RSC
 * payload per segment, then a prefetch for every link the pointer crosses — a
 * project grid emits dozens before the page has settled. At 200/min the
 * limiter refused people for *browsing*, which is very nearly the only thing
 * it ever did. An in-memory per-instance counter cannot stop a distributed
 * flood anyway; what it can protect is our own upstreams, and a document read
 * does not touch them.
 *
 * The expensive tiers stay exactly as tight as they were. Nothing here buys
 * headroom for a model call or a charge.
 */
const BUDGETS: Record<Tier, Budget> = {
  read: { windowMs: 60_000, max: 1000 },
  api: { windowMs: 60_000, max: 60 },
  auth: { windowMs: 15 * 60_000, max: 100 },
  ai: { windowMs: 60_000, max: 30 },
  payment: { windowMs: 60 * 60_000, max: 20 },
};

// Model calls. Expensive whatever the verb, so the path decides before the
// method does — today all of them are writes (/v1/generate is POST PATCH PUT),
// so this changes nothing now and stays right if a streaming GET ever lands.
//
// `/v1/agents/runs` is the MOST expensive call the app makes and it was in the
// cheapest tier — a generic `api` 60/min, because it simply was not listed. One
// of those is up to 24 model turns AND arbitrary commands in a sandbox pod, so
// the endpoint that can cost the most per call was allowed twice the calls of
// single-shot `/v1/generate`. It is listed exactly, not as `/v1/agents`: the
// registry underneath that prefix is polled for session state and fleet views,
// and sweeping it into a 30/min model budget would rate-limit watching a run.
//
// One spelling per route. The `/api/…` twin of each of these named nothing —
// `app/api` does not exist and every handler lives under `app/v1` — so the
// tables described a second URL shape this app has never served. A budget
// listed twice is a budget nobody can state, and the dead half is the one that
// looks like the answer when a route is later read from the wrong list.
const MODEL = ['/v1/generate', '/v1/images', '/v1/agents/runs'];
const CREDENTIAL = ['/v1/auth'];
const CHARGE = ['/v1/commerce', '/v1/crypto/payment'];

const under = (path: string, roots: string[]): boolean =>
  roots.some((root) => path === root || path.startsWith(root + '/'));

/** The ONE classification. Pure in its two arguments, so a test can state it. */
export function classify(method: string, path: string): Tier {
  if (under(path, MODEL)) return 'ai';
  if (method === 'GET' || method === 'HEAD') return 'read';
  if (under(path, CREDENTIAL)) return 'auth';
  if (under(path, CHARGE)) return 'payment';
  return 'api';
}

/**
 * The subject a request's token CLAIMS, for bucketing only.
 *
 * Deliberately not `lib/iam.ts`: this runs in the edge middleware on every
 * request, and a rate-limit bucket is not an authorization decision — the
 * worst a forged `sub` buys is a different bucket, which sending no token at
 * all already does. Identity is verified per request, later, in lib/iam.ts.
 */
export function subjectOf(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  const tok =
    (auth && /^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, '') : null) ||
    req.cookies.get(SESSION_COOKIE)?.value;
  const payload = tok?.split('.')[1];
  if (!payload) return null;
  try {
    const sub = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).sub;
    return typeof sub === 'string' && sub ? sub : null;
  } catch {
    return null;
  }
}

/**
 * WHOSE budget this is: the subject when the request carries a session, the
 * address only when it does not.
 *
 * An address is the wrong owner for signed-in traffic. Behind an office NAT —
 * or behind the shared cluster ingress — an entire floor arrives as one
 * address, so one heavy user spends everybody's budget and a busy room 429s
 * itself. The subject is stable across a token refresh, so it also closes the
 * hole a token-keyed bucket left open: re-minting handed you a fresh budget.
 *
 * Unauthenticated traffic still falls back to the address, which is the right
 * owner for the one case that matters there — a credential-stuffing run has no
 * session to key on.
 */
function principal(req: NextRequest): string {
  const sub = subjectOf(req);
  if (sub) return `user:${sub}`;
  const forwarded = req.headers.get('x-forwarded-for');
  const address =
    forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  return `ip:${address}`;
}

export interface Verdict {
  tier: Tier;
  allowed: boolean;
  max: number;
  /** Left AFTER this request. Zero when refused. */
  remaining: number;
  /** Epoch ms at which the window rolls over. */
  reset: number;
}

// Fixed-window counters. Per-instance by construction: a distributed limiter
// would go through Hanzo KV, never Redis.
const counters = new Map<string, { count: number; reset: number }>();

const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of counters.entries()) {
    if (entry.reset < now) counters.delete(key);
  }
}, 60_000);
// Node keeps the loop alive for a bare interval, which hangs jest and any
// script that imports this. Edge runtime has no unref, hence the guard.
(sweep as unknown as { unref?: () => void }).unref?.();

/**
 * Draw one unit from `key`'s budget.
 *
 * The key MUST carry its tier. Every tier used to share one `rate-limit:<ip>`
 * counter, so the 200/min the middleware spent on page views was withdrawn
 * from the same balance as the 20/hour payment budget: browse twenty pages and
 * you could not check out for an hour. Namespacing is the entire fix, and it
 * is why the tier is part of the key rather than a lookup beside it.
 */
export function consume(key: string, budget: Budget): Omit<Verdict, 'tier'> {
  const now = Date.now();
  let entry = counters.get(key);

  if (!entry || entry.reset < now) {
    entry = { count: 0, reset: now + budget.windowMs };
    counters.set(key, entry);
  }

  const allowed = entry.count < budget.max;
  if (allowed) entry.count++;

  return {
    allowed,
    max: budget.max,
    // AFTER the increment. Reporting it before meant the header promised one
    // more request than the caller actually had.
    remaining: Math.max(0, budget.max - entry.count),
    reset: entry.reset,
  };
}

/** Classify, key, and draw — the ONE entry point the middleware calls. */
export function limit(req: NextRequest): Verdict {
  const tier = classify(req.method, req.nextUrl.pathname);
  return { tier, ...consume(`${tier}:${principal(req)}`, BUDGETS[tier]) };
}

/**
 * The verdict as wire headers — one map for both outcomes, so a pass and a
 * refusal can never describe the same budget differently.
 *
 * `X-RateLimit-Reset` is epoch SECONDS (the de-facto convention); the two
 * copies this replaces disagreed, one emitting an ISO string and the other
 * epoch milliseconds. `Retry-After` is delta-seconds, present only on a
 * refusal and never below 1 — a `Retry-After: 0` invites an instant retry into
 * the same wall.
 */
export function headers(verdict: Verdict): Record<string, string> {
  const wire: Record<string, string> = {
    'X-RateLimit-Limit': String(verdict.max),
    'X-RateLimit-Remaining': String(verdict.remaining),
    'X-RateLimit-Reset': String(Math.ceil(verdict.reset / 1000)),
  };
  if (!verdict.allowed) {
    wire['Retry-After'] = String(
      Math.max(1, Math.ceil((verdict.reset - Date.now()) / 1000)),
    );
  }
  return wire;
}
