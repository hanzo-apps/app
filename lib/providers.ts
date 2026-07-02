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

// The builder's default is a Zen coder model. `zen3-coder` is not yet on the
// gateway; `zen5-coder` is the best available Zen coder id.
export const DEFAULT_MODEL = "zen5-coder";

// One provider from the app's perspective: the Hanzo gateway.
export const PROVIDERS = {
  hanzo: {
    name: "Hanzo AI",
    max_tokens: 131_000,
    id: "hanzo",
  },
};

export const MODELS = [
  {
    value: "zen5-coder",
    label: "Zen 5 Coder",
    providers: ["hanzo"],
    autoProvider: "hanzo",
    isNew: true,
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
  },
  {
    value: "zen3-omni",
    label: "Zen 3 Omni",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
  {
    value: "qwen/qwen3-coder",
    label: "Qwen3 Coder",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
  {
    value: "deepseek/deepseek-v3.2",
    label: "DeepSeek V3.2",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
  {
    value: "moonshotai/kimi-k2.5",
    label: "Kimi K2.5",
    providers: ["hanzo"],
    autoProvider: "hanzo",
  },
  {
    value: "deepseek/deepseek-r1-0528",
    label: "DeepSeek R1",
    providers: ["hanzo"],
    autoProvider: "hanzo",
    isThinker: true,
  },
];
