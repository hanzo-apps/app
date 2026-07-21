"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@hanzo/ui";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Starter ideas — honest app types, not fabricated products (mirrors the landing). */
const STARTERS: { label: string; prompt: string }[] = [
  { label: "SaaS landing", prompt: "A SaaS landing page with a hero, pricing tiers, and a signup form" },
  { label: "Dashboard", prompt: "An analytics dashboard with charts, KPI tiles, and a responsive grid" },
  { label: "AI chat", prompt: "An AI chat interface with streaming responses and conversation history" },
  { label: "Storefront", prompt: "An e-commerce storefront with a product grid, cart, and checkout" },
];

/**
 * The ONE "start building" composer. Seeds the builder via the SAME contract the
 * landing hero uses — `localStorage.initialPrompt` + navigate to `/dev`, which
 * reads it on mount and auto-starts the first generation. Rendered on the
 * dashboard so a signed-in user can kick off a new project in a single step
 * ("start a new thing quickly"), and reusable anywhere else that needs it.
 */
export function StartComposer({ className }: { className?: string }) {
  const router = useRouter();
  const [idea, setIdea] = useState("");

  const start = () => {
    const text = idea.trim();
    if (!text) return;
    // Same seeding contract as app/page.tsx: persist the prompt, then open the
    // builder IDE which picks it up from localStorage and begins building.
    try {
      localStorage.setItem("initialPrompt", text);
    } catch {
      // localStorage may be unavailable; the builder also accepts ?prompt=.
    }
    router.push(`/dev?prompt=${encodeURIComponent(text)}`);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 sm:p-8",
        className
      )}
    >
      <h2 className="text-xl font-medium tracking-tight text-foreground text-balance sm:text-2xl">
        What do you want to build?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe an app and Hanzo starts building it live — UI, data, and AI wired in.
      </p>
      <div className="mt-4 rounded-xl border border-border bg-card/60 transition-colors focus-within:border-ring">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            // Enter (without Shift) starts building — a chat-like affordance.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              start();
            }
          }}
          rows={3}
          placeholder="e.g. a landing page for my coffee subscription with pricing and a signup form"
          className="w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Describe what you want to build"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <div className="hidden flex-wrap gap-2 sm:flex">
            {STARTERS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setIdea(s.prompt)}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button
            onClick={start}
            disabled={!idea.trim()}
            className="ml-auto bg-primary font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Start building
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Starter chips wrap below on mobile where the inline row is hidden. */}
      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
        {STARTERS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setIdea(s.prompt)}
            className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
