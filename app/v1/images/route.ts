/**
 * /v1/images — the builder's text-to-image BFF.
 *
 * Symmetric to /v1/generate: the builder POSTs a prompt and this forwards it to
 * the single Hanzo AI gateway (`${HANZO_AI_BASE_URL}/images/generations`,
 * OpenAI-compatible) as the signed-in user (their `hanzo_token` IAM bearer). The
 * gateway owns provider sourcing and MimeType — nothing is re-implemented here.
 *
 * Auth is per-user (BYOK-style): no signed-in user → honest 401 "Sign in to
 * build". We do NOT fall back to a shared server key — image generation is
 * metered per-user by the gateway, exactly like /v1/generate.
 *
 * The response is the gateway's OpenAI images JSON verbatim
 * ({ created, data: [{ url } | { b64_json }] }); the caller pushes the image
 * into the builder's existing image pipeline (persist → embed as <img>).
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { requireSameOrigin } from "@/lib/org/csrf";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

// Zen-brand default image model. The gateway maps it to the actual diffusion
// backend; the upstream is never named here or surfaced to the client.
const DEFAULT_IMAGE_MODEL = "zen3-image";

const unauthorized = () =>
  NextResponse.json(
    { ok: false, openLogin: true, message: "Sign in to build" },
    { status: 401 }
  );

export async function POST(request: NextRequest) {
  // CSRF: cookie-authenticated + spends AI credit for the org — refuse a
  // cross-origin POST before doing any work.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const prompt: string | undefined = body?.prompt;
  if (!prompt || !prompt.trim()) {
    return NextResponse.json(
      { ok: false, message: "Missing prompt" },
      { status: 400 }
    );
  }

  const gateway = await fetch(`${HANZO_AI_BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: body?.model || DEFAULT_IMAGE_MODEL,
      prompt: prompt.trim(),
      n: 1,
      size: body?.size || "1024x1024",
    }),
  });

  if (!gateway.ok) {
    const detail = await gateway.text().catch(() => "");
    if (gateway.status === 401 || gateway.status === 403) return unauthorized();
    return NextResponse.json(
      {
        ok: false,
        message: detail || `Gateway error (${gateway.status}) while generating.`,
      },
      { status: 502 }
    );
  }

  const data = await gateway.json().catch(() => null);
  const first = data?.data?.[0];
  if (!first || (!first.url && !first.b64_json)) {
    return NextResponse.json(
      { ok: false, message: "The gateway returned no image." },
      { status: 502 }
    );
  }

  // Normalize to base64 SERVER-side: if the gateway returned a hosted URL, fetch
  // the bytes here (no browser CORS, and the upstream CDN host never reaches the
  // client) and hand the caller a self-contained b64 image it can persist to the
  // project's own storage as a durable Hanzo-hosted asset.
  let b64: string | undefined = first.b64_json;
  let mime = "image/png";
  if (!b64 && first.url) {
    try {
      const img = await fetch(first.url);
      if (!img.ok) throw new Error(`fetch image ${img.status}`);
      mime = img.headers.get("content-type") || "image/png";
      const buf = Buffer.from(await img.arrayBuffer());
      b64 = buf.toString("base64");
    } catch {
      return NextResponse.json(
        { ok: false, message: "Could not retrieve the generated image." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true, b64_json: b64, mime_type: mime });
}
