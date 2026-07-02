/**
 * Zen model catalogue for the hanzo.app builder.
 *
 * These are the ONLY model ids the UI exposes — the Hanzo Zen family. Never
 * surface upstream architecture names. The gateway (api.hanzo.ai) resolves each
 * id to the underlying weights; `/api/ask-ai` sends `model: <value>` straight
 * through. See `~/work/hanzo/CLAUDE.md` (Brand Policy: No Upstream References).
 */

export interface ZenModel {
  value: string; // gateway model id, e.g. "zen5-coder"
  label: string; // human label shown in the picker
  description?: string;
  isNew?: boolean;
  isThinker?: boolean;
}

export const MODELS: ZenModel[] = [
  {
    value: "zen5-coder",
    label: "Zen 5 Coder",
    description: "Frontier code generation — the default for building apps.",
    isNew: true,
  },
  {
    value: "zen5",
    label: "Zen 5",
    description: "Next-generation agentic model with native chain-of-thought.",
    isNew: true,
  },
  {
    value: "zen5-pro",
    label: "Zen 5 Pro",
    description: "Higher-capability reasoning for complex builds.",
  },
  {
    value: "zen5-max",
    label: "Zen 5 Max",
    description: "Maximum capability for the hardest tasks.",
  },
  {
    value: "zen5-flash",
    label: "Zen 5 Flash",
    description: "Fast, cost-efficient generation for quick iterations.",
  },
  {
    value: "zen5-mini",
    label: "Zen 5 Mini",
    description: "Lightweight model for small edits.",
  },
];

/** The default model id (code generation). */
export const DEFAULT_MODEL = MODELS[0].value;
