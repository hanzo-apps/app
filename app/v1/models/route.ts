/**
 * /v1/models — Hanzo-native, fully dynamic model discovery for the builder.
 *
 * Proxies the single Hanzo AI gateway's OpenAI-compatible `GET /v1/models`,
 * then names, groups and de-duplicates it (rules live in `@/lib/providers`).
 * The gateway's provider registry owns which models are reachable (Zen/DO
 * internal, BYOK, linked clouds, custom providers), so the builder never fans
 * out to per-provider APIs — it asks the gateway once.
 *
 * SHAPING HAPPENS HERE, ONCE. The gateway states an id and an owner; a family,
 * a display name and a brand mark are this app's decisions, so they are made in
 * one place on the way through rather than re-derived by every picker that
 * renders the list. Clients receive rows they can draw without interpreting.
 *
 * Contract: this is a non-sensitive discovery endpoint that ALWAYS returns a
 * usable list (HTTP 200) so the picker never breaks. When the live gateway list
 * is unavailable — no session, gateway error, or an empty result — it returns
 * the offline `FALLBACK_MODELS` with `fallback: true`. Auth/tenancy is enforced
 * where it matters, at generation time (/v1/generate), not here.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { FREE_MODEL } from "@hanzo/ai";

import {
  DEFAULT_MODEL,
  FALLBACK_MODELS,
  buildModelsFrom,
  type GatewayModel,
  type ModelOption,
} from "@/lib/providers";
import { spendable } from "@/lib/billing/server";
import { session } from "@/lib/iam";

/**
 * Move the free model to the front. Every paid rung keeps its place behind it —
 * the list a caller cannot pay for yet is still the list they will grow into,
 * so this reorders and never trims.
 */
function leadFree(models: ModelOption[]): ModelOption[] {
  return [
    ...models.filter((m) => m.value === FREE_MODEL),
    ...models.filter((m) => m.value !== FREE_MODEL),
  ];
}

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
  data?: GatewayModel[];
  default_model?: string;
  default?: string;
};

export async function GET(request: NextRequest) {
  const token = (await session(request))?.token;
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

  // Which model a caller opens on turns on whether the gate will charge them.
  // That refusal is decided by the BALANCE, not by the plan: an account with
  // credit and no subscription may call priced models, and an account with a
  // subscription and no credit may not. So the balance is what predicts it.
  //
  // A balance that could not be READ is not a spent-out one. Only a known zero
  // counts, otherwise a moment's trouble reading the ledger would open everyone
  // on the free model.
  const balance = await spendable(token);
  const spent = balance.state === "ok" && balance.cents <= 0;

  // Always resolve to a model that is actually in the list the client will see:
  // a spent-out caller opens on the free one, else a gateway-specified default,
  // else our DEFAULT_MODEL, else the first.
  const listed = new Set(models.map((m) => m.value));
  const openFree = spent && listed.has(FREE_MODEL);
  const gatewayDefault = data.default_model ?? data.default;
  const defaultModel = openFree
    ? FREE_MODEL
    : gatewayDefault && listed.has(gatewayDefault)
      ? gatewayDefault
      : listed.has(DEFAULT_MODEL)
        ? DEFAULT_MODEL
        : models[0].value;

  // Per-user list → private, 5-min browser cache so it is not re-fetched on
  // every keystroke while the picker is open.
  return NextResponse.json(
    {
      ok: true,
      fallback: false,
      defaultModel,
      models: openFree ? leadFree(models) : models,
    },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
