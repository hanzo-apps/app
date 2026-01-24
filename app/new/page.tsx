"use client";

import { useState } from "react";
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
  Sparkles,
  ShoppingCart,
  Bot,
  BarChart3,
  Video,
  PenTool,
  FileText,
  Layers,
  MessageCircle,
  Bitcoin,
  Loader2,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { HanzoLogo } from "@/components/HanzoLogo";
import { UserMenu } from "@/components/user-menu";
import { useUser } from "@/hooks/useUser";

const templates = [
  {
    id: "ai-chat-interface",
    name: "AI Chatbot",
    description: "Interactive chat interface with AI capabilities",
    icon: <Bot className="w-5 h-5" />,
    color: "from-blue-500 to-purple-600",
    category: "AI"
  },
  {
    id: "ecommerce-storefront",
    name: "Commerce",
    description: "Modern e-commerce storefront with cart",
    icon: <ShoppingCart className="w-5 h-5" />,
    color: "from-green-500 to-emerald-600",
    category: "Commerce"
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Data visualization and metrics dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "from-[#fd4444] to-[#ff6b6b]",
    category: "Analytics"
  },
  {
    id: "video-streaming",
    name: "Video Platform",
    description: "Video streaming platform with playlists",
    icon: <Video className="w-5 h-5" />,
    color: "from-red-500 to-orange-600",
    category: "Media"
  },
  {
    id: "blog-platform",
    name: "Blog Platform",
    description: "Content management and blogging platform",
    icon: <FileText className="w-5 h-5" />,
    color: "from-[#fd4444] to-[#ff6b6b]",
    category: "Content"
  },
  {
    id: "kanban-board",
    name: "Kanban Board",
    description: "Project management with drag-and-drop",
    icon: <Layers className="w-5 h-5" />,
    color: "from-yellow-500 to-orange-600",
    category: "Productivity"
  },
  {
    id: "social-feed",
    name: "Social Feed",
    description: "Social media feed with interactions",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "from-pink-500 to-rose-600",
    category: "Social"
  },
  {
    id: "crypto-portfolio",
    name: "Crypto Portfolio",
    description: "Cryptocurrency portfolio tracker",
    icon: <Bitcoin className="w-5 h-5" />,
    color: "from-orange-500 to-red-600",
    category: "Finance"
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor",
    description: "Real-time markdown editor with preview",
    icon: <PenTool className="w-5 h-5" />,
    color: "from-gray-600 to-gray-800",
    category: "Tools"
  },
  {
    id: "saas-landing",
    name: "SaaS Landing",
    description: "Modern SaaS landing page template",
    icon: <Globe className="w-5 h-5" />,
    color: "from-teal-500 to-cyan-600",
    category: "Marketing"
  }
];

const frameworks = [
  { id: "next", name: "Next.js", icon: "▲" },
  { id: "react", name: "React", icon: "⚛️" },
  { id: "vue", name: "Vue", icon: "🟢" },
  { id: "svelte", name: "Svelte", icon: "🔥" },
  { id: "astro", name: "Astro", icon: "🚀" },
  { id: "remix", name: "Remix", icon: "💿" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useUser();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("next");

  const handleImport = (provider: string) => {
    if (!repoUrl.trim()) return;

    setLoading(true);

    // Navigate to /dev with the repo URL
    const url = new URL("/dev", window.location.origin);
    url.searchParams.set("repo", repoUrl);
    url.searchParams.set("action", "edit");

    router.push(url.toString());
  };

  const handleTemplate = (templateId: string) => {
    setLoading(true);

    // Navigate to /dev with the template
    const url = new URL("/dev", window.location.origin);
    url.searchParams.set("template", `https://github.com/Hanzo-Community/template-${templateId}`);
    url.searchParams.set("action", "deploy");

    router.push(url.toString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <HanzoLogo className="w-8 h-8" />
                <span className="font-semibold text-lg">Hanzo</span>
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
                <UserMenu />
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
                    className="w-full bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/20"
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
                    className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20"
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
              <select
                className="bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-1.5 focus:border-gray-700 outline-none"
                value={selectedFramework}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFramework(e.target.value)}
              >
                <option value="all">All Frameworks</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.icon} {fw.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:border-gray-700 transition-all cursor-pointer group"
                  onClick={() => handleTemplate(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${template.color} bg-opacity-10`}>
                        {template.icon}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{template.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Enhanced
                        </span>
                      </div>
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