"use client";

import { SizableText, YStack, XStack, H1, Paragraph, H2 } from '@hanzo/gui';
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, toast, Textarea, Input } from '@hanzo/ui';
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
import { ImportGitPanel } from "@/components/import-git-panel";
import { UserMenu } from "@/components/user-menu";
import { useUser } from "@/hooks/useUser";
import { OrgProvider } from "@/lib/org/client";
import { OrgGate, OrgSwitcher } from "@/components/org-switcher";
import { isGitUrl, gitUrlGateMessage } from "@/lib/git/url";
import { useProjectImport } from "@/lib/import/use-project-import";

function NewProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forwarded = useRef(false);

  // A "Deploy on Hanzo" README badge links to /new?template=<repo> (the OSS
  // Author program's one-click deploy). Forward that straight into the builder so
  // the repo loads AND its sourceRepo provenance is captured (/dev persists it) —
  // this is what makes the eventual deploy attributable to the repo's OSS author.
  useEffect(() => {
    if (forwarded.current) return;
    const repo = searchParams.get("template") || searchParams.get("repo");
    if (!repo) return;
    forwarded.current = true;
    const url = new URL("/dev", window.location.origin);
    url.searchParams.set("template", repo);
    url.searchParams.set("action", searchParams.get("action") || "deploy");
    router.replace(url.toString());
  }, [searchParams, router]);

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
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Header */}
      <YStack position="sticky" top="$0" zIndex={20} borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" backdropFilter="blur(24px)">
        <XStack alignSelf="center" height="$9" maxWidth={1152} alignItems="center" justifyContent="space-between" paddingHorizontal="$4" $sm={{ paddingHorizontal: "$5" }}>
          <XStack alignItems="center" gap="$5">
            <Link href="/"><XStack alignItems="center" gap="$2">
              <HanzoBrand markSize={28} wordmarkFromSm />
            </XStack></Link>
            <YStack display="none" alignItems="center" gap="$1">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/projects", label: "Projects" },
                { href: "/gallery", label: "Gallery" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                ><SizableText borderRadius="$3" paddingHorizontal="$3" paddingVertical="$1.5" fontSize="$3" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}>
                  {l.label}
                </SizableText></Link>
              ))}
            </YStack>
          </XStack>

          <XStack alignItems="center" gap="$3">
            {user ? (
              <>
                <OrgSwitcher />
                <UserMenu />
              </>
            ) : (
              <XStack alignItems="center" gap="$2">
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Log In
                </Button>
                <Button onClick={() => router.push("/login")}>Sign Up</Button>
              </XStack>
            )}
          </XStack>
        </XStack>
      </YStack>

      {/* Hero + composer */}
      <YStack position="relative" alignSelf="center" maxWidth={1152} paddingHorizontal="$4" paddingBottom="$12" $sm={{ paddingHorizontal: "$5" }}>
        {/* ambient glow behind the composer */}
        <YStack
          aria-hidden
          pointerEvents="none" position="absolute" left="$0" right="$0" top="$0" alignSelf="center" height={420} maxWidth={768} backgroundColor="$color005" filter="blur(130px)"
  />

        <YStack position="relative" paddingTop="$10" $sm={{ paddingTop: "$11" }}>
          <H1 fontSize="$11" fontWeight="500" letterSpacing={-0.32} textAlign="center" $sm={{ fontSize: "$12" }} lineHeight="1.1">
            Let&rsquo;s build something new
          </H1>
          <Paragraph alignSelf="center" marginTop="$4" maxWidth={576} textAlign="center" fontSize="$4" color="$color11" $sm={{ fontSize: "$6" }} lineHeight="1.5">
            Describe an app to build, or paste a Git repository to deploy as a
            service. Hanzo builds, ships, and manages it.
          </Paragraph>

          {/* Composer */}
          <YStack alignSelf="center" marginTop="$6" maxWidth={672}>
            <YStack
              onDrop={onComposerDrop}
              onDragOver={onComposerDragOver}
              onDragLeave={onComposerDragLeave}
              group position="relative" borderRadius="$8" borderWidth={1} padding="$2" elevation={6} focusStyle={{ borderColor: "$color" }} {...{ borderColor: dragActive ? "$color" : "$borderColor", backgroundColor: dragActive ? "$color3" : "$color005" }}
            >
              {dragActive && (
                <XStack pointerEvents="none" position="absolute" top={0} right={0} bottom={0} left={0} zIndex={10} alignItems="center" justifyContent="center" borderRadius="$8" borderWidth={2} borderStyle="dashed" borderColor="$color" backgroundColor="$background" backdropFilter="blur(4px)">
                  <XStack alignItems="center" gap="$2">
                    <FolderUp size={20} />
                    <SizableText fontSize="$3" fontWeight="500" color="$color">Drop your project folder or .zip to import</SizableText>
                  </XStack>
                </XStack>
              )}
              <Textarea
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
                maxHeight="$17" minHeight={52} width="100%" backgroundColor="transparent" paddingHorizontal="$3" paddingTop="$2" fontSize={15} lineHeight="1.625" color="$color" placeholderTextColor="$color11" focusStyle={{ outlineWidth: 0 }}
  />
              <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$2" paddingBottom="$1" paddingTop="$1">
                <XStack alignItems="center" gap="$1">
                  <Button
                    type="button"
                    title="Import a project — .zip or files"
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost"
                    height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$5"
                  >
                    <Paperclip size={18} />
                  </Button>
                  <SizableText marginLeft="$1" display="none" fontSize="$1" color="$color11">
                    {looksLikeRepo
                      ? "Deploys this repository as a service"
                      : "Press ⏎ to build · ⇧⏎ for a new line"}
                  </SizableText>
                </XStack>
                <Button
                  onClick={() => submit()}
                  disabled={loading || !value.trim()}
                  gap="$1.5" borderRadius="$6" paddingHorizontal="$4"
                >
                  {loading ? (
                    <Loader2 size={16} />
                  ) : (
                    <>
                      {looksLikeRepo ? "Deploy" : "Build"}
                      <ArrowUp size={16} />
                    </>
                  )}
                </Button>
              </XStack>
            </YStack>

            {/* Import affordance — drag & drop, or pick a folder / .zip. */}
            <XStack marginTop="$2.5" flexWrap="wrap" alignItems="center" justifyContent="center" columnGap="$1.5" rowGap="$1">
              {importing ? (
                <XStack alignItems="center" gap="$1.5">
                  <Loader2 size={14} />
                  <SizableText fontSize="$1" color="$color11">Importing your project…</SizableText>
                </XStack>
              ) : (
                <>
                  <FolderUp size={14} />
                  <SizableText fontSize="$1" color="$color11">Drag &amp; drop your project, or</SizableText>
                  <Button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    borderRadius="$2"
                  >
                    <SizableText fontSize="$1" color="$color" textDecorationLine="underline">choose a folder</SizableText>
                  </Button>
                  <SizableText fontSize="$1" color="$color11">·</SizableText>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    borderRadius="$2"
                  >
                    <SizableText fontSize="$1" color="$color" textDecorationLine="underline">.zip or files</SizableText>
                  </Button>
                </>
              )}
            </XStack>

            {/* Hidden pickers — a .zip / loose files, or a whole directory. */}
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".zip,text/*,.html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.md,.svg,.xml,.yml,.yaml,.vue,.svelte,.astro"
              display="none"
              onChange={(e) => {
                if (e.target.files?.length) importFiles(e.target.files);
                e.target.value = "";
              }}
  />
            <Input
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
              display="none"
              onChange={(e) => {
                if (e.target.files?.length) importFiles(e.target.files);
                e.target.value = "";
              }}
  />

            {/* Quick starts */}
            <XStack marginTop="$3" flexWrap="wrap" justifyContent="center" gap="$2">
              {QUICK_STARTS.map((q) => {
                const Icon = q.icon;
                return (
                  <Button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      setValue(q.prompt);
                      taRef.current?.focus();
                    }}
                    alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color005" paddingHorizontal="$3.5" paddingVertical="$1.5" hoverStyle={{ y: -1, borderColor: "$color06", backgroundColor: "$color3" }}
                  >
                    <Icon size={16} color="var(--muted-foreground)" />
                    <SizableText fontSize="$3" color="$color">{q.label}</SizableText>
                  </Button>
                );
              })}
            </XStack>
          </YStack>
        </YStack>

        {/* Import / Templates */}
        {/* [&>*]:min-w-0 lets each grid item shrink below its content's
            min-content (long repo/template strings) so the track can't blow the
            column past the viewport — otherwise mobile gets a horizontal scroll. */}
        <YStack position="relative" marginTop="$10" gap="$5" $lg={{ marginTop: "$11" }} className="shrink-cells">
          {/* Import Git Repository — real connected-account import */}
          <ImportGitPanel />

          {/* Clone Template */}
          <YStack borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$4.5" $sm={{ padding: "$5" }}>
            <XStack marginBottom="$4" alignItems="center" justifyContent="space-between" gap="$3">
              <XStack alignItems="center" gap="$2">
                <Boxes size={18} />
                <H2 fontSize={15} fontWeight="500">Clone a Template</H2>
              </XStack>
              <YStack position="relative" display="none" width="$17">
                <Search size={14} />
                <Input
                  value={repoFilter}
                  onChange={(e) => setRepoFilter(e.target.value)}
                  placeholder="Filter"
                  height="$6" width="100%" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingLeft="$6" paddingRight="$2" fontSize="$1" color="$color" placeholderTextColor="$color11" focusStyle={{ borderColor: "$color", outlineWidth: 0 }}
  />
              </YStack>
            </XStack>

            {/* Neutral, not amber: the icon and the sentence already carry the
                degraded state, so the hue was both off-palette and the least
                accessible half of the signal. */}
            {!galleryLoading && !galleryLive && (
              <XStack marginBottom="$4" alignItems="flex-start" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$2.5">
                <CloudOff size={16} />
                <SizableText fontSize="$1" color="$color11">Showing built-in starters — the live gallery is unreachable right now.</SizableText>
              </XStack>
            )}

            <YStack marginRight="$-2" maxHeight={420} rowGap="$2" paddingRight="$2" overflow="scroll" className="thin-scrollbar">
              {galleryLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <YStack
                      key={i}
                      height={68} borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3"
  />
                  ))
                : filteredTemplates.map((t) => (
                    <Button
                      key={t.slug}
                      type="button"
                      onClick={() => handleTemplate(t.source)}
                      group width="100%" alignItems="center" gap="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$3" hoverStyle={{ y: -1, borderColor: "$color06", backgroundColor: "$color4" }}
                    >
                      <XStack height={36} width={36} flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color4">
                        <FileCode2 size={18} />
                      </XStack>
                      <YStack minWidth={0} flex={1}>
                        <SizableText numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">{t.title}</SizableText>
                        <SizableText numberOfLines={1} fontSize="$1" color="$color11">
                          {[
                            t.framework,
                            t.category,
                            // One card = one template; say how many shapes it ships in.
                            t.variants?.length ? `${t.variants.length} variants` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Starter"}
                        </SizableText>
                      </YStack>
                      <ArrowRight size={16} />
                    </Button>
                  ))}
              {!galleryLoading && filteredTemplates.length === 0 && (
                <SizableText paddingVertical="$7" textAlign="center" fontSize="$3" color="$color11">
                  No templates match &ldquo;{repoFilter}&rdquo;.
                </SizableText>
              )}
            </YStack>

            <Link
              href="/templates"
            ><XStack marginTop="$4" alignItems="center" gap="$1">
              <SizableText fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}>Browse all templates</SizableText>
              <ChevronRight size={16} />
            </XStack></Link>
          </YStack>
        </YStack>
      </YStack>

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
    </YStack>
  );
}

/**
 * The query string is an input here (?template, ?repo), and `useSearchParams`
 * opts a page out of static prerendering unless a Suspense boundary marks the
 * client-only part. See app/dev/page.tsx for why this is now each page's own
 * declaration rather than a side effect of the root layout.
 */
export default function NewProjectPage() {
  return (
    <Suspense fallback={null}>
      <NewProject />
    </Suspense>
  );
}
