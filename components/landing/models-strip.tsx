// "One API, 100+ models" — the real Hanzo LLM Gateway. Provider logos are the
// actual model providers the gateway routes to (Zen models are Hanzo's own).
// Rendered monochrome-white on true-black via CSS filter. The endpoint shown
// is real (api.hanzo.ai/v1, OpenAI-compatible); the model value is illustrative.

import Reveal from "./reveal";

const providers = [
  { src: "/logos/providers/anthropic.svg", alt: "Anthropic", w: 118 },
  { src: "/logos/providers/openai.svg", alt: "OpenAI", w: 108 },
  { src: "/logos/providers/gemini.svg", alt: "Google Gemini", w: 104 },
  { src: "/logos/providers/mistral.svg", alt: "Mistral AI", w: 108 },
  { src: "/logos/providers/qwen.svg", alt: "Qwen", w: 92 },
  { src: "/logos/providers/deepseek.svg", alt: "DeepSeek", w: 116 },
  { src: "/logos/providers/groq.svg", alt: "Groq", w: 82 },
  { src: "/logos/providers/moonshot.svg", alt: "Moonshot", w: 116 },
  { src: "/logos/providers/xai.svg", alt: "xAI", w: 56 },
  { src: "/logos/providers/together.svg", alt: "Together AI", w: 116 },
  { src: "/logos/providers/huggingface.svg", alt: "Hugging Face", w: 40 },
  { src: "/logos/providers/fireworks.svg", alt: "Fireworks AI", w: 40 },
];

export default function ModelsStrip() {
  return (
    <section className="relative border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            Hanzo LLM Gateway
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
            One API. 100+ models.
          </h2>
          <p className="mt-4 max-w-md text-base text-white/55 md:text-lg">
            Your app calls any frontier model — Hanzo&apos;s own Zen family plus
            Anthropic, OpenAI, Google, Mistral and more — through a single
            OpenAI-compatible endpoint. Swap models with one string.
          </p>

          <a
            href="https://hanzo.ai/llm"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Explore the gateway
            <span aria-hidden>→</span>
          </a>
        </Reveal>

        <Reveal delay={100} className="rounded-2xl border border-white/10 bg-black/50 p-5">
          <div className="mb-4 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-white/70">
{`POST https://api.hanzo.ai/v1/chat/completions
Authorization: Bearer $HANZO_KEY

{
  "model": "zen-omni",
  "messages": [{ "role": "user", "content": "…" }],
  "stream": true
}`}
          </pre>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-white/[0.06] pt-6">
            {providers.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.alt}
                src={p.src}
                alt={p.alt}
                style={{ width: p.w }}
                className="h-4 w-auto object-contain opacity-40 transition-opacity duration-200 [filter:brightness(0)_invert(1)] hover:opacity-80 md:h-5"
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
