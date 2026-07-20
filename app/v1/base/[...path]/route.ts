/**
 * Base data API — /v1/base/<collection>[/<id>][/...]
 *
 * The canonical, collection-centric data surface a Hanzo-built app talks to
 * (replaces the legacy /api/base/collections/<name>/records proxy — no /api/
 * prefix, no /collections/ boilerplate):
 *
 *   GET    /v1/base/todos                 // list records of the `todos` collection
 *   POST   /v1/base/todos        {json}   // create
 *   GET    /v1/base/todos/<id>            // one record
 *   PATCH  /v1/base/todos/<id>   {json}   // update
 *   DELETE /v1/base/todos/<id>            // delete
 *
 * `<collection>[/rest]` maps to Base `/v1/collections/<collection>/records[/rest]`.
 * The signed-in Hanzo identity is injected SERVER-SIDE (the httpOnly `hanzo_token`
 * cookie → a Bearer the Base backend validates against hanzo.id JWKS), so the
 * browser never holds a Base credential and org/tenant scoping is derived from the
 * verified JWT — never from a client-supplied header.
 */

import { NextRequest, NextResponse } from "next/server";
import { baseUrl, isBaseConfigured } from "@/lib/base";
import { resolveIamToken } from "@/lib/base/server";
import { logger } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

// ALLOWLIST — the ONLY request headers forwarded upstream to Base. Every identity
// header (X-Org-Id, X-User-*, cookies, any legacy X-IAM-*/X-HANZO-*) is DROPPED;
// identity travels SOLELY via the server-minted IAM Bearer below, so an untrusted
// generated app cannot spoof org/identity into Base through this proxy. Allowlist
// (not blocklist) → a newly-introduced forgeable header is dropped by default.
const FORWARD_REQUEST_HEADERS = new Set([
  "content-type",
  "accept",
  "accept-language",
  "if-none-match",
  "if-modified-since",
]);

/** Map `<collection>[/rest...]` → Base `collections/<collection>/records[/rest...]`. */
function toRecordsPath(path: string[]): string | null {
  const collection = (path[0] || "").trim();
  if (!collection) return null;
  const rest = path.slice(1).map(encodeURIComponent);
  return ["collections", encodeURIComponent(collection), "records", ...rest].join("/");
}

async function handle(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  if (!isBaseConfigured()) {
    return NextResponse.json(
      { error: "Base backend is not configured for this deployment." },
      { status: 503 },
    );
  }

  const token = await resolveIamToken();
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required. Sign in with Hanzo to use the backend." },
      { status: 401 },
    );
  }

  const { path } = await params;
  const recordsPath = toRecordsPath(path);
  if (!recordsPath) {
    return NextResponse.json({ error: "A collection name is required: /v1/base/<collection>" }, { status: 400 });
  }
  const search = request.nextUrl.search;
  const upstream = `${baseUrl()}/v1/${recordsPath}${search}`;

  const fwdHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (FORWARD_REQUEST_HEADERS.has(key.toLowerCase())) fwdHeaders.set(key, value);
  });
  fwdHeaders.set("Authorization", `Bearer ${token}`);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const res = await fetch(upstream, {
      method,
      headers: fwdHeaders,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);

    return new NextResponse(res.body, { status: res.status, headers: responseHeaders });
  } catch (error) {
    logger.error("[/v1/base] upstream error:", error);
    return NextResponse.json({ error: "Base backend unreachable." }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
