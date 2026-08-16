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
 * `GET /v1/models`, keeps the chat models, and names and groups them — read on
 * the client via useModels(). This module owns only the *rules* for that shaping
 * (which ids are conversation models, what family each belongs to, how an id
 * becomes a display name) plus the offline last-resort list. There is NO
 * hand-maintained model catalog here — the gateway is the source of truth.
 */

// One presentational shape for a selectable model, shared by the /v1/models
// route, the useModels() hook, and the picker components. One shape, one place.
//
// `family` is the FAMILY KEY (see FAMILIES) — the picker groups by it and looks
// up the brand mark by it. It is derived server-side precisely once, so no
// client re-derives a family from an id string.
export type ModelOption = {
  value: string; // gateway model id, e.g. "claude-opus-4.8"
  label: string; // display name, e.g. "Claude Opus 4.8"
  family: string; // family key, e.g. "claude" — groups the list, keys the mark
  description?: string; // optional subtitle, passed through from the gateway
  premium?: boolean; // gateway `premium` flag → the ✦ marker
  context?: number; // context window in tokens → the "200K" suffix
};

// The model the builder opens on when neither storage nor the gateway pick one.
// This is the ONE place the default lives; no page, component or env var
// restates it.
//
// `enso`, THE HOUSE FAMILY, is the default — the intended one, and it costs less
// than a resold frontier tier.
//
// It was held on `anthropic-claude-opus-5` for a while because it could not
// build: zen's identity injection appended Hanzo's identity prompt to the END of
// the conversation, after the user's turn, and a model reads the final turn as
// the thing to continue — so every enso rung answered a "build me a page"
// request by reciting its own identity prompt instead of returning HTML. That
// root cause was FIXED in hanzoai/zen (withIdentity now places the identity as
// the last SYSTEM turn, ahead of the user's), and the owner has confirmed Enso
// builds, so the default is back where it belongs.
//
// The rule that governed the hold still stands (it is the FALLBACK_MODELS rule):
// a model that cannot serve is worse than one that is absent, and that goes
// double for the default. So if a future enso regression makes it recite its
// identity again, this line — not a page, component or env var — is the ONE
// place to move it back to a model that builds.
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

/**
 * THE FAMILY TABLE — one row per model family, and it is the only place a
 * family is defined. Membership (`match`), display name (`label`), grouping
 * ORDER (declaration order) and the brand mark (`key`, looked up by
 * components/model-icon) all come from this one table, so a new family is one
 * row and can never be half-added.
 *
 * `match` runs against the gateway id, and the ID WINS OVER `owned_by`. That
 * ordering is the whole point: `owned_by` is who SERVES the model, not what the
 * model IS. Half our Claude and GPT ids arrive as `owned_by: "do-ai"` (they are
 * resold through DO GenAI), and owner-first grouping filed them under a "Do-ai"
 * heading — a hosting invoice presented to the user as a model family. Owner is
 * only consulted (OWNER_FAMILY) when no id pattern matches at all.
 *
 * `chat: false` marks a family that is not a conversation model — embeddings,
 * rerankers, image/video. They are dropped from the picker rather than matched
 * by keyword: an id-substring blocklist silently passed `all-mini-lm-l6-v2`,
 * `bge-m3`, `e5-large-v2` and `stable-diffusion-3.5-large` into a CHAT picker
 * because none of them contains the string "embedding" or "image".
 */
export type Family = {
  key: string;
  label: string;
  match: RegExp;
  chat?: false;
};

