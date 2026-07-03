/**
 * /v1/models — Hanzo-native, fully dynamic model discovery for the builder.
 *
 * Proxies the single Hanzo AI gateway's OpenAI-compatible `GET /v1/models`,
 * filters it to the Zen build ladder and labels it (rules live in
 * `@/lib/providers`). The gateway's provider registry owns which models are
 * reachable (Zen/DO internal, BYOK, linked clouds, custom providers), so the
 * builder never fans out to per-provider APIs — it asks the gateway once.
 *
 * Contract: this is a non-sensitive discovery endpoint that ALWAYS returns a
 * usable list (HTTP 200) so the picker never breaks. When the live gateway list
 * is unavailable — no session, gateway error, or an empty result — it returns
 * the offline `FALLBACK_MODELS` with `fallback: true`. Auth/tenancy is enforced
 * where it matters, at generation time (/v1/generate), not here.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DEFAULT_MODEL, FALLBACK_MODELS, buildModelsFrom } from "@/lib/providers";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";

const HANZO_AI_BASE_URL =
  process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

// The offline/last-resort payload. `fallback: true` tells the client this is the
// hardcoded ladder, not the live gateway list; `no-store` so the client retries
// the live list on the next mount once the gateway recovers.
function offline() {
  return NextResponse.json(
    {
      ok: true,
      fallback: true,
      defaultModel: DEFAULT_MODEL,
      models: FALLBACK_MODELS,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

type GatewayModels = {
  data?: Array<{ id?: string; description?: string }>;
  default_model?: string;
  default?: string;
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) return offline();

  let data: GatewayModels;
  try {
    // Per-user, authorized request — never share across users in Next's data
    // cache. The client is throttled by the response Cache-Control below.
    const gateway = await fetch(`${HANZO_AI_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!gateway.ok) return offline();
    data = (await gateway.json()) as GatewayModels;
  } catch {
    return offline();
  }

  const models = buildModelsFrom(data.data ?? []);
  if (models.length === 0) return offline();

  // Always resolve to a model that is actually in the list the client will see:
  // prefer a gateway-specified default, else our DEFAULT_MODEL, else the first.
  const listed = new Set(models.map((m) => m.value));
  const gatewayDefault = data.default_model ?? data.default;
  const defaultModel =
    gatewayDefault && listed.has(gatewayDefault)
      ? gatewayDefault
      : listed.has(DEFAULT_MODEL)
        ? DEFAULT_MODEL
        : models[0].value;

  // Per-user list → private, 5-min browser cache so it is not re-fetched on
  // every keystroke while the picker is open.
  return NextResponse.json(
    { ok: true, fallback: false, defaultModel, models },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
