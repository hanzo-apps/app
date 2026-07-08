/**
 * Base proxy — /api/base/*
 *
 * Forwards a generated app's data calls to the Hanzo Base backend, injecting
 * the signed-in user's Hanzo IAM token server-side. This is the public surface
 * a builder-generated app talks to:
 *
 *   fetch('/api/base/collections/todos/records')                 // list
 *   fetch('/api/base/collections/todos/records', { method:'POST', body })
 *
 * The path after /api/base maps to the Base REST API under /v1/*. Keeping the
 * token server-side means the browser never holds a Base credential and there
 * is no cross-origin call from the preview/deployed app.
 */

import { NextRequest, NextResponse } from "next/server";
import { baseUrl, isBaseConfigured } from "@/lib/base";
import { resolveIamToken } from "@/lib/base/server";
import { logger } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

// ALLOWLIST — the ONLY request headers forwarded upstream to Base. Everything
// else is DROPPED, in particular every identity header (X-Org-Id, X-User-*,
// X-Roles, and any legacy X-IAM-*/X-HANZO-* variant) and cookies. The signed-in
// identity travels SOLELY via the server-minted IAM Bearer set below, so Base
// derives the user/org from the validated JWT and NEVER from a client-supplied
// header — a builder-generated app (untrusted client) cannot spoof org/identity
// into the Base backend through this proxy. An allowlist (not a blocklist) means
// a newly-introduced forgeable header is dropped by default, not leaked.
const FORWARD_REQUEST_HEADERS = new Set([
  "content-type",
  "accept",
  "accept-language",
  "if-none-match",
  "if-modified-since",
]);

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
  const search = request.nextUrl.search;
  const upstream = `${baseUrl()}/v1/${path.map(encodeURIComponent).join("/")}${search}`;

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
    logger.error("[Base proxy] upstream error:", error);
    return NextResponse.json({ error: "Base backend unreachable." }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
