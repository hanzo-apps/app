// The differentiator — what a generic UI generator can't say.
//
// hanzo.app doesn't just draw a screen; it ships a full app on Hanzo Cloud
// with the platform's real infrastructure wired in. Every capability below
// maps to a live Hanzo product (linked to its page on hanzo.ai). No invented
// features, no fake metrics.

import { Cloud, Database, ShieldCheck, Sparkles, KeyRound, Zap } from "lucide-react";

interface Capability {
  icon: typeof Cloud;
  name: string;
  product: string;
  href: string;
  desc: string;
  snippet: string;
  primary?: boolean;
}

const capabilities: Capability[] = [
  {
    icon: Cloud,
    name: "Deploy to Hanzo Cloud",
    product: "Cloud",
    href: "https://hanzo.ai/cloud",
    desc: "One click ships your app to a live URL on real infrastructure — no Dockerfile, no pipeline to wire up.",
    snippet: "→ https://your-app.hanzo.app",
    primary: true,
  },
  {
    icon: Database,
    name: "Database, built in",
    product: "Base",
    href: "https://hanzo.ai/base",
    desc: "Every app gets Hanzo Base — an embedded SQLite datastore with realtime queries. Schema generated from your prompt.",
    snippet: "db.from('tasks').select('*')",
  },
  {
    icon: ShieldCheck,
    name: "Auth, built in",
    product: "IAM",
    href: "https://hanzo.ai/iam",
    desc: "Sign-in ships wired to Hanzo IAM — OIDC, sessions, and org-scoped access with zero config.",
    snippet: "import { auth } from '@hanzo/iam'",
  },
  {
    icon: Sparkles,
    name: "AI, built in",
    product: "LLM Gateway",
    href: "https://hanzo.ai/llm",
    desc: "Call 100+ models — Zen plus Anthropic, OpenAI, Google, Mistral — from your app through one gateway.",
    snippet: "POST api.hanzo.ai/v1/chat/completions",
  },
  {
    icon: KeyRound,
    name: "Secrets & storage",
    product: "KMS · S3",
    href: "https://hanzo.ai/kms",
    desc: "API keys land in Hanzo KMS, never in code. Files and assets go to S3-compatible object storage.",
    snippet: "kms.get('OPENAI_API_KEY')",
  },
  {
    icon: Zap,
    name: "Functions & edge",
    product: "Functions",
    href: "https://hanzo.ai/functions",
    desc: "Server logic runs as serverless functions at the edge — scaled and routed by the platform automatically.",
    snippet: "export const POST = handler(...)",
  },
];

export default function CloudIntegration() {
  return (
    <section className="relative border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            The difference
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-[2.75rem] md:leading-[1.1]">
            More than a UI. A full app on Hanzo Cloud.
          </h2>
          <p className="mt-4 text-base text-white/55 md:text-lg">
            Other builders hand you a screenshot. Hanzo ships a running app —
            database, auth, AI, secrets, and storage already connected.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                  c.primary
                    ? "border-white/20 bg-white/[0.04] hover:border-white/30"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">
                    {c.product}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-medium tracking-tight text-white">
                  {c.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
                  {c.desc}
                </p>

                <code className="mt-5 block truncate rounded-lg border border-white/[0.06] bg-black/50 px-3 py-2 font-mono text-[11px] text-white/45 transition-colors duration-200 group-hover:text-white/65">
                  {c.snippet}
                </code>
              </a>
            );
          })}
        </div>

        <p className="mt-10 text-center font-mono text-xs text-white/35">
          The same infrastructure that runs Hanzo, wired into every app you build.
        </p>
      </div>
    </section>
  );
}
