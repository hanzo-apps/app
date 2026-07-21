"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Github,
  Upload,
  FolderOpen,
  Brain,
  Palette,
  Database,
  Globe,
} from "lucide-react";
import { Button } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Card } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type GalleryTemplate,
  snapshotCatalog,
  popularTemplates,
} from "@/lib/gallery-catalog";
import { repoImportLink } from "@/lib/api/git";
import { isGitUrl } from "@/lib/git/url";

// Fork a real template into the editor.
function forkHref(t: GalleryTemplate) {
  return `/dev?template=hanzo-apps/${t.slug}&action=edit`;
}

interface DevOnboardingProps {
  initialPrompt?: string;
  onComplete: (prompt: string, plan?: string) => void;
}

const features = [
  {
    title: "Instant Generation",
    description: "Streams as it builds",
    icon: <Zap className="w-4 h-4" />
  },
  {
    title: "400+ AI Models",
    description: "Latest LLMs available",
    icon: <Brain className="w-4 h-4" />
  },
  {
    title: "Real Data",
    description: "Hanzo Base, built in",
    icon: <Database className="w-4 h-4" />
  },
  {
    title: "Beautiful UIs",
    description: "Tailored & shadowui",
    icon: <Palette className="w-4 h-4" />
  }
];

export function DevOnboarding({ initialPrompt = "", onComplete }: DevOnboardingProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const router = useRouter();

  // Real "popular" templates from the gallery catalog. Seed from the bundled
  // snapshot (instant, never empty) then refresh from the live catalog.
  const [popular, setPopular] = useState<GalleryTemplate[]>(
    () => popularTemplates(snapshotCatalog().templates, 6),
  );
  useEffect(() => {
    let alive = true;
    fetch("/v1/gallery")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.templates) && d.templates.length) {
          setPopular(popularTemplates(d.templates, 6));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // A prompt handed in from the landing composer or a fork goes STRAIGHT to the
  // real builder — no fake "planning" interstitial. AskAI reads
  // window.__initialPrompt on mount and streams the ACTUAL generation.
  useEffect(() => {
    if (initialPrompt) onComplete(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // Selecting a real template forks it into the editor (clone + customize),
  // rather than running the canned plan animation.
  const handleTemplateSelect = (template: GalleryTemplate) => {
    router.push(forkHref(template));
  };

  // Import a real repository: collect the URL, then hand it to the shared /dev
  // import wire (repoImportLink → parseGitUrl / TemplateLoader / hanzo matcher).
  // Only a real URL navigates — an empty or cancelled prompt is a no-op.
  const handleImportProject = (source: "github" | "hanzo") => {
    const url = window.prompt(
      source === "github"
        ? "Paste a public GitHub repository URL"
        : "Paste a Hanzo project URL",
    )?.trim();
    if (!url) return;
    if (source === "github" && !isGitUrl(url)) return;
    router.push(repoImportLink(url));
  };

    return (
      <div className="min-h-screen h-screen overflow-y-auto bg-black flex justify-center items-start px-6 py-16">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-medium text-white mb-4">
              Welcome to Hanzo AI ✨
            </h1>
            <p className="text-xl text-neutral-400">
              Your AI-powered development platform is ready
            </p>
          </div>

          {/* Quick Start Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-neutral-900 border-neutral-800 p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Start with a prompt
              </h3>
              <Textarea
                placeholder="Describe what you want to build..."
                className="bg-neutral-800 border-neutral-700 text-white mb-4 min-h-[100px]"
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              />
              <Button
                className="w-full gap-2 bg-white text-black hover:bg-white/90"
                onClick={() => prompt && onComplete(prompt)}
                disabled={!prompt.trim()}
              >
                <Sparkles className="w-4 h-4" />
                Start Building
              </Button>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Import existing project
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleImportProject("github")}
                >
                  <Github className="w-4 h-4" />
                  Import from GitHub
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleImportProject("hanzo")}
                >
                  <Upload className="w-4 h-4" />
                  Import from Hanzo
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push("/new")}
                >
                  <FolderOpen className="w-4 h-4" />
                  Upload project files
                </Button>
              </div>
            </Card>
          </div>

          {/* Popular templates — real gallery templates with real previews */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                Start from a template
              </h3>
              <Link href="/gallery">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Browse all
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {popular.map((template) => (
                <button
                  key={template.slug}
                  onClick={() => handleTemplateSelect(template)}
                  className="flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 hover:border-white/50 hover:-translate-y-0.5 transition-all text-left group"
                >
                  <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.screenshotUrl}
                      alt={`${template.displayName} preview`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <Badge className="absolute top-1.5 right-1.5 bg-black/70 text-white border-neutral-700 text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="text-white font-medium text-sm truncate">{template.displayName}</p>
                    <p className="text-neutral-500 text-xs mt-0.5 line-clamp-1">
                      {template.description || template.framework}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center text-white mb-2 mx-auto">
                  {feature.icon}
                </div>
                <p className="text-white text-sm font-medium">{feature.title}</p>
                <p className="text-neutral-500 text-xs">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Proof — real only: Techstars '17 backing + the real model count. */}
          <div className="flex justify-center gap-8 mt-8 text-center">
            <div>
              <p className="text-2xl font-medium text-white">Techstars &apos;17</p>
              <p className="text-xs text-neutral-500">backed</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-white">400+</p>
              <p className="text-xs text-neutral-500">AI models</p>
            </div>
          </div>
        </div>
      </div>
    );
}