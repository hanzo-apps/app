"use client";

import { useState, useEffect } from "react";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import Link from "next/link";
import { HanzoLogo } from "@/components/HanzoLogo";
import Header from "@/components/layout/header";
import { UserMenu } from "@/components/user-menu";
import {
  ArrowRight,
  Plus,
  Loader2,
  Globe2,
  Mic,
  Sparkles,
  Zap,
  Menu,
  X
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

interface Project {
  namespace: string;
  id: string;
  name: string;
  emoji: string;
  short_description?: string;
  created_at: string;
  updated_at: string;
}

export default function LandingPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Popular");
  const [inputFocused, setInputFocused] = useState(false);

  // Fetch user's projects if logged in
  useEffect(() => {
    if (user) {
      setLoadingProjects(true);
      fetch("/api/me/projects")
        .then(res => {
          if (!res.ok) {
            console.warn(`Failed to load projects: status ${res.status}`);
            return { projects: [] };
          }
          return res.json();
        })
        .then(data => {
          setProjects(data.projects || []);
        })
        .catch(err => {
          console.warn("Failed to load projects:", err);
          setProjects([]);
        })
        .finally(() => setLoadingProjects(false));
    }
  }, [user]);


  const handleCreateProject = async () => {
    if (!prompt.trim()) return;

    // Always store the prompt, even if not logged in
    localStorage.setItem("initialPrompt", prompt);

    if (!user) {
      // Store that we should redirect to new project after login
      localStorage.setItem("redirectAfterLogin", "/dev");
      openLoginWindow();
      return;
    }

    setIsCreating(true);
    router.push("/new");
  };

  const showcaseProjects = [
    {
      id: "ai-dashboard",
      title: "AI Analytics Dashboard",
      author: "hanzo-showcase",
      authorAvatar: "📊",
      category: "Website",
      description: "Real-time AI model performance monitoring with beautiful visualizations",
      url: "https://analytics.hanzo.ai",
      remixes: 8420,
      featured: true
    },
    {
      id: "crypto-defi",
      title: "DeFi Trading Platform",
      author: "hanzo-labs",
      authorAvatar: "💎",
      category: "Website",
      description: "Decentralized exchange with advanced trading features and portfolio tracking",
      url: "https://defi.hanzo.ai",
      remixes: 15600,
      featured: true
    },
    {
      id: "saas-platform",
      title: "Team Collaboration Suite",
      author: "hanzo-enterprise",
      authorAvatar: "🚀",
      category: "B2B App",
      description: "Complete project management solution with AI-powered insights",
      url: "https://teams.hanzo.ai",
      remixes: 22100
    },
    {
      id: "ecommerce",
      title: "Modern E-commerce Store",
      author: "hanzo-commerce",
      authorAvatar: "🛍️",
      category: "Website",
      description: "Beautiful online store with AI-powered recommendations",
      url: "https://shop.hanzo.ai",
      remixes: 19800
    },
    {
      id: "social-app",
      title: "Social Media Platform",
      author: "hanzo-social",
      authorAvatar: "💬",
      category: "Consumer App",
      description: "Next-gen social platform with AI content moderation",
      url: "https://social.hanzo.ai",
      remixes: 31200
    },
    {
      id: "portfolio",
      title: "Developer Portfolio",
      author: "hanzo-design",
      authorAvatar: "🎨",
      category: "Website",
      description: "Stunning portfolio site with interactive 3D elements",
      url: "https://portfolio.hanzo.ai",
      remixes: 11300
    },
    {
      id: "ai-chatbot",
      title: "Customer Support Bot",
      author: "hanzo-ai",
      authorAvatar: "🤖",
      category: "Internal Tools",
      description: "Intelligent support system with natural language processing",
      url: "https://support.hanzo.ai",
      remixes: 9750
    },
    {
      id: "video-platform",
      title: "Video Streaming Platform",
      author: "hanzo-media",
      authorAvatar: "🎬",
      category: "Consumer App",
      description: "Netflix-like streaming service with AI recommendations",
      url: "https://stream.hanzo.ai",
      remixes: 28900
    }
  ];

  const categories = ["Popular", "Discover", "Internal Tools", "Website", "Personal", "Consumer App", "B2B App", "Prototype"];

  const filteredProjects = selectedCategory === "Popular"
    ? showcaseProjects
    : showcaseProjects.filter(p => p.category === selectedCategory || selectedCategory === "Discover");

  return (
    <div className="bg-[#0a0a0a] text-white">
      {/* Gradient background - subtle but dynamic */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] bg-gradient-radial from-violet-500/15 via-purple-500/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
      </div>

      {/* Navigation Header */}
      <Header />

      <main className="relative z-10">
        {/* Hero Section - Big, engaging input */}
        <section className="px-4 md:px-8 pt-16 md:pt-24 pb-20 md:pb-32">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 md:mb-8 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Powered by Hanzo AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6">
              Build something{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  amazing
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-400/20 via-purple-400/20 to-pink-400/20 blur-2xl -z-10" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-8 md:mb-16 max-w-2xl mx-auto px-4">
              Describe your dream app and watch Hanzo AI bring it to life in seconds
            </p>

            {/* Large, prominent input box - responsive */}
            <div className="max-w-3xl mx-auto px-4 md:px-0">
              <div className={`relative bg-[#141414] rounded-xl md:rounded-2xl shadow-2xl border transition-all duration-300 ${
                inputFocused ? 'border-violet-500/50 shadow-violet-500/20' : 'border-white/10'
              }`}>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 rounded-xl md:rounded-2xl blur opacity-0 transition-opacity duration-300"
                  style={{ opacity: inputFocused ? 0.6 : 0 }}
                />
                <div className="relative flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 md:p-4">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Create a SaaS dashboard with user authentication..."
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-white/30 text-base md:text-lg focus:outline-none px-2 py-2 md:py-0"
                    disabled={isCreating}
                  />
                  <div className="flex items-center gap-2 justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                      <button className="p-2 md:p-2.5 hover:bg-white/5 rounded-lg md:rounded-xl transition-all group">
                        <Plus className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                      </button>
                      <button className="p-2 md:p-2.5 hover:bg-white/5 rounded-lg md:rounded-xl transition-all group flex items-center gap-1.5">
                        <Globe2 className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                        <span className="hidden sm:inline text-xs text-white/40 group-hover:text-white/60">Public</span>
                      </button>
                      <button className="p-2 md:p-2.5 hover:bg-white/5 rounded-lg md:rounded-xl transition-all group">
                        <Mic className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                      </button>
                    </div>
                    <Button
                      onClick={handleCreateProject}
                      disabled={isCreating || !prompt.trim()}
                      className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Create
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick action prompts - responsive grid */}
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 justify-center mt-6 md:mt-8">
                <button
                  onClick={() => setPrompt("Build a modern SaaS landing page with pricing tiers")}
                  className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs md:text-sm font-medium"
                >
                  ✨ SaaS Landing
                </button>
                <button
                  onClick={() => setPrompt("Create an AI chatbot interface with conversation history")}
                  className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs md:text-sm font-medium"
                >
                  🤖 AI Chatbot
                </button>
                <button
                  onClick={() => setPrompt("Design a crypto trading dashboard with real-time charts")}
                  className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs md:text-sm font-medium"
                >
                  📊 Trading Dashboard
                </button>
                <button
                  onClick={() => setPrompt("Build a social media app with posts and comments")}
                  className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs md:text-sm font-medium"
                >
                  💬 Social App
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Section - Made with Hanzo */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 px-3 md:px-4 py-1.5">
                <Sparkles className="w-4 h-4 mr-2" />
                Built with Hanzo AI
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Incredible apps created by our community</h2>
              <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto px-4">
                From startups to enterprises, see what teams are building with Hanzo
              </p>
            </div>

            {/* Category Filter - horizontal scroll on mobile */}
            <div className="flex items-center gap-2 md:gap-3 mb-8 md:mb-12 overflow-x-auto pb-2 px-2 md:px-0 md:justify-center scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Project Grid - responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group cursor-pointer relative"
                  onClick={() => window.open(project.url, '_blank')}
                >
                  {project.featured && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs px-2 py-1 rounded-lg font-semibold shadow-lg">
                        Featured
                      </div>
                    </div>
                  )}
                  <div className="bg-[#1a1a1a] rounded-xl md:rounded-2xl overflow-hidden border border-white/10 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1">
                    <div className="aspect-video bg-gradient-to-br from-violet-900/30 via-purple-900/30 to-pink-900/30 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl md:text-6xl">{project.authorAvatar}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-4 md:p-5">
                      <h3 className="font-semibold text-sm md:text-base mb-2 group-hover:text-violet-400 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs md:text-sm text-white/60 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 md:w-6 h-5 md:h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                            <span className="text-[10px] md:text-xs">{project.authorAvatar}</span>
                          </div>
                          <span className="text-xs text-white/50">{project.author}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/40">
                          <Sparkles className="w-3 h-3" />
                          {project.remixes.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8 md:mt-12 space-y-4">
              <p className="text-sm text-white/60">
                Want to see more amazing projects? Check out our community gallery!
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => router.push('/gallery')}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
                >
                  <Globe2 className="w-4 h-4 mr-2" />
                  View Full Gallery
                </Button>
                <Button
                  onClick={() => router.push('/community')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold"
                >
                  Explore Community
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* User's Recent Projects (if logged in) */}
        {user && projects.length > 0 && (
          <section className="px-4 md:px-8 py-16 md:py-20">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8 md:mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Continue Building</h2>
                  <p className="text-white/60 text-sm md:text-base">Jump back into your recent projects</p>
                </div>
                <Button
                  onClick={() => router.push('/projects')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 text-sm md:text-base"
                >
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {projects.slice(0, 4).map((project) => (
                  <div
                    key={`${project.namespace}/${project.id}`}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/projects/${project.namespace}/${project.id}`)}
                  >
                    <div className="bg-[#1a1a1a] rounded-xl md:rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:shadow-xl">
                      <div className="aspect-video bg-gradient-to-br from-violet-900/20 to-purple-900/20 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl">
                          {project.emoji || "🚀"}
                        </div>
                      </div>
                      <div className="p-4 md:p-5">
                        <h3 className="font-semibold text-sm md:text-base mb-1">
                          {project.name}
                        </h3>
                        {project.short_description && (
                          <p className="text-xs md:text-sm text-white/60 line-clamp-2">
                            {project.short_description}
                          </p>
                        )}
                        <div className="mt-3 text-xs text-white/40">
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer - responsive */}
      <footer className="relative z-10 bg-[#0a0a0a] border-t border-white/10 mt-16 md:mt-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Top Footer Section - responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            {/* Product Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Product</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/features" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Features</Link></li>
                <li><Link href="/integrations" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Integrations</Link></li>
                <li><Link href="/pricing" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Changelog</Link></li>
                <li><Link href="/roadmap" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            {/* Solutions Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Solutions</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/startups" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Startups</Link></li>
                <li><Link href="/enterprise" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Enterprise</Link></li>
                <li><Link href="/agencies" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Agencies</Link></li>
                <li><Link href="/developers" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Developers</Link></li>
                <li><Link href="/designers" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Designers</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Resources</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/docs" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Documentation</Link></li>
                <li><Link href="/tutorials" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Tutorials</Link></li>
                <li><Link href="/blog" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Blog</Link></li>
                <li><Link href="/community" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Community</Link></li>
                <li><Link href="/templates" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Templates</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Company</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/about" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Press</Link></li>
                <li><Link href="/partners" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Partners</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Support</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/help" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Help Center</Link></li>
                <li><Link href="/status" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Status</Link></li>
                <li><Link href="/security" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Security</Link></li>
                <li><Link href="/api" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">API</Link></li>
                <li><Link href="/report" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Report Issue</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Legal</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/privacy" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Terms</Link></li>
                <li><Link href="/cookies" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Cookies</Link></li>
                <li><Link href="/licenses" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Licenses</Link></li>
                <li><Link href="/compliance" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer - responsive */}
          <div className="pt-6 md:pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              {/* Logo and Copyright */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                <div className="flex items-center gap-3">
                  <HanzoLogo className="w-6 md:w-7 h-6 md:h-7 text-white" />
                  <span className="text-base md:text-lg font-bold">Hanzo</span>
                </div>
                <span className="text-xs md:text-sm text-white/40">
                  © 2025 Hanzo AI, Inc. All rights reserved.
                </span>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 md:gap-5">
                <Link href="https://twitter.com/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </Link>
                <Link href="https://github.com/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd"/>
                  </svg>
                </Link>
                <Link href="https://discord.gg/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </Link>
                <Link href="https://linkedin.com/company/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
                <Link href="https://youtube.com/@hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Add custom scrollbar styles for mobile */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}