"use client";

import { useState, useEffect } from "react";
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-white/10 bg-[#0a0a0a] text-white shadow-2xl">
        <CardHeader className="text-center">
          {meta?.screenshotUrl ? (
            <div className="mx-auto mb-5 w-full max-w-md aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meta.screenshotUrl}
                alt={`${templateTitle} preview`}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <Sparkles className="h-8 w-8 text-white/70" />
            </div>
          )}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
            Start from this template
          </div>
          <CardTitle className="text-3xl font-medium tracking-tight">{templateTitle}</CardTitle>
          <CardDescription className="mt-2 text-base text-white/55">
            {templateDescription}
          </CardDescription>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45">
            A polished, production-quality starting point — edit it live in the
            preview panel, fork it to your account, or ship straight to Hanzo Cloud.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-2.5 text-xs font-medium uppercase tracking-[0.12em] text-white/40">Choose how to start</h3>
            <div className="space-y-2">
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
                        ? "border-white/25 bg-white/[0.05]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border",
                        opt.mode === "deploy"
                          ? "border-green-500/25 bg-green-500/10"
                          : active
                            ? "border-white/20 bg-white/[0.08]"
                            : "border-white/10 bg-white/[0.04]"
                      )}
                    >
                      <opt.icon className={cn("h-4 w-4", opt.mode === "deploy" ? "text-green-400" : "text-white/80")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-white">{opt.title}</h4>
                        <span
                          className={cn(
                            "h-4 w-4 flex-shrink-0 rounded-full border transition-colors",
                            active ? "border-white bg-white" : "border-white/25"
                          )}
                        >
                          {active && <Check className="h-4 w-4 text-black" strokeWidth={3} />}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-snug text-white/50">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional first message — the change to build ON TOP of the ready template. */}
          <div>
            <label
              htmlFor="tpl-first-msg"
              className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/40"
            >
              What do you want to change?{" "}
              <span className="normal-case tracking-normal text-white/30">(optional)</span>
            </label>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] transition-colors focus-within:border-white/25">
              <textarea
                id="tpl-first-msg"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows={2}
                placeholder="e.g. rename the brand to Bean & Bloom and rewrite the hero copy…"
                className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-xs text-white/35">
              Leave blank to open the template as-is — it loads and previews instantly. Add a note and Hanzo builds it on top.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/45">
            <a
              href={templateRepo.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Github className="h-4 w-4" />
              View source
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white"
            disabled={loading}
          >
            Back to gallery
          </Button>
          <Button
            onClick={handleProceed}
            className="flex-1 bg-white font-medium text-black hover:bg-white/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                {selectedMode === "edit" && "Open editor"}
                {selectedMode === "fork" && "Fork template"}
                {selectedMode === "deploy" && "Deploy now"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}