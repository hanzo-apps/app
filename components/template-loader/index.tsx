"use client";

import { useState, useEffect } from "react";
import { Button } from "@hanzo/ui";
import {
  Sparkles,
  Code,
  Copy,
  Github,
  Rocket,
  ArrowRight,
  Loader2,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveTemplateSeedMeta, type TemplateSeedMeta } from "@/lib/api/templates";

type StartMode = "fork" | "edit" | "deploy";

const START_OPTIONS: { mode: StartMode; icon: LucideIcon; title: string; desc: string }[] = [
  { mode: "edit", icon: Code, title: "Edit in Hanzo", desc: "Opens in the editor — the app runs live in the preview beside your code, with the AI assistant on hand." },
  { mode: "fork", icon: Copy, title: "Fork to your account", desc: "Your own copy as a fresh repository — customize it, keep version control, and deploy independently." },
  { mode: "deploy", icon: Rocket, title: "Deploy to Hanzo Cloud", desc: "Ship it live in seconds — a public URL with automatic SSL on Hanzo Cloud." },
];

interface TemplateLoaderProps {
  templateRepo: {
    platform: string;
    owner: string;
    name: string;
    fullUrl: string;
    host?: string;
  };
  action: "edit" | "deploy";
  onProceed: (mode: StartMode, firstMessage?: string) => void;
}

/** Friendly provenance label for the repo source (any host, not just GitHub). */
function sourceLabel(platform: string, host?: string): string {
  switch (platform) {
    case "github":
      return "GitHub";
    case "gitlab":
      return "GitLab";
    case "bitbucket":
      return "Bitbucket";
    case "gallery":
      return "Hanzo Gallery";
    default:
      return host || "Git";
  }
}

export function TemplateLoader({ templateRepo, action, onProceed }: TemplateLoaderProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"fork" | "edit" | "deploy">(
    action === "deploy" ? "deploy" : "edit"
  );

  // Real template metadata (preview screenshot + fields) for this slug, resolved
  // from WHICHEVER gallery catalog knows it (the same resolver the seed prompt
  // uses) — so the preview + title are correct no matter which surface linked in.
  const [meta, setMeta] = useState<TemplateSeedMeta | null>(null);
  useEffect(() => {
    let alive = true;
    resolveTemplateSeedMeta(templateRepo.name)
      .then((m) => {
        if (alive && m) setMeta(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [templateRepo.name]);

  const templateTitle =
    meta?.displayName ||
    templateRepo.name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace("Template ", "");

  // Honest one-line description from the template's real fields; a git-import
  // (no catalog match) falls back to its source provenance.
  const templateDescription =
    meta?.description ||
    meta?.useCase ||
    [meta?.framework, meta?.category].filter(Boolean).join(" · ") ||
    `From ${sourceLabel(templateRepo.platform, templateRepo.host)}: ${templateRepo.owner}/${templateRepo.name}`;

  // Optional first message — the change the user wants built ON TOP of the ready
  // template. Empty = load the template as-is and show its preview immediately.
  const [firstMessage, setFirstMessage] = useState("");

  const handleProceed = () => {
    setLoading(true);
    onProceed(selectedMode, firstMessage.trim() || undefined);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 lg:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl lg:grid lg:grid-cols-2 lg:max-h-[calc(100dvh-3rem)]">
        {/* LEFT — template identity + live preview thumbnail. */}
        <div className="flex flex-col border-b border-border p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div className="mb-4 inline-flex w-max items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Start from this template
          </div>
          {meta?.screenshotUrl ? (
            <div className="mb-5 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meta.screenshotUrl}
                alt={`${templateTitle} preview`}
                className="h-full w-full object-cover object-top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted">
              <Sparkles className="h-8 w-8 text-foreground" />
            </div>
          )}
          <h1 className="text-3xl font-medium tracking-tight text-balance">{templateTitle}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{templateDescription}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A polished, production-quality starting point — edit it live in the
            preview panel, fork it to your account, or ship straight to Hanzo Cloud.
          </p>
          <div className="mt-auto pt-6">
            <a
              href={templateRepo.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              View source
            </a>
          </div>
        </div>

        {/* RIGHT — how to start + first message. The chat input and primary CTA
            are pinned (shrink-0) so they stay visible without scrolling; only the
            option list scrolls if the viewport is short. */}
        <div className="flex min-h-0 flex-col p-6 lg:max-h-[calc(100dvh-3rem)] lg:p-8">
          <h3 className="mb-2.5 shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Choose how to start
          </h3>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {START_OPTIONS.map((opt) => {
              const active = selectedMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setSelectedMode(opt.mode)}
                  aria-pressed={active}
                  className={cn(
                    "group flex w-full items-start gap-3.5 rounded-xl border p-3.5 text-left transition-colors",
                    active
                      ? "border-foreground/25 bg-accent"
                      : "border-border bg-muted hover:border-foreground/20 hover:bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border",
                      opt.mode === "deploy"
                        ? "border-green-500/25 bg-green-500/10"
                        : active
                          ? "border-foreground/20 bg-accent"
                          : "border-border bg-muted"
                    )}
                  >
                    <opt.icon className={cn("h-4 w-4", opt.mode === "deploy" ? "text-green-400" : "text-foreground")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium text-foreground">{opt.title}</h4>
                      <span
                        className={cn(
                          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                          active ? "border-primary bg-primary" : "border-foreground/25"
                        )}
                      >
                        {active && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional first message — the change to build ON TOP of the ready
              template. Pinned below the option list, always in view. */}
          <div className="mt-5 shrink-0">
            <label
              htmlFor="tpl-first-msg"
              className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              What do you want to change?{" "}
              <span className="normal-case tracking-normal text-muted-foreground">(optional)</span>
            </label>
            <div className="rounded-xl border border-border bg-muted transition-colors focus-within:border-foreground/25">
              <textarea
                id="tpl-first-msg"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                onKeyDown={(e) => {
                  // Enter (without Shift) proceeds — a chat-like affordance.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) handleProceed();
                  }
                }}
                rows={2}
                placeholder="e.g. rename the brand to Bean & Bloom and rewrite the hero copy…"
                className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Leave blank to open the template as-is — it loads and previews instantly. Add a note and Hanzo builds it on top.
            </p>
          </div>

          {/* Actions — pinned. */}
          <div className="mt-5 flex shrink-0 gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1 border-border bg-transparent text-foreground hover:bg-accent hover:text-foreground"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleProceed}
              className="flex-[2] bg-primary font-medium text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  {selectedMode === "edit" && "Edit now"}
                  {selectedMode === "fork" && "Fork template"}
                  {selectedMode === "deploy" && "Deploy now"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}