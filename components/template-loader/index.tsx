"use client";

import { useState, useEffect } from "react";
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import {
  Sparkles,
  Code,
  Zap,
  Copy,
  Github,
  Rocket,
  ArrowRight,
  Loader2
} from "lucide-react";
import { resolveTemplateSeedMeta, type TemplateSeedMeta } from "@/lib/api/templates";

interface TemplateLoaderProps {
  templateRepo: {
    platform: string;
    owner: string;
    name: string;
    fullUrl: string;
    host?: string;
  };
  action: "edit" | "deploy";
  onProceed: (mode: "fork" | "edit" | "deploy") => void;
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

  const handleProceed = () => {
    setLoading(true);
    onProceed(selectedMode);
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
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="mb-3 text-sm font-medium text-white/70">Choose how to start</h3>
            <Tabs value={selectedMode} onValueChange={(v: string) => setSelectedMode(v as "edit" | "fork" | "deploy")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="edit">
                  <Code className="w-4 h-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="fork">
                  <Copy className="w-4 h-4 mr-2" />
                  Fork
                </TabsTrigger>
                <TabsTrigger value="deploy">
                  <Zap className="w-4 h-4 mr-2" />
                  Deploy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                    <Code className="h-5 w-5 text-white/80" />
                  </div>
                  <div>
                    <h4 className="font-medium">Edit in Hanzo</h4>
                    <p className="mt-1 text-sm text-white/55">
                      Opens in the Hanzo editor — no setup. Your app runs live in the
                      preview panel beside your code, refreshing on every edit, with
                      the AI assistant on hand.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Badge variant="secondary">Instant start</Badge>
                      <Badge variant="secondary">Live preview</Badge>
                      <Badge variant="secondary">AI assistant</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fork" className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                    <Copy className="h-5 w-5 text-white/80" />
                  </div>
                  <div>
                    <h4 className="font-medium">Fork to your account</h4>
                    <p className="mt-1 text-sm text-white/55">
                      Get your own copy as a fresh repository — customize it, keep it
                      under version control, and deploy it independently. Entirely yours.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Badge variant="secondary">Own repository</Badge>
                      <Badge variant="secondary">Full control</Badge>
                      <Badge variant="secondary">Version control</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deploy" className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10">
                    <Rocket className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Deploy to Hanzo Cloud</h4>
                    <p className="mt-1 text-sm text-white/55">
                      Ship it live in seconds — a public URL with automatic SSL,
                      running on Hanzo Cloud.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Badge variant="secondary">Instant deploy</Badge>
                      <Badge variant="secondary">Custom domain</Badge>
                      <Badge variant="secondary">Auto scaling</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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