"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@hanzo/ui";
import {
  ArrowRight,
  ArrowUp,
  Loader2,
  ChevronRight,
  CloudOff,
  Search,
  Paperclip,
  FolderUp,
  LayoutDashboard,
  Bot,
  FileCode2,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import { HanzoBrand } from "@/components/HanzoLogo";
import {
  fetchGalleryTemplates,
  templateBuilderLink,
  type GalleryTemplate,
} from "@/lib/api/templates";
import { toast } from "sonner";
import { ImportGitPanel } from "@/components/import-git-panel";
import { UserMenu } from "@/components/user-menu";
import { useUser } from "@/hooks/useUser";
import { OrgProvider } from "@/lib/org/client";
import { OrgGate, OrgSwitcher } from "@/components/org-switcher";
import { isGitUrl, gitUrlGateMessage } from "@/lib/git/url";
import { useProjectImport } from "@/lib/import/use-project-import";

export default function NewProjectPage() {
  // Establish an org BEFORE any project is created: a zero-org user is gated
  // into onboarding (personal workspace by default); everyone else picks/sees
  // their org via the selector in the header.
  return (
    <OrgProvider>
      <OrgGate>
        <NewProjectInner />
      </OrgGate>
    </OrgProvider>
  );
}

const QUICK_STARTS: { label: string; icon: typeof LayoutDashboard; prompt: string }[] = [
  {
    label: "SaaS Dashboard",
    icon: LayoutDashboard,
    prompt: "Build a SaaS dashboard with authentication, a metrics overview, and a billing page.",
  },
  {
    label: "AI Chatbot",
    icon: Bot,
    prompt: "Build an AI chatbot app with a streaming chat UI, conversation history, and a model picker.",
  },
  {
    label: "Landing Page",
    icon: FileCode2,
    prompt: "Build a modern marketing landing page with a hero, feature grid, pricing, and a waitlist form.",
  },
  {
    label: "Internal Tool",
    icon: Boxes,
    prompt: "Build an internal admin tool with a data table, filters, and a record detail drawer.",
  },
];

function NewProjectInner() {
  const router = useRouter();
  const { user } = useUser();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [repoFilter, setRepoFilter] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Drag & drop / pick a project folder or .zip → import into the builder.
  const { importing, importDrop, importFiles } = useProjectImport();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const onComposerDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer) importDrop(e.dataTransfer);
    },
    [importDrop],
  );
  const onComposerDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (Array.from(e.dataTransfer.types || []).includes("Files")) {
      e.preventDefault();
      setDragActive(true);
    }
  }, []);
  const onComposerDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX >= r.right ||
      e.clientY < r.top ||
      e.clientY >= r.bottom
    ) {
      setDragActive(false);
    }
  }, []);

  // Real starter-kit gallery (hanzoai/gallery via the /v1/templates BFF). Always
  // resolves — an unreachable/empty gallery yields the honest local fallback.
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [galleryLive, setGalleryLive] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchGalleryTemplates().then(({ templates, live }) => {
      if (!active) return;
      setTemplates(templates);
      setGalleryLive(live);
      setGalleryLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // One composer, two destinations: a git URL deploys the repo as a service;
  // anything else is a natural-language brief the AI builder turns into an app.
  const submit = useCallback(
    (raw?: string) => {
      const text = (raw ?? value).trim();
      if (!text || loading) return;
      if (isGitUrl(text)) {
        // Honest gate: an SSH/private remote can't be imported (no credentials).
        const gate = gitUrlGateMessage(text);
        if (gate) {
          toast.error(gate);
          return;
        }
        setLoading(true);
        const url = new URL("/dev", window.location.origin);
        url.searchParams.set("repo", text);
        url.searchParams.set("action", "edit");
        router.push(url.toString());
      } else {
        setLoading(true);
        const url = new URL("/dev", window.location.origin);
        url.searchParams.set("prompt", text);
        router.push(url.toString());
      }
    },
    [value, loading, router],
  );

  // Seed the builder from a real gallery template via the existing
  // /dev?template=<source> wire (source = the template's gallery URL).
  const handleTemplate = (source: string) => {
    setLoading(true);
    router.push(templateBuilderLink(source));
  };

  const looksLikeRepo = isGitUrl(value);
  const filteredTemplates = templates.filter((t) =>
    repoFilter.trim()
      ? (t.title + " " + t.category + " " + t.framework)
          .toLowerCase()
          .includes(repoFilter.trim().toLowerCase())
      : true,
  );

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <HanzoBrand markClassName="h-7 w-7" />
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/projects", label: "Projects" },
                { href: "/gallery", label: "Gallery" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-1.5 text-sm text-white/55 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <OrgSwitcher />
                <UserMenu />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Log In
                </Button>
                <Button onClick={() => router.push("/login")}>Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero + composer */}
      <main className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* ambient glow behind the composer */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-3xl bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_70%)]"
        />

        <section className="relative pt-16 text-center sm:pt-20">
          <h1 className="text-balance text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
            Let&rsquo;s build something new
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/50 sm:text-lg">
            Describe an app to build, or paste a Git repository to deploy as a
            service. Hanzo builds, ships, and manages it.
          </p>

          {/* Composer */}
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <div
              onDrop={onComposerDrop}
              onDragOver={onComposerDragOver}
              onDragLeave={onComposerDragLeave}
              className={`group relative rounded-2xl border bg-white/[0.03] p-2 shadow-2xl shadow-black/40 transition-colors focus-within:border-white/25 ${
                dragActive ? "border-white/40 bg-white/[0.06]" : "border-white/12"
              }`}
            >
              {dragActive && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-white/40 bg-black/50 backdrop-blur-sm">
                  <span className="flex items-center gap-2 text-sm font-medium text-white">
                    <FolderUp className="h-5 w-5" />
                    Drop your project folder or .zip to import
                  </span>
                </div>
              )}
              <textarea
                ref={taRef}
                rows={2}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Describe the app you want, or paste a GitHub / GitLab repository URL…"
                className="max-h-40 min-h-[52px] w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
              />
              <div className="flex items-center justify-between px-2 pb-1 pt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Import a project — .zip or files"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
                  >
                    <Paperclip className="h-[18px] w-[18px]" />
                  </button>
                  <span className="ml-1 hidden text-xs text-white/35 sm:inline">
                    {looksLikeRepo
                      ? "Deploys this repository as a service"
                      : "Press ⏎ to build · ⇧⏎ for a new line"}
                  </span>
                </div>
                <Button
                  onClick={() => submit()}
                  disabled={loading || !value.trim()}
                  className="h-9 gap-1.5 rounded-xl px-4"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {looksLikeRepo ? "Deploy" : "Build"}
                      <ArrowUp className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Import affordance — drag & drop, or pick a folder / .zip. */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-white/40">
              {importing ? (
                <span className="inline-flex items-center gap-1.5 text-white/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Importing your project…
                </span>
              ) : (
                <>
                  <FolderUp className="h-3.5 w-3.5 text-white/35" />
                  <span>Drag &amp; drop your project, or</span>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="rounded text-white/70 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-white/40"
                  >
                    choose a folder
                  </button>
                  <span className="text-white/25">·</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded text-white/70 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-white/40"
                  >
                    .zip or files
                  </button>
                </>
              )}
            </div>

            {/* Hidden pickers — a .zip / loose files, or a whole directory. */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".zip,text/*,.html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.md,.svg,.xml,.yml,.yaml,.vue,.svelte,.astro"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) importFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              // `webkitdirectory`/`directory` aren't in React's input types, so
              // set them imperatively — one honest cast-free path to a folder picker.
              ref={(el) => {
                folderInputRef.current = el;
                if (el) {
                  el.setAttribute("webkitdirectory", "");
                  el.setAttribute("directory", "");
                }
              }}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) importFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Quick starts */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {QUICK_STARTS.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      setValue(q.prompt);
                      taRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-white/70 transition-all hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-white/45" />
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Import / Templates */}
        <section className="relative mt-16 grid gap-6 lg:mt-20 lg:grid-cols-2">
          {/* Import Git Repository — real connected-account import */}
          <ImportGitPanel />

          {/* Clone Template */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-[18px] w-[18px] text-white/70" />
                <h2 className="text-[15px] font-medium">Clone a Template</h2>
              </div>
              <div className="relative hidden w-40 sm:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <input
                  value={repoFilter}
                  onChange={(e) => setRepoFilter(e.target.value)}
                  placeholder="Filter"
                  className="h-8 w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-2 text-xs text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none"
                />
              </div>
            </div>

            {!galleryLoading && !galleryLive && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300/90">
                <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Showing built-in starters — the live gallery is unreachable right now.</span>
              </div>
            )}

            <div className="custom-scrollbar -mr-2 max-h-[420px] space-y-2 overflow-y-auto pr-2">
              {galleryLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[68px] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
                    />
                  ))
                : filteredTemplates.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => handleTemplate(t.source)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3 text-left transition-all hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60">
                        <FileCode2 className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{t.title}</div>
                        <div className="truncate text-xs text-white/40">
                          {[t.framework, t.category].filter(Boolean).join(" · ") || "Starter"}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-white" />
                    </button>
                  ))}
              {!galleryLoading && filteredTemplates.length === 0 && (
                <div className="py-10 text-center text-sm text-white/40">
                  No templates match &ldquo;{repoFilter}&rdquo;.
                </div>
              )}
            </div>

            <Link
              href="/gallery"
              className="mt-4 inline-flex items-center gap-1 text-sm text-white/45 transition-colors hover:text-white"
            >
              Browse all templates
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.22);
        }
      `}</style>
    </div>
  );
}
