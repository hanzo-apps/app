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

// Hop-by-hop / sensitive headers we must not forward upstream.
const STRIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "authorization",
  "cookie",
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
    if (!STRIP_REQUEST_HEADERS.has(key.toLowerCase())) fwdHeaders.set(key, value);
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
