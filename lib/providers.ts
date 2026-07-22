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
// enso (Enso Pro) is the balanced default: the gateway routes each request to the
// best-fit model, so an easy edit bills cheap and only a hard one escalates. `enso`
// is already a build-ladder family and a FALLBACK_MODELS entry, so the picker lists
// it and resolveModelId keeps it (not a dead id).
// GATED — do not deploy until cleared: an earlier attempt to default the builder to
// Enso surfaced a raw "opus-4.8" upstream error, so go-live depends on Enso being
// served + brand-masked on api.hanzo.ai (ENSO_URL in ai) and on the enso-ultra
// preservation validation. A code builder may still prefer a coding-tuned default
// (zen5-coder → glm-5.2) — that is the product call to make at go-live.
export const DEFAULT_MODEL = "enso";

// The Hanzo gateway (api.hanzo.ai) serves the Zen/Enso ladder + connected
// providers AND — since DO GenAI funded the proprietary catalog — a CURATED set
// of modern Anthropic/OpenAI ids (`claude-*`, `gpt-4o`, `gpt-4.1`, `gpt-5*`,
// `gpt-*-codex`). Those are live; they must pass. What the gateway does NOT serve
// is the genuinely-dead legacy families that an OLDER build may have persisted in
// `localStorage["model"]`: the o1/o3 reasoning line, the davinci/cushman
// completion+codex models, gpt-3.x, and the pre-4o gpt-4 line. Sending one of
// those verbatim makes the gateway reply "model … is not available" and the empty
// stream surfaces as "The model didn't return a usable page." — editing appears
// broken. This is the ONE predicate for "a dead id we must never send", shared by
// the client model state (components/editor/ask-ai) and the server BFF
// (app/v1/generate). `auto` (smart routing) and every real gateway id pass through.
export const isDeadModelId = (id?: string | null): boolean =>
  !!id &&
  /^(o[13]($|-)|text-davinci|davinci|cushman|code-(davinci|cushman)|gpt-3|gpt-4($|-))/i.test(
    id.trim()
  );

// Coerce a possibly-stale/blank model id to a servable one. Used server-side to
// harden the BFF and client-side to sanitize a persisted selection on read.
export const resolveModelId = (id?: string | null): string => {
  const m = (id ?? "").trim();
  return !m || isDeadModelId(m) ? DEFAULT_MODEL : m;
};

// Smart routing sentinel. Sent as the `model` to the gateway, it means "route
// this request to the best/cheapest capable model" — the gateway decides per
// request and bills as what actually served. It is a VALUE of `model`, not a
// separate flag: the /usage toggle and the builder picker are two views over
// this one persisted value, so an explicit concrete pick always wins over auto.
export const AUTO_MODEL = "auto";

// Whether smart routing is on for a given persisted model value. Empty/unset is
// treated as auto so a fresh session opens in smart routing (the default).
export const isSmartRouting = (model?: string | null): boolean =>
  !model || model === AUTO_MODEL;

// Public docs for the routing behaviour, linked from the toggle.
export const ROUTING_DOCS_URL = "https://docs.hanzo.ai/docs/usage/routing";

// Server-driven org routing policy, surfaced by the `/v1/routing-defaults`
// proxy (which fetches cloud-api `GET /v1/router/defaults`).
// `autoRoutingActive` gates whether the org permits smart routing at all;
// `defaultSessionRouting` is the org's default for a NEW session when the user
// has expressed no explicit override.
export type RoutingDefaults = {
  autoRoutingActive: boolean;
  defaultSessionRouting: boolean;
};

// Effective smart-routing state for a NEW session.
export type SmartRoutingState = {
  enabled: boolean; // routing on for a fresh session/conversation
  toggleDisabled: boolean; // org disallows routing → hide/disable the toggle
};

// Resolve the effective smart-routing state for a NEW session — the ONE place
// the precedence lives (mirrored, not shared, across chat/app/console).
//
// `localPref` is the user's explicit override: true = on, false = off, null =
// never touched (follow the org default). `defaults` is the server-driven org
// policy, or null when unknown (older cloud-api / fetch failed).
//
// Fail-soft: with no org policy, behave exactly as before — the user's local
// preference alone, defaulting to on (smart routing was the prior default).
// When the org disables routing, the toggle is off and locked regardless of any
// local preference. Otherwise the user's override wins, else the org default.
export function resolveSmartRouting(
  localPref: boolean | null,
  defaults: RoutingDefaults | null
): SmartRoutingState {
  if (!defaults) {
    return { enabled: localPref ?? true, toggleDisabled: false };
  }
  if (!defaults.autoRoutingActive) {
    return { enabled: false, toggleDisabled: true };
  }
  return {
    enabled: localPref ?? defaults.defaultSessionRouting,
    toggleDisabled: false,
  };
}

// One provider from the app's perspective: the Hanzo gateway.
export const PROVIDERS = {
  hanzo: {
    name: "Hanzo AI",
    max_tokens: 131_000,
    id: "hanzo",
  },
};

// Hyphen/underscore segments that mark a NON-build surface — separate products,
// not the code builder: embeddings, ASR, the guard classifier, vision-only (vl),
// and the whole GENERATIVE-MEDIA family (image / video / music / voice / foley /
// audio) + reranking / moderation. The builder is a TEXT/code tool, so only the
// chat/code ladder (zen5, zen5-coder, enso, …) should appear in its picker —
// `omni` (general multimodal chat) stays in.
const NON_BUILD_SEGMENTS = new Set([
  "embedding",
  "embeddings",
  "embed",
  "asr",
  "tts",
  "guard",
  "vl",
  // generative media — not code
  "image",
  "video",
  "music",
  "voice",
  "foley",
  "audio",
  "speech",
  "tale",
  // utility
  "rerank",
  "reranker",
  "moderation",
]);

// Build-model FAMILIES: the house Zen/Enso ladder (Enso is Hanzo's proprietary
// frontier family, the current default) PLUS the third-party chat/code brands the
// gateway now resells by real name — Anthropic Claude and OpenAI GPT (served via
// DO GenAI). A build model starts with one of these family prefixes, is not a
// dead legacy id, and carries none of the non-build segments (embeddings / ASR /
// generative-media / rerank). Pure rule — the LIST of ids stays dynamic (it comes
// from the gateway); this only decides membership.
const BUILD_FAMILY_PREFIXES = ["zen", "enso", "claude", "gpt"];

export function isBuildModel(id: string): boolean {
  if (isDeadModelId(id)) return false;
  const lower = id.toLowerCase();
  if (!BUILD_FAMILY_PREFIXES.some((p) => lower.startsWith(p))) return false;
  return !lower.split(/[-_]/).some((seg) => NON_BUILD_SEGMENTS.has(seg));
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
  { value: "enso", label: "Enso" },
  { value: "zen5-flash", label: "Zen 5 Flash" },
  { value: "zen5", label: "Zen 5" },
  { value: "zen5-pro", label: "Zen 5 Pro" },
  { value: "zen5-max", label: "Zen 5 Max" },
  { value: "zen5-nano", label: "Zen 5 Nano" },
  // Frontier third-party tiers now resold through the gateway (DO GenAI funded).
  { value: "claude-opus-4.8", label: "Claude Opus 4.8" },
  { value: "gpt-5.2", label: "GPT 5.2" },
];
