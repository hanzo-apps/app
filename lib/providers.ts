/**
 * Builder model catalog — Hanzo-native.
 *
 * The builder POSTs to the single Hanzo AI gateway (api.hanzo.ai/v1, an
 * OpenAI-compatible endpoint) via /v1/generate. The gateway owns ALL provider
 * routing (Zen/DO internal, BYOK, linked clouds, custom providers), so from the
 * app's point of view there is exactly ONE provider: `hanzo`. Model `value`s are
 * gateway model IDs.
 *
 * The picker list is FULLY DYNAMIC: /v1/models proxies the gateway's live
 * `GET /v1/models`, filters it to the Zen build ladder, and labels it — read on
 * the client via useModels(). This module owns only the *rules* for that shaping
 * (which ids are build models, how an id becomes a label) plus the offline
 * last-resort list. There is NO hand-maintained model catalog here — the gateway
 * is the source of truth.
 */

// One presentational shape for a selectable model, shared by the /v1/models
// route, the useModels() hook, and the picker components. One shape, one place.
export type ModelOption = {
  value: string; // gateway model id, e.g. "zen5-coder"
  label: string; // prettified id, e.g. "Zen 5 Coder"
  description?: string; // optional subtitle, passed through from the gateway
};

// The model the builder opens on when neither storage nor the gateway pick one.
export const DEFAULT_MODEL = "zen5-coder";

// One provider from the app's perspective: the Hanzo gateway.
export const PROVIDERS = {
  hanzo: {
    name: "Hanzo AI",
    max_tokens: 131_000,
    id: "hanzo",
  },
};

// Hyphen/underscore segments that mark a NON-build Zen surface: embeddings, ASR,
// TTS, the guard classifier and vision-only (vl) SKUs are separate products, not
// the code builder. `omni` (general multimodal chat) and the text/code ladder
// stay in.
const NON_BUILD_SEGMENTS = new Set([
  "embedding",
  "embeddings",
  "asr",
  "tts",
  "guard",
  "vl",
]);

// A build model is a Zen chat/code SKU: id starts with `zen` and carries none of
// the non-build segments. Pure rule — the LIST of ids stays dynamic (it comes
// from the gateway); this only decides membership.
export function isBuildModel(id: string): boolean {
  if (!id.startsWith("zen")) return false;
  return !id
    .toLowerCase()
    .split(/[-_]/)
    .some((seg) => NON_BUILD_SEGMENTS.has(seg));
}

// Prettify a gateway id into a human label: "zen5-coder" → "Zen 5 Coder",
// "zen3-omni" → "Zen 3 Omni". Pure derivation — no per-model table.
export function prettifyModelLabel(id: string): string {
  const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  return id
    .split(/[-_]/)
    .map((seg) => {
      const zen = /^zen(\d.*)$/.exec(seg);
      return zen ? `Zen ${cap(zen[1])}` : cap(seg);
    })
    .join(" ");
}

// Shape a gateway `GET /v1/models` `data[]` payload into the builder's dynamic
// picker list: keep only build models, label them, pass any description through.
// This is the single application of the catalog rules above.
export function buildModelsFrom(
  raw: Array<{ id?: string; description?: string }>
): ModelOption[] {
  return raw
    .filter(
      (m): m is { id: string; description?: string } =>
        typeof m.id === "string" && isBuildModel(m.id)
    )
    .map((m) => ({
      value: m.id,
      label: prettifyModelLabel(m.id),
      ...(m.description ? { description: m.description } : {}),
    }));
}

// OFFLINE LAST-RESORT ONLY. This is the sole hardcoded list, used solely when
// the live gateway list is unreachable — the server /v1/models offline path and
// the client useModels() fallback — so the picker never breaks. It is NOT the
// source of truth; the gateway is. Keep it to the current Zen 5 ladder.
export const FALLBACK_MODELS: ModelOption[] = [
  { value: "zen5-coder", label: "Zen 5 Coder" },
  { value: "zen5-flash", label: "Zen 5 Flash" },
  { value: "zen5", label: "Zen 5" },
  { value: "zen5-pro", label: "Zen 5 Pro" },
  { value: "zen5-max", label: "Zen 5 Max" },
  { value: "zen5-nano", label: "Zen 5 Nano" },
];
