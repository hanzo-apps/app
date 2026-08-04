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
// This is the ONE place the default lives; no page, component or env var
// restates it.
//
// WHY NOT `enso`, THE HOUSE FAMILY. It cannot build. zen's identity injection
// appended Hanzo's identity prompt to the END of the conversation, after the
// user's turn, and a model reads the final turn as the thing to continue — so
// every enso rung answered a "build me a page" request by reciting its own
// identity prompt instead. Measured against this exact builder system prompt:
// enso and enso-flash returned prose and no HTML, enso-ultra 502'd, while
// claude-opus-4.8 and gpt-5.2 returned correct multi-page HTML from the
// identical request. A default that cannot produce a page is not a default.
//
// The root cause is FIXED in hanzoai/zen (withIdentity now places the identity
// as the last SYSTEM turn, ahead of the user's). THIS LINE GOES BACK TO `enso`
// once the enso image carries that fix and a build verifies — the house family
// is the intended default, and it costs less than a resold frontier tier.
//
// The rule this applies is the one already written for FALLBACK_MODELS: a model
// that cannot serve is worse than one that is absent. That goes double for the
// default, which is what everyone who never opens the picker gets.
export const DEFAULT_MODEL = "claude-opus-4.8";

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
// With no org policy the fresh session opens on DEFAULT_MODEL, not on `auto`.
// `auto` used to win this slot, which meant the default model was never the
// thing a new user saw — the composer said "Auto" and DEFAULT_MODEL was dead
// text. Two answers to "what runs my prompt?"; the model default is the one the
// product states, so it wins. `auto` survives as an explicit pick and as an org
// policy (`defaultSessionRouting`) — it is a different router (ai's own
// cross-family one), not a second spelling of Enso.
// When the org disables routing, the toggle is off and locked regardless of any
// local preference. Otherwise the user's override wins, else the org default.
export function resolveSmartRouting(
  localPref: boolean | null,
  defaults: RoutingDefaults | null
): SmartRoutingState {
  if (!defaults) {
    return { enabled: localPref ?? false, toggleDisabled: false };
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
// source of truth; the gateway is. It MUST carry DEFAULT_MODEL: the offline path
// returns DEFAULT_MODEL verbatim, so a default missing from this list would name
// a model the picker cannot show.
//
// EVERY ENTRY IS VERIFIED AGAINST THE LIVE GATEWAY (`GET /v1/models`). The rule
// was already written here for `enso-pro` — "a picker entry that cannot serve is
// worse than an absent one" — and then not applied to the rest of the list: the
// six `zen5-*` rungs were offered for a family the gateway does not carry a
// single id of. Picking one sent a dead id, and the empty result read as the
// model misbehaving rather than as a model that does not exist.
//
// The enso rungs are the three the family service serves (enso.enso.svc:8080).
// `enso-pro` stays deliberately absent: ai synthesizes a listing entry for it
// from a pin (`controllers/zen_client.go` ensoFam.pins) but the family has no
// such SKU. When the Zen 5 ladder is actually served, add it back here.
export const FALLBACK_MODELS: ModelOption[] = [
  { value: "enso", label: "Enso" },
  { value: "enso-flash", label: "Enso Flash" },
  { value: "enso-ultra", label: "Enso Ultra" },
  // Frontier third-party tiers resold through the gateway (DO GenAI funded).
  { value: "claude-opus-4.8", label: "Claude Opus 4.8" },
  { value: "gpt-5.2", label: "GPT 5.2" },
];
