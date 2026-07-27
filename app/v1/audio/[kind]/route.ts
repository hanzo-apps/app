/**
 * /v1/audio/transcriptions and /v1/audio/speech — the builder's ear and voice.
 *
 * The gateway already serves both, OpenAI-compatible and metered; this only
 * lends them the caller's IAM session so the browser never holds a gateway
 * token. Bodies pass through untouched (multipart in one direction, audio bytes
 * back in the other) — reshaping them here would be a second contract.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { session } from "@/lib/iam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

/** The two audio services. Anything else is not ours to proxy. */
const SERVICE = new Set(["transcriptions", "speech"]);

export async function POST(request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  if (!SERVICE.has(kind)) {
    return NextResponse.json({ error: "Unknown audio service." }, { status: 404 });
  }

  const token = (await session(request))?.token;
  if (!token) {
    return NextResponse.json({ error: "Log in to use your voice." }, { status: 401 });
  }

  const type = request.headers.get("content-type");
  const upstream = await fetch(`${HANZO_AI_BASE_URL}/audio/${kind}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(type ? { "Content-Type": type } : {}),
    },
    body: await request.arrayBuffer(),
    cache: "no-store",
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
