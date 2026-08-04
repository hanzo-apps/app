/**
 * The catalog rules behind the model picker: which ids are offerable, what
 * family they belong to, and what they are CALLED.
 *
 * Every id in these fixtures is a real `GET https://api.hanzo.ai/v1/models` row.
 * The bugs this pins were all visible in one screenshot of the live picker:
 * "Gpt 4o Mini", "Claude Opus 4 8", "Claude Haiku 4 5" listed directly above a
 * separate "Claude Haiku 4.5", and not one DeepSeek / Qwen / Llama / Mistral /
 * Kimi / GLM row anywhere in a list the product advertises as 400+ models.
 */
import {
  FAMILIES,
  buildModelsFrom,
  familyOf,
  groupByFamily,
  isChatModel,
  labelOf,
  FALLBACK_MODELS,
  DEFAULT_MODEL,
} from "@/lib/providers";

describe("labelOf", () => {
  it("cases the family token instead of title-casing it", () => {
    // "Gpt" — the single most visible defect in the shipped picker.
    expect(labelOf("gpt-4o-mini")).toBe("GPT 4o Mini");
    expect(labelOf("gpt-4.1")).toBe("GPT 4.1");
    expect(labelOf("gpt-oss-120b")).toBe("GPT OSS 120B");
    expect(labelOf("glm-5.2")).toBe("GLM 5.2");
    expect(labelOf("deepseek-v3.2")).toBe("DeepSeek V3.2");
    expect(labelOf("minimax-m2.5")).toBe("MiniMax M2.5");
    expect(labelOf("mimo-v2.5-pro")).toBe("MiMo V2.5 Pro");
  });

  it("rejoins a version that the id split across segments", () => {
    // `claude-opus-4-8` is ONE version, 4.8 — not the words "4" and "8".
    expect(labelOf("claude-opus-4-8")).toBe("Claude Opus 4.8");
    expect(labelOf("claude-haiku-4-5")).toBe("Claude Haiku 4.5");
    expect(labelOf("claude-sonnet-4-6")).toBe("Claude Sonnet 4.6");
  });

  it("says the family once, never twice", () => {
    expect(labelOf("anthropic-claude-opus-5", "do-ai")).toBe("Claude Opus 5");
  });

  it("gives the Claude family one shape whichever way the id is spelled", () => {
    // Anthropic publishes both orders; the picker must not show both.
    expect(labelOf("claude-4.5-sonnet")).toBe("Claude Sonnet 4.5");
    expect(labelOf("claude-opus-4.5")).toBe("Claude Opus 4.5");
    expect(labelOf("claude-5-sonnet")).toBe("Claude Sonnet 5");
    expect(labelOf("claude-fable-5")).toBe("Claude Fable 5");
  });

  it("splits a family token off the version it is glued to", () => {
    expect(labelOf("qwen3-coder")).toBe("Qwen 3 Coder");
    expect(labelOf("qwen3.5-397b")).toBe("Qwen 3.5 397B");
    expect(labelOf("llama3.3-70b-instruct")).toBe("Llama 3.3 70B Instruct");
    expect(labelOf("enso-flash")).toBe("Enso Flash");
    expect(labelOf("kimi-k2.6")).toBe("Kimi K2.6");
  });

  it("keeps OpenAI's reasoning line lowercase, the way OpenAI writes it", () => {
    expect(labelOf("o3")).toBe("o3");
  });
});

describe("familyOf", () => {
  it("reads the family off the id, not off who serves it", () => {
    // Every one of these arrives as owned_by "do-ai". Trusting the owner filed
    // them all under a "Do-ai" heading — a hosting route shown as a family.
    expect(familyOf("claude-sonnet-4-6", "do-ai")?.key).toBe("claude");
    expect(familyOf("gpt-5.6-luna", "do-ai")?.key).toBe("gpt");
    expect(familyOf("kimi-k3", "do-ai")?.key).toBe("kimi");
    expect(familyOf("glm-5.1", "do-ai")?.key).toBe("glm");
    expect(familyOf("anthropic-claude-opus-5", "do-ai")?.key).toBe("claude");
  });

  it("does not let the house route swallow the families it carries", () => {
    // All owned_by "hanzo". Owner-first grouping called every one of them "Zen".
    expect(familyOf("enso-ultra", "hanzo")?.key).toBe("enso");
    expect(familyOf("glm-5.2", "hanzo")?.key).toBe("glm");
    expect(familyOf("kimi-k2.6", "hanzo")?.key).toBe("kimi");
    expect(familyOf("minimax-m2.5", "hanzo")?.key).toBe("minimax");
    expect(familyOf("qwen3.5-397b", "hanzo")?.key).toBe("qwen");
  });

  it("falls back to the owner only when no id pattern claims the model", () => {
    expect(familyOf("trinity-large-thinking", "arcee")?.key).toBe("trinity");
    expect(familyOf("some-unreleased-thing", "openai")?.key).toBe("gpt");
    expect(familyOf("some-unreleased-thing")).toBeUndefined();
  });

  it("every family key is unique and every family names a mark", () => {
    const keys = FAMILIES.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(FAMILIES.every((f) => f.label.length > 0)).toBe(true);
  });
});

