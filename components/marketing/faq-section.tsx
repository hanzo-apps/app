"use client";

// One reusable FAQ block for the marketing/support surfaces. Monochrome,
// keyboard-accessible expand/collapse. DRY: /pricing (billing subset) and /faq
// (full set) both render THIS — no per-page accordion code. Answers are
// ReactNode so they can carry real links.

import { useState, type ReactNode } from "react";
import { Plus, Minus } from "lucide-react";
import Reveal from "@/components/landing/reveal";

export interface QA {
  q: string;
  a: ReactNode;
}

export default function FaqSection({
  items,
  title,
  eyebrow,
  id,
}: {
  items: QA[];
  title?: string;
  eyebrow?: string;
  id?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id={id} className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-3xl">
        {(title || eyebrow) && (
          <Reveal className="mb-10 text-center">
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                {title}
              </h2>
            )}
          </Reveal>
        )}

        <Reveal className="divide-y divide-border border-y border-border">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-foreground"
                >
                  <span className="text-base font-medium text-foreground md:text-lg">
                    {it.q}
                  </span>
                  <span className="flex-shrink-0 text-muted-foreground">
                    {isOpen ? (
                      <Minus className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-6 pr-8 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {it.a}
                  </div>
                )}
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
