// Hanzo's own models — the flagship Enso (proprietary) and the open Zen family.
// Complements ModelsStrip (the gateway / 400+ story); this section is
// specifically about the models Hanzo builds. Real product links only:
// hanzo.ai/enso (Enso overview) and hanzo.ai/zen (OSS family). There is no
// published Enso technical report yet, so the CTA says "Learn more", not "report".

import { Orbit, Boxes } from "lucide-react";
import Reveal from "./reveal";

export default function HanzoModels() {
  return (
    <section className="relative border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            Hanzo models
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-[2.75rem] md:leading-[1.1]">
            Frontier intelligence, without the frontier bill.
          </h2>
          <p className="mt-4 text-base text-white/55 md:text-lg">
            Two models we build in-house: Enso, our flagship that routes every
            request to the cheapest model that can nail it — and Zen, the
            open-source family you can run anywhere.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {/* Enso — proprietary flagship */}
          <Reveal className="h-full">
            <a
              href="https://hanzo.ai/enso"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-full flex-col rounded-2xl border border-white/20 bg-white/[0.04] p-7 transition-all duration-200 hover:border-white/30"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <Orbit className="h-5 w-5 text-white" strokeWidth={1.5} />
                </span>
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
                  Proprietary
                </span>
              </div>
              <h3 className="mt-5 text-xl font-medium tracking-tight text-white">
                Enso
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">
                Our new frontier model — and an agentic orchestrator with a
                trainable routing model. Point it at your workloads and it drives
                cost down by sending each request to the cheapest model that can
                do it well, so AI doesn&apos;t cost you an arm and a robot leg.
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                Learn more about Enso <span aria-hidden>→</span>
              </span>
            </a>
          </Reveal>

          {/* Zen — open-source family */}
          <Reveal delay={80} className="h-full">
            <a
              href="https://hanzo.ai/zen"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <Boxes className="h-5 w-5 text-white" strokeWidth={1.5} />
                </span>
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
                  Open source
                </span>
              </div>
              <h3 className="mt-5 text-xl font-medium tracking-tight text-white">
                Zen
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">
                The Zen family — open-weight models you can run, fine-tune, and
                self-host anywhere. The same models behind the gateway, yours to
                own with zero lock-in.
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                Explore Zen <span aria-hidden>→</span>
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
