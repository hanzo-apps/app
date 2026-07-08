"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Sparkles, Star, Code, Eye, Search, Rocket, ArrowRight, Loader2 } from "lucide-react";
import {
  type GalleryTemplate,
  catalogCategories,
  snapshotCatalog,
} from "@/lib/gallery-catalog";
import { AppShell } from "@/components/app-shell";

// Fork a real template into the editor: /dev parses ?template=owner/repo and the
// TemplateLoader clones github.com/hanzo-apps/<slug>.
function forkHref(t: GalleryTemplate, action: "edit" | "deploy" = "edit") {
  return `/dev?template=hanzo-apps/${t.slug}&action=${action}`;
}

export default function TemplateGallery() {
  const router = useRouter();
  // Seed from the bundled snapshot so first paint is instant + never empty,
  // then refresh from the live gallery via the same-origin proxy.
  const [templates, setTemplates] = useState<GalleryTemplate[]>(
    () => snapshotCatalog().templates,
  );
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/v1/gallery")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.templates) && d.templates.length) {
          setTemplates(d.templates);
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => catalogCategories(templates), [templates]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return templates.filter((t) => {
      const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
      const matchesSearch =
        !q ||
        t.displayName.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.features.some((f) => f.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const startFromPrompt = () => {
    if (!prompt.trim()) return;
    router.push(`/dev?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <AppShell currentView="templates">
      <div className="flex-1 overflow-y-auto bg-black text-white">
      {/* Hero: prompt-first onboarding */}
      <header className="border-b border-neutral-900 bg-gradient-to-b from-neutral-950 to-black">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-medium">Hanzo Templates</h1>
            <Badge variant="secondary" className="ml-1">
              {templates.length} templates
            </Badge>
          </div>
          <p className="text-neutral-400 max-w-2xl mb-6">
            Start from a real, production-grade template — or describe your app and let
            Hanzo generate it. Every template forks into the editor and deploys to a
            live <code className="text-neutral-300">*.hanzo.app</code> URL.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
            <div className="relative flex-1">
              <Input
                placeholder="Describe what you want to build…"
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") startFromPrompt();
                }}
                className="h-12 bg-neutral-900 border-neutral-800 text-white pl-4"
              />
            </div>
            <Button
              className="h-12 gap-2 bg-gradient-to-r from-neutral-700 to-neutral-900 hover:from-neutral-900 hover:to-neutral-700"
              onClick={startFromPrompt}
              disabled={!prompt.trim()}
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-40 border-b border-neutral-900 bg-black/95 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Search templates…"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 bg-neutral-900 border-neutral-800 text-white"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-white text-black"
                      : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} shown{loading ? " · syncing…" : ""}
            </Badge>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((t) => (
            <div
              key={t.slug}
              className="group flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-white/50 hover:-translate-y-1 transition-all"
            >
              {/* Real preview screenshot */}
              <a
                href={forkHref(t)}
                className="relative block aspect-[16/10] bg-neutral-950 overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.screenshotUrl}
                  alt={`${t.displayName} preview`}
                  loading="lazy"
                  className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-neutral-200">
                  <Star className="w-3 h-3 fill-neutral-200" />
                  {t.rating}
                </div>
                <Badge className="absolute top-2 right-2 bg-black/70 text-white border-neutral-700 text-[11px]">
                  {t.category}
                </Badge>
              </a>

              <div className="flex flex-col flex-1 p-4">
                <h3 className="font-medium text-white">{t.displayName}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2 flex-1">
                  {t.description || t.useCase || `${t.framework} template`}
                </p>
                <p className="text-[11px] text-neutral-600 mt-2">{t.framework}</p>

                <div className="flex gap-2 mt-3">
                  <a href={forkHref(t)} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full gap-1 bg-gradient-to-r from-neutral-700 to-neutral-900 hover:from-neutral-900 hover:to-neutral-700"
                    >
                      <Code className="w-3 h-3" />
                      Fork &amp; Edit
                    </Button>
                  </a>
                  <a href={t.templateUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1 border-neutral-700">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-500" />
            ) : (
              <>
                <p className="text-neutral-400 text-lg">No templates match your search.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="mt-2 text-white"
                >
                  Clear filters
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <section className="border-t border-neutral-900 bg-neutral-950">
        <div className="container mx-auto px-6 py-10 text-center">
          <h2 className="text-xl font-medium mb-2">Don&apos;t see the right fit?</h2>
          <p className="text-neutral-400 mb-5">
            Describe your app and Hanzo builds it from scratch — deployed live in minutes.
          </p>
          <Button
            className="gap-2 bg-gradient-to-r from-neutral-700 to-neutral-900 hover:from-neutral-900 hover:to-neutral-700"
            onClick={() => router.push("/dev")}
          >
            <Rocket className="w-4 h-4" />
            Start building
          </Button>
        </div>
      </section>
      </div>
    </AppShell>
  );
}
