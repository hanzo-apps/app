/**
 * Builder model catalog — Hanzo-native.
 *
 * The builder POSTs to the single Hanzo AI gateway (api.hanzo.ai/v1, an
 * OpenAI-compatible endpoint) via /v1/generate. The gateway owns ALL provider
 * routing (Zen/DO internal, BYOK, linked HuggingFace/other clouds, custom
 * providers), so from the app's point of view there is exactly ONE provider:
 * `hanzo`. Model `value`s here are gateway model IDs.
 *
 * For the fully dynamic list, /v1/models proxies the gateway's GET /v1/models.
 * This static list is the curated builder default set used to seed the
 * settings picker; DEFAULT_MODEL is the coder model the builder opens with.
 */

// The builder opens on the Zen coder model. We offer ONLY the current Zen5
// ladder — the gateway-exposed SKUs (zen-gateway `gateway/config.yaml`), which
// map to the latest OSS weights internally (zen5/zen5-coder → glm-5.2,
// zen5-pro → deepseek-v4-pro, zen5-max → qwen3.5-397b). Deprecated ids
// (zen3-coder, zen4-*) and raw upstream names (qwen/*, deepseek/*, kimi/*) are
// NOT offered — the gateway serves the Zen SKU name, not the upstream id, so
// those 502. The dynamic /v1/models list stays authoritative; this is the
// curated builder default set.
export const DEFAULT_MODEL = "zen5-coder";

// One provider from the app's perspective: the Hanzo gateway.
export const PROVIDERS = {
  hanzo: {
    name: "Hanzo AI",
    max_tokens: 131_000,
    id: "hanzo",
  },
};

// The curated Zen5 builder ladder — every entry is a gateway-served Zen SKU
// backed by the latest OSS weights (see zen-gateway `gateway/config.yaml`):
//   zen5-nano  → nemotron-nano-12b   (fastest / cheapest)
//   zen5-flash → deepseek-4-flash    (fast)
//   zen5-coder → glm-5.2             (default — code)
//   zen5       → glm-5.2             (balanced)
//   zen5-pro   → deepseek-v4-pro     (reasoning)
//   zen5-max   → qwen3.5-397b        (largest OSS)
// zen5-ultra (→ Claude Opus, non-OSS) is intentionally omitted; embeddings
// (zen5-embedding-*) and specialty SKUs (zen3-vl/asr/tts/omni) are other
// surfaces, not the code builder.
export const MODELS = [
  {
    value: "zen5-coder",
    label: "Zen 5 Coder",
    providers: ["hanzo"],
    autoProvider: "hanzo",
    isNew: true,
  },
  {
    value: "zen5-flash",
    label: "Zen 5 Flash",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
  {
    value: "zen5",
    label: "Zen 5",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
  {
    value: "zen5-pro",
    label: "Zen 5 Pro",
    providers: ["hanzo"],
    autoProvider: "hanzo",
    isNew: true,
    isThinker: true,
  },
  {
    value: "zen5-max",
    label: "Zen 5 Max",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
  {
    value: "zen5-nano",
    label: "Zen 5 Nano",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
];