export const FAMILIES: Family[] = [
  // House families lead the list — Enso is Hanzo's own frontier ladder.
  { key: "enso", label: "Enso", match: /^(enso|best)(?![a-z])/ },
  { key: "zen", label: "Zen", match: /^zen\d/ },
  // Marquee third-party families the gateway resells by real name.
  { key: "claude", label: "Claude", match: /(^|-)claude(-|\d|$)/ },
  { key: "gpt", label: "GPT", match: /^(gpt|o[1-9]\d*)(-|\.|\d|$)/ },
  { key: "gemini", label: "Gemini", match: /^gemini(?![a-z])/ },
  { key: "gemma", label: "Gemma", match: /^gemma(?![a-z])/ },
  { key: "llama", label: "Llama", match: /^llama(?![a-z])/ },
  { key: "qwen", label: "Qwen", match: /^qwen\d/, },
  { key: "deepseek", label: "DeepSeek", match: /^deepseek(?![a-z])/ },
  { key: "kimi", label: "Kimi", match: /^kimi(?![a-z])/ },
  { key: "glm", label: "GLM", match: /^glm(?![a-z])/ },
  { key: "minimax", label: "MiniMax", match: /^minimax(?![a-z])/ },
  { key: "mistral", label: "Mistral", match: /^(mistral|magistral|codestral|devstral|ministral)(?![a-z])/ },
  { key: "nemotron", label: "Nemotron", match: /^nemotron(?![a-z])/ },
  { key: "mimo", label: "MiMo", match: /^mimo(?![a-z])/ },
  { key: "grok", label: "Grok", match: /^grok(?![a-z])/ },
  { key: "command", label: "Command", match: /^command(?![a-z])/ },
  { key: "phi", label: "Phi", match: /^phi(?![a-z])/ },
  { key: "trinity", label: "Trinity", match: /^trinity(?![a-z])/ },
  { key: "hunyuan", label: "Hunyuan", match: /^hunyuan(?![a-z])/ },
  { key: "doubao", label: "Doubao", match: /^doubao(?![a-z])/ },
  { key: "yi", label: "Yi", match: /^yi-/ },
  // Not conversation models. A model announces its modality one of TWO ways and
  // both have to be read: as a SEGMENT of a house id (`zen5-embedding-4b`,
  // `zen3-vl`), or as a family that only ever does the one thing (`bge-m3`,
  // `stable-diffusion-3.5-large` — neither of which contains the word for what
  // it is, which is why a plain substring blocklist let them into a chat list).
  { key: "embed", label: "Embeddings", chat: false, match: /(^|-)embed(ding)?s?(-|$)|^(all-mini|bge|e5-|gte-|multi-qa|nomic-embed|text-embedding|voyage)/ },
  { key: "rerank", label: "Rerank", chat: false, match: /(^|-)rerank/ },
  { key: "image", label: "Image", chat: false, match: /(^|-)(image|dall-e|stable-diffusion|flux)(-|\d|$)/ },
  { key: "video", label: "Video", chat: false, match: /^(wan\d|sora|veo|kling|runway)|(^|-)(t2v|i2v)(-|$)/ },
  { key: "speech", label: "Speech", chat: false, match: /(^|-)(tts|asr|whisper|voice|speech|audio|music|foley)(-|$)/ },
  { key: "vision", label: "Vision", chat: false, match: /(^|-)vl(-|$)/ },
  { key: "guard", label: "Safety", chat: false, match: /(^|-)(guard|moderation)(-|$)/ },
  // DO's server-side auto-routers. Real endpoints, but they are a routing
  // policy, not a model you pick — `auto` (AUTO_MODEL) is how this app says it.
  { key: "router", label: "Routers", chat: false, match: /^router:/ },
];

/**
 * `owned_by` → family key, consulted ONLY when no id pattern matched. Deliberately
 * omits `do-ai` and `hanzo`: both are ROUTES that carry many families, so letting
 * either name a family is what produced the "Do-ai" heading in the first place.
 */
const OWNER_FAMILY: Record<string, string> = {
  anthropic: "claude",
  openai: "gpt",
  google: "gemini",
  meta: "llama",
  mistralai: "mistral",
  deepseek: "deepseek",
  alibaba: "qwen",
  moonshot: "kimi",
  nvidia: "nemotron",
  xiaomi: "mimo",
  zhipu: "glm",
  arcee: "trinity",
  baai: "embed",
  cohere: "command",
  microsoft: "phi",
  xai: "grok",
};

/**
 * The family a model belongs to, or undefined when nothing claims it.
 *
 * MODALITY IS TESTED BEFORE BRAND. A brand match is a prefix, so `qwen3-tts-…`
 * and `gpt-image-2` both answer to their brand first and would enter a CHAT
 * picker as a Qwen and a GPT. What a model DOES is the stronger claim; who made
 * it only decides which shelf it sits on once it belongs in the room.
 */
export function familyOf(id: string, ownedBy?: string): Family | undefined {
  const { name, vendor } = splitId(id);
  const byModality = FAMILIES.find((f) => f.chat === false && f.match.test(name));
  if (byModality) return byModality;
  const byId = FAMILIES.find((f) => f.match.test(name));
  if (byId) return byId;
  const owner = (vendor || ownedBy || "").toLowerCase().trim();
  const key = OWNER_FAMILY[owner];
  return key ? FAMILIES.find((f) => f.key === key) : undefined;
}

/**
 * Split a `vendor/model` id. OpenRouter and Hugging Face both namespace ids that
 * way (`anthropic/claude-3.5-sonnet`), and matching the whole string means the
 * family prefix is never at the start — every such model fell through to "Other"
 * with no mark. The vendor half is a perfectly good `owned_by` when the row
 * carries none.
 */
function splitId(id: string): { name: string; vendor: string } {
  const lower = id.toLowerCase().trim();
  const cut = lower.lastIndexOf("/");
  return cut === -1
    ? { name: lower, vendor: "" }
    : { name: lower.slice(cut + 1), vendor: lower.slice(0, cut) };
}

