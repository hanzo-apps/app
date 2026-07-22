// The differentiator — what a generic UI generator can't say.
//
// hanzo.app doesn't just draw a screen; it ships a full app on Hanzo Cloud
// with the platform's real infrastructure wired in. Every capability below
// maps to a live Hanzo product (linked to its page on hanzo.ai). No invented
// features, no fake metrics.

import { Cloud, Database, ShieldCheck, Sparkles, KeyRound, Zap } from "lucide-react";
import Reveal from "./reveal";

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
    desc: "Call 400+ models — Zen plus Anthropic, OpenAI, Google, Mistral — from your app through one gateway.",
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
    <section className="relative border-t border-border px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            The difference
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-[2.75rem] md:leading-[1.1]">
            More than a UI. A full app on Hanzo Cloud.
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Other builders hand you a screenshot. Hanzo ships a running app —
            database, auth, AI, secrets, and storage already connected.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.name} delay={i * 60} className="h-full">
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 ${
                  c.primary
                    ? "border-foreground/20 bg-muted hover:border-foreground/30"
                    : "border-border bg-muted hover:border-foreground/20 hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
                    <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {c.product}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-medium tracking-tight text-foreground">
                  {c.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {c.desc}
                </p>

                <code className="mt-5 block truncate rounded-lg border border-border bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                  {c.snippet}
                </code>
              </a>
              </Reveal>
            );
          })}
        </div>

        <Reveal as="p" delay={120} className="mt-10 text-center font-mono text-xs text-muted-foreground">
          The same infrastructure that runs Hanzo, wired into every app you build.
        </Reveal>
      </div>
    </section>
  );
}
