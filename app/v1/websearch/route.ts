/**
 * /v1/websearch — hanzo.app's native web search, proxying cloud's
 * `GET /v1/websearch/search` (the SearXNG-shaped, Hanzo-operated keyless
 * meta-search; the SAME surface hanzo.chat's web_search tool uses).
 *
 * Auth mirrors cloud's two ONE-WAY-equivalent doors exactly:
 *   1. the signed-in user's own bearer → cloud's validated-principal path;
 *   2. else the shared service key `WEBSEARCH_API_KEY` as `X-API-Key`
 *      (server-to-server; the key never reaches the browser).
 * Neither present → honest 503, never an open proxy.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { session } from "@/lib/iam";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

/** The SearXNG /search?format=json envelope subset cloud returns. */
type UpstreamResults = {
  results?: Array<{
    url?: string;
    title?: string;
    content?: string;
    img_src?: string;
  }>;
};

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ ok: false, error: "missing q" }, { status: 400 });
  }

  const caller = await session(request);
  const key = (process.env.WEBSEARCH_API_KEY ?? "").trim();
  const headers: Record<string, string> = {};
  if (caller?.token) {
    headers.Authorization = `Bearer ${caller.token}`;
  } else if (key) {
    headers["X-API-Key"] = key;
  } else {
    return NextResponse.json(
      { ok: false, error: "web search not configured" },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(
      `${HANZO_AI_BASE_URL}/websearch/search?q=${encodeURIComponent(q)}`,
      { headers, cache: "no-store" },
    );
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: `search failed (${upstream.status})` },
        { status: 502 },
      );
    }
    const data = (await upstream.json()) as UpstreamResults;
    const results = (data.results ?? [])
      .filter((r) => typeof r?.url === "string" && r.url)
      .slice(0, 8)
      .map((r) => ({
        url: r.url as string,
        title: (r.title ?? "").trim() || (r.url as string),
        snippet: (r.content ?? "").trim(),
      }));
    return NextResponse.json(
      { ok: true, query: q, results },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "search unreachable" },
      { status: 502 },
    );
  }
}