/** A model is offerable when it is a live id in a conversation family. */
export function isChatModel(id: string, ownedBy?: string): boolean {
  if (isDeadModelId(id)) return false;
  return familyOf(id, ownedBy)?.chat !== false;
}

// Tokens whose casing a title-caser cannot guess. Everything absent from this
// map is Capitalized, and a pure version token (4o, 2.5, 397b) keeps its shape.
const TOKENS: Record<string, string> = {
  gpt: "GPT",
  glm: "GLM",
  oss: "OSS",
  vl: "VL",
  ai: "AI",
  api: "API",
  moe: "MoE",
  rag: "RAG",
  sft: "SFT",
  mini: "Mini",
  nano: "Nano",
  tts: "TTS",
  asr: "ASR",
  minimax: "MiniMax",
  mimo: "MiMo",
  deepseek: "DeepSeek",
};

// Claude tiers. Anthropic publishes ids BOTH ways — `claude-opus-4.5` and
// `claude-4.5-sonnet` — and title-casing each verbatim listed "Claude Opus 4.5"
// next to "Claude 4.5 Sonnet", which reads as two naming schemes rather than one
// family. Normalizing tier-before-version gives the family one shape.
const CLAUDE_TIERS = new Set(["opus", "sonnet", "haiku", "fable"]);

const isVersion = (s: string) => /^\d+(\.\d+)*$/.test(s);

/**
 * A gateway id as a human display name: "claude-opus-4-8" → "Claude Opus 4.8",
 * "gpt-4o-mini" → "GPT 4o Mini", "anthropic-claude-opus-5" → "Claude Opus 5".
 *
 * Three rules, no per-model table:
 *  1. a redundant vendor prefix on an id that already names its family is dropped
 *     (`anthropic-claude-…`), so the family is never said twice;
 *  2. adjacent bare-number segments rejoin into the version they were split from
 *     — this is the "Claude Opus 4 8" bug, where a hyphenated `4-8` was read as
 *     two words;
 *  3. tokens are cased from TOKENS, else capitalized — "Gpt" was simply the
 *     absence of this step.
 */
export function labelOf(id: string, ownedBy?: string): string {
  const family = familyOf(id, ownedBy);
  // A `vendor/model` id names itself in its second half; the vendor half is
  // routing, and repeating it reads as "Anthropic Claude Sonnet 4.5".
  let raw = id.trim().split("/").pop() ?? id.trim();

  // `o3`, `o4-mini` — OpenAI writes the reasoning line lowercase; keep it.
  if (/^o[1-9]\d*($|-)/.test(raw)) {
    return raw
      .split("-")
      .map((s, i) => (i === 0 ? s : TOKENS[s] ?? s[0].toUpperCase() + s.slice(1)))
      .join(" ");
  }

  // Rule 1 — drop a vendor prefix the family already states.
  if (family) {
    raw = raw.replace(
      new RegExp(`^(${Object.keys(OWNER_FAMILY).join("|")})-(?=.*${family.key})`, "i"),
      ""
    );
  }

  const parts = raw.split(/[-_]/).filter(Boolean);

  // Rule 2 — rejoin a version split across segments ("4","8" → "4.8").
  const joined: string[] = [];
  for (const part of parts) {
    const prev = joined[joined.length - 1];
    if (prev && isVersion(prev) && isVersion(part)) joined[joined.length - 1] = `${prev}.${part}`;
    else joined.push(part);
  }

  // Rule 3 — case each token, splitting a leading family token off its version
  // ("qwen3.5" → "Qwen 3.5", "deepseek" → "DeepSeek").
  const words = joined.flatMap((part) => {
    const split = /^([a-z]+)(\d.*)$/i.exec(part);
    if (split && family && split[1].toLowerCase() === family.key) {
      return [family.label, split[2]];
    }
    const lower = part.toLowerCase();
    if (TOKENS[lower]) return [TOKENS[lower]];
    if (family && lower === family.key) return [family.label];
    // A parameter count is a unit and reads uppercase (397b → 397B, a17b →
    // A17B). A bare version is NOT — "4o" is OpenAI's omni suffix, and
    // uppercasing every digit-leading token turned it into "4O".
    if (/^[a-z]?\d+(\.\d+)?[bmk]$/i.test(part)) return [part.toUpperCase()];
    if (/^\d/.test(part)) return [part]; // 4o, 4.1 — as published
    return [part[0].toUpperCase() + part.slice(1)];
  });

  // Claude only — rebuild as family · tier · version · rest, so both id spellings
  // ("claude-opus-4.5" and "claude-4.5-sonnet") render the one same way.
  if (family?.key === "claude") {
    const tier = words.find((w) => CLAUDE_TIERS.has(w.toLowerCase()));
    if (tier) {
      const rest = words.filter((w) => w !== family.label && w !== tier);
      return [family.label, tier, ...rest].join(" ");
    }
  }

  return words.join(" ");
}

