/**
 * The command catalog — every operation the cloud answers, for the ⌘K bar.
 *
 * Upstream is `GET api.hanzo.ai/v1/commands`: the fifth projection of the one
 * route table that already produces the REST routes, the OpenAPI document, the
 * MCP tools and the `hanzo` CLI. Nothing here curates it — the bar shows what the
 * API has, or the bar is a second list that drifts.
 *
 * It is proxied rather than fetched from the browser for two reasons and neither
 * is auth (the endpoint is unauthenticated by design — a client has to be able to
 * read the contract before it holds a credential, and a list of operation names
 * grants nothing):
 *
 *   - Origin. Every other call the palette makes is same-origin, so the catalog
 *     is too, and the bar never depends on a CORS header we do not control.
 *   - Cache. The list is immutable for a cloud release, so it is asked for once
 *     per release and served from the CDN and the browser after that.
 *
 * The endpoint ships with the next cloud release. Until then this answers 502 and
 * the bar simply has no Run group — see hooks/useCommands, which treats that as
 * "no commands", never as an error worth interrupting anyone with.
 */
import { NextResponse } from "next/server";

/**
 * Where the catalog lives. `HANZO_AI_BASE_URL` is the app's existing name for the
 * cloud's /v1 root (lib/builds.ts) and is reused rather than joined by a second
 * one — two env vars naming one host is how a deployment ends up pointing half
 * its calls somewhere else.
 */
const UPSTREAM = `${process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1"}/commands`;

// A cloud release changes the list; nothing else can. An hour is short enough
// that a release reaches the bar the same morning and long enough that opening
// ⌘K is free after the first time in a session.
const MAX_AGE = 3600;

/**
 * One copy per process, not one per request.
 *
 * This used to ask for `next: { revalidate: MAX_AGE }`, which holds the body in
 * Next's DATA CACHE — and that cache refuses anything over 2MB. The catalog
 * passed that long ago (2,487 operations, 2.6MB measured against production),
 * so the write failed on EVERY request. Nothing surfaced but a log line, and
 * the "asked for once per release" this whole file is built around silently
 * never happened: every render re-fetched the entire catalog from the cloud.
 *
 * A module-level copy is the scope the data cache was being asked for in the
 * first place — one per instance, for MAX_AGE — and it has no size limit to
 * outgrow. `no-store` keeps Next from re-attempting the write we know fails.
 */
let held: { at: number; body: string } | null = null;
let inflight: Promise<string> | null = null;

const fresh = () => held && Date.now() - held.at < MAX_AGE * 1000;

async function fetchCatalog(): Promise<string> {
  const upstream = await fetch(UPSTREAM, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  // Thrown, not returned: the caller tells "unreachable" from "unavailable" by
  // the shape of the failure, and a status is the only thing that separates them.
  if (!upstream.ok) throw Object.assign(new Error("catalog"), { status: upstream.status });
  const body = await upstream.text();
  held = { at: Date.now(), body };
  return body;
}

export async function GET() {
  let body: string;
  if (fresh()) {
    body = held!.body;
  } else {
    try {
      // One fetch serves every request that arrives while it is in flight —
      // otherwise an expiry under load pulls 2.6MB once per concurrent render.
      inflight ??= fetchCatalog();
      body = await inflight;
    } catch (e) {
      const status = (e as { status?: number }).status;
      // Pass the upstream's own status through rather than inventing one: a 404
      // here means the deployed cloud predates the endpoint, which is a different
      // fact from the service being down, and the bar reads both as "no commands".
      return status
        ? NextResponse.json({ error: "command catalog unavailable" }, { status })
        : NextResponse.json({ error: "command catalog unreachable" }, { status: 502 });
    } finally {
      inflight = null;
    }
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${MAX_AGE}, stale-while-revalidate=86400`,
    },
  });
}