describe("isChatModel", () => {
  it("keeps every conversation family", () => {
    for (const id of [
      "claude-opus-4.8",
      "gpt-5.4",
      "enso",
      "deepseek-reasoner",
      "qwen3-coder",
      "llama-4-maverick",
      "mistral-small",
      "nemotron-3-nano",
      "kimi-k2",
      "gemma-4-31b",
    ]) {
      expect(isChatModel(id)).toBe(true);
    }
  });

  it("drops what is not a conversation model, including the ids no keyword catches", () => {
    // None of these four contains "embedding" or "image", which is why an
    // id-substring blocklist let all four into a chat picker.
    expect(isChatModel("all-mini-lm-l6-v2")).toBe(false);
    expect(isChatModel("bge-m3")).toBe(false);
    expect(isChatModel("e5-large-v2")).toBe(false);
    expect(isChatModel("stable-diffusion-3.5-large")).toBe(false);

    expect(isChatModel("gte-large-en-v1.5")).toBe(false);
    expect(isChatModel("multi-qa-mpnet-base-dot-v1")).toBe(false);
    expect(isChatModel("rerank-bge-v2-m3")).toBe(false);
    expect(isChatModel("qwen3-tts-voicedesign")).toBe(false);
    expect(isChatModel("wan2-2-t2v-a14b")).toBe(false);
    expect(isChatModel("gpt-image-2")).toBe(false);
    expect(isChatModel("router:general")).toBe(false);
  });

  it("still refuses a dead legacy id", () => {
    expect(isChatModel("gpt-4")).toBe(false);
    expect(isChatModel("text-davinci-003")).toBe(false);
  });
});

describe("buildModelsFrom", () => {
  // A verbatim slice of the live gateway payload.
  const raw = [
    { id: "enso" },
    { id: "enso-flash" },
    { id: "claude-opus-4.8", owned_by: "anthropic" },
    { id: "claude-opus-4-8", owned_by: "do-ai", context_window: 1000000, premium: true },
    { id: "claude-haiku-4.5", owned_by: "anthropic" },
    { id: "claude-haiku-4-5", owned_by: "do-ai", context_window: 200000 },
    { id: "gpt-4o-mini", owned_by: "openai" },
    { id: "deepseek-v4-pro", owned_by: "deepseek" },
    { id: "qwen3-coder", owned_by: "alibaba" },
    { id: "llama-4-maverick", owned_by: "meta" },
    { id: "bge-m3", owned_by: "do-ai" },
    { id: "router:general", owned_by: "do-ai" },
    { id: "gpt-image-2", owned_by: "openai" },
  ];

  it("carries every conversation family through, not just four of them", () => {
    const families = new Set(buildModelsFrom(raw).map((m) => m.family));
    // The shipped filter admitted only zen/enso/claude/gpt ids, so DeepSeek,
    // Qwen and Llama could never appear however many the gateway served.
    expect(families).toEqual(
      new Set(["enso", "claude", "gpt", "deepseek", "qwen", "llama"])
    );
  });

  it("collapses the two routes to one model into one row", () => {
    const models = buildModelsFrom(raw);
    const opus = models.filter((m) => m.label === "Claude Opus 4.8");
    expect(opus).toHaveLength(1);
    // The direct route wins the id …
    expect(opus[0].value).toBe("claude-opus-4.8");
    // … and keeps the metadata that only the resold twin carried.
    expect(opus[0].context).toBe(1000000);
    expect(opus[0].premium).toBe(true);
  });

  it("drops the non-conversation rows", () => {
    const ids = buildModelsFrom(raw).map((m) => m.value);
    expect(ids).not.toContain("bge-m3");
    expect(ids).not.toContain("router:general");
    expect(ids).not.toContain("gpt-image-2");
  });

  it("orders families house-first, then marquee", () => {
    const order = groupByFamily(buildModelsFrom(raw)).map((g) => g.key);
    expect(order).toEqual(["enso", "claude", "gpt", "llama", "qwen", "deepseek"]);
  });

  it("names every model it returns", () => {
    for (const m of buildModelsFrom(raw)) {
      expect(m.label.trim()).not.toBe("");
      expect(m.label).not.toMatch(/\bGpt\b/);
      expect(m.family).toBeTruthy();
    }
  });
});

describe("the offline ladder", () => {
  it("is derived by the same rules as the live list, so labels cannot drift", () => {
    const byId = Object.fromEntries(FALLBACK_MODELS.map((m) => [m.value, m.label]));
    expect(byId["anthropic-claude-opus-5"]).toBe("Claude Opus 5");
    expect(byId["claude-opus-4.8"]).toBe("Claude Opus 4.8");
    expect(byId["gpt-5.2"]).toBe("GPT 5.2");
    expect(byId["kimi-k3"]).toBe("Kimi K3");
    expect(byId["glm-5.2"]).toBe("GLM 5.2");
  });

  it("carries the default the offline path hands back", () => {
    expect(FALLBACK_MODELS.map((m) => m.value)).toContain(DEFAULT_MODEL);
  });

  it("gives every entry a family, so nothing lands under 'Other'", () => {
    expect(FALLBACK_MODELS.every((m) => m.family !== "other")).toBe(true);
  });
});
