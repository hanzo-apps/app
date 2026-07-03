"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import {
  Github,
  GitlabIcon,
  Globe,
  ArrowRight,
  Loader2,
  ChevronRight,
  CloudOff,
} from "lucide-react";
import Link from "next/link";
import { HanzoBrand } from "@/components/HanzoLogo";
import {
  fetchGalleryTemplates,
  templateBuilderLink,
  type GalleryTemplate,
} from "@/lib/api/templates";
import { UserMenu } from "@/components/user-menu";
import { useUser } from "@/hooks/useUser";
import { OrgProvider } from "@/lib/org/client";
import { OrgGate, OrgSwitcher } from "@/components/org-switcher";

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

function NewProjectInner() {
  const router = useRouter();
  const { user } = useUser();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleImport = (provider: string) => {
    if (!repoUrl.trim()) return;

    setLoading(true);

    // Navigate to /dev with the repo URL
    const url = new URL("/dev", window.location.origin);
    url.searchParams.set("repo", repoUrl);
    url.searchParams.set("action", "edit");

    router.push(url.toString());
  };

  // Seed the builder from a real gallery template via the existing
  // /dev?template=<source> wire (source = the template's gallery URL).
  const handleTemplate = (source: string) => {
    setLoading(true);
    router.push(templateBuilderLink(source));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <HanzoBrand markClassName="w-8 h-8" />
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Dashboard
                </Link>
                <Link href="/projects" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Projects
                </Link>
                <Link href="/gallery" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Gallery
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <OrgSwitcher />
                  <UserMenu />
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => router.push("/login")}>
                    Login
                  </Button>
                  <Button onClick={() => router.push("/login")}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Let's build something new
          </h1>
          <p className="text-gray-400 text-lg">
            To deploy a new Project, import an existing Git Repository or get started with one of our Templates.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Import Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Import Git Repository</h2>

            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardDescription className="text-gray-400">
                  Select a Git provider to import an existing project from a Git Repository.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-url" className="text-gray-300">
                    Repository URL
                  </Label>
                  <Input
                    id="repo-url"
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepoUrl(e.target.value)}
                    className="bg-gray-950 border-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleImport("github")}
                    className="w-full bg-gray-950 hover:bg-gray-900 text-white border border-gray-800"
                    disabled={loading || !repoUrl.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Github className="w-4 h-4 mr-2" />
                    )}
                    Continue with GitHub
                  </Button>

                  <Button
                    onClick={() => handleImport("gitlab")}
                    className="w-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                    disabled={loading || !repoUrl.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <GitlabIcon className="w-4 h-4 mr-2" />
                    )}
                    Continue with GitLab
                  </Button>

                  <Button
                    onClick={() => handleImport("bitbucket")}
                    className="w-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                    disabled={loading || !repoUrl.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Globe className="w-4 h-4 mr-2" />
                    )}
                    Continue with Bitbucket
                  </Button>
                </div>

                <div className="pt-4">
                  <Link
                    href="/import/third-party"
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    Import Third-Party Git Repository
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Clone Template</h2>
              <span className="text-xs text-gray-500">
                {galleryLoading
                  ? "Loading gallery…"
                  : `${templates.length} starter${templates.length === 1 ? "" : "s"}`}
              </span>
            </div>

            {!galleryLoading && !galleryLive && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
                <CloudOff className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Showing built-in starters — the live template gallery is
                  unreachable right now.
                </span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {galleryLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-40 rounded-xl border border-gray-800 bg-gray-900/50 animate-pulse"
                    />
                  ))
                : templates.map((template) => (
                    <Card
                      key={template.slug}
                      className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:border-gray-600 transition-all cursor-pointer group overflow-hidden"
                      onClick={() => handleTemplate(template.source)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base leading-tight">
                            {template.title}
                          </CardTitle>
                          <ArrowRight className="w-4 h-4 shrink-0 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                        {template.description && (
                          <CardDescription className="text-xs text-gray-400 line-clamp-2">
                            {template.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {template.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {template.features.slice(0, 3).map((f) => (
                              <span
                                key={f}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 truncate">{template.category}</span>
                          {template.framework && (
                            <span className="text-xs text-gray-500 truncate">{template.framework}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            <div className="mt-6">
              <Link
                href="/gallery"
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                Browse All Templates
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}