/** The gateway row shape this app reads. Extra keys are ignored. */
export type GatewayModel = {
  id?: string;
  description?: string;
  owned_by?: string;
  premium?: boolean;
  context_window?: number;
};

/**
 * Shape a gateway `GET /v1/models` `data[]` payload into the picker list: keep
 * conversation models, name them, group them, and carry the metadata the picker
 * renders. This is the single application of the catalog rules above.
 *
 * DEDUPLICATION is part of the contract. The gateway serves the same model over
 * two routes with two ids — `claude-opus-4.8` (direct) and `claude-opus-4-8`
 * (via DO) — which produce one identical label, so the picker listed "Claude
 * Opus 4.8" twice with no way to tell the rows apart. One row wins (the direct
 * route, which is the shorter path) and ABSORBS the twin's metadata, because the
 * resold row is the one that carries `context_window` and `premium`.
 */
export function buildModelsFrom(raw: GatewayModel[]): ModelOption[] {
  const byLabel = new Map<string, ModelOption & { resold: boolean }>();

  for (const m of raw) {
    if (typeof m.id !== "string" || !m.id) continue;
    const family = familyOf(m.id, m.owned_by);
    if (family?.chat === false || isDeadModelId(m.id)) continue;

    const label = labelOf(m.id, m.owned_by);
    const key = `${family?.key ?? "other"}\0${label}`;
    const resold = (m.owned_by ?? "").toLowerCase() === "do-ai";
    const next: ModelOption & { resold: boolean } = {
      value: m.id,
      label,
      family: family?.key ?? "other",
      resold,
      ...(m.description ? { description: m.description } : {}),
      ...(m.premium ? { premium: true } : {}),
      ...(m.context_window ? { context: m.context_window } : {}),
    };

    const seen = byLabel.get(key);
    if (!seen) {
      byLabel.set(key, next);
      continue;
    }
    // Keep the direct route, but never lose metadata the resold twin carried.
    const keep = seen.resold && !resold ? next : seen;
    const drop = keep === seen ? next : seen;
    byLabel.set(key, {
      ...keep,
      premium: keep.premium ?? drop.premium,
      context: keep.context ?? drop.context,
      description: keep.description ?? drop.description,
    });
  }

  // Family order is the FAMILIES declaration order; within a family the
  // gateway's own order is preserved.
  const rank = new Map(FAMILIES.map((f, i) => [f.key, i]));
  return Array.from(byLabel.values())
    .map(({ resold: _resold, ...m }) => m)
    .sort(
      (a, b) =>
        (rank.get(a.family) ?? FAMILIES.length) - (rank.get(b.family) ?? FAMILIES.length)
    );
}

/** Group a shaped list into the picker's sections. Order comes from FAMILIES. */
export function groupByFamily(
  models: ModelOption[]
): Array<{ key: string; label: string; models: ModelOption[] }> {
  const groups = new Map<string, ModelOption[]>();
  for (const m of models) {
    const arr = groups.get(m.family);
    if (arr) arr.push(m);
    else groups.set(m.family, [m]);
  }
  const rank = new Map(FAMILIES.map((f, i) => [f.key, i]));
  return Array.from(groups.entries())
    .sort(([a], [b]) => (rank.get(a) ?? FAMILIES.length) - (rank.get(b) ?? FAMILIES.length))
    .map(([key, list]) => ({
      key,
      label: FAMILIES.find((f) => f.key === key)?.label ?? "Other",
      models: list,
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
// Derived, never hand-written: the labels and families come from the same rules
// the live list uses, so the offline ladder cannot drift into a second naming
// scheme. That drift is exactly what shipped — the hand-written labels here read
// "Claude Opus 4.8" while the live path rendered the same model "Claude Opus 4 8",
// so the picker looked correct offline and broken signed in.
export const FALLBACK_MODELS: ModelOption[] = buildModelsFrom([
  { id: "enso" },
  { id: "enso-flash" },
  { id: "enso-ultra" },
  // Frontier tiers resold through the gateway. Opus 5 is the default the builder
  // opens on; the rest are the ladder the offline fallback still names when the
  // live /v1/models list cannot be reached.
  { id: "anthropic-claude-opus-5" },
  { id: "claude-opus-4.8" },
  { id: "gpt-5.2" },
  { id: "kimi-k3" },
  { id: "glm-5.2" },
]);
