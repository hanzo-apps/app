"use client";

import Link from "next/link";
import { Button } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { Badge } from "@hanzo/ui";
import { ArrowRight, Star, GitFork, Heart, MessageSquare, Users, Code2, Sparkles, Trophy, Zap } from "lucide-react";
import { useState } from "react";

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Templates", "Components", "AI Models", "Integrations", "Tutorials"];

  const communityProjects = [
    {
      id: "1",
      title: "E-commerce Platform Template",
      description: "Full-featured online store with payment processing, inventory management, and analytics dashboard",
      author: "alex_dev",
      authorAvatar: "👨‍💻",
      stars: 1234,
      forks: 256,
      likes: 890,
      category: "Templates",
      tags: ["React", "Next.js", "Stripe", "PostgreSQL"],
      featured: true
    },
    {
      id: "2",
      title: "AI Chat Component",
      description: "Customizable chat interface with streaming responses and markdown support",
      author: "sarah_ai",
      authorAvatar: "👩‍🔬",
      stars: 2456,
      forks: 512,
      likes: 1890,
      category: "Components",
      tags: ["TypeScript", "Tailwind", "OpenAI"],
    },
    {
      id: "3",
      title: "Vision Model Fine-tuning",
      description: "Pre-trained model for object detection and image classification tasks",
      author: "ml_wizard",
      authorAvatar: "🧙‍♂️",
      stars: 3567,
      forks: 890,
      likes: 2340,
      category: "AI Models",
      tags: ["PyTorch", "Computer Vision", "YOLO"],
    },
    {
      id: "4",
      title: "Slack Integration",
      description: "Connect your Hanzo apps with Slack for notifications and commands",
      author: "integration_master",
      authorAvatar: "🔌",
      stars: 890,
      forks: 123,
      likes: 567,
      category: "Integrations",
      tags: ["API", "Webhooks", "OAuth"],
    },
    {
      id: "5",
      title: "Building a SaaS with Hanzo",
      description: "Step-by-step guide to creating a multi-tenant SaaS application",
      author: "tutorial_pro",
      authorAvatar: "📚",
      stars: 4567,
      forks: 1234,
      likes: 3456,
      category: "Tutorials",
      tags: ["Tutorial", "SaaS", "Best Practices"],
      featured: true
    },
    {
      id: "6",
      title: "Dashboard UI Kit",
      description: "Beautiful dashboard components with dark mode support",
      author: "ui_designer",
      authorAvatar: "🎨",
      stars: 2345,
      forks: 567,
      likes: 1890,
      category: "Components",
      tags: ["UI/UX", "Charts", "Dark Mode"],
    }
  ];

  const filteredProjects = selectedCategory === "All"
    ? communityProjects
    : communityProjects.filter(p => p.category === selectedCategory);

  const topContributors = [
    { name: "alex_dev", avatar: "👨‍💻", contributions: 45, badge: "🥇" },
    { name: "sarah_ai", avatar: "👩‍🔬", contributions: 38, badge: "🥈" },
    { name: "ml_wizard", avatar: "🧙‍♂️", contributions: 32, badge: "🥉" },
    { name: "ui_designer", avatar: "🎨", contributions: 28 },
    { name: "tutorial_pro", avatar: "📚", contributions: 24 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <HanzoLogo className="w-8 h-8 text-white" />
              <span className="text-xl font-bold">Hanzo</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/community" className="text-white font-medium">Community</Link>
              <Link href="/pricing" className="text-white/70 hover:text-white">Pricing</Link>
              <Link href="/enterprise" className="text-white/70 hover:text-white">Enterprise</Link>
              <Link href="/learn" className="text-white/70 hover:text-white">Learn</Link>
            </div>
          </div>
          <Button className="bg-white text-black hover:bg-white/90">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] text-white border-0">
            <Users className="w-4 h-4 mr-2" />
            50,000+ Developers Building
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Join the Hanzo{" "}
            <span className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] bg-clip-text text-transparent">
              Community
            </span>
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Discover amazing projects, share your creations, and collaborate with developers building the future of AI
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] hover:from-[#e03e3e] hover:to-[#fd4444]">
              Share Your Project
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Browse Projects
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 md:px-8 py-12 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] bg-clip-text text-transparent">
                50K+
              </div>
              <div className="text-white/60 mt-2">Active Developers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] bg-clip-text text-transparent">
                10K+
              </div>
              <div className="text-white/60 mt-2">Projects Shared</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] bg-clip-text text-transparent">
                250K+
              </div>
              <div className="text-white/60 mt-2">Components Used</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] bg-clip-text text-transparent">
                1M+
              </div>
              <div className="text-white/60 mt-2">Apps Deployed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Community Projects</h2>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Code2 className="w-5 h-5 mr-2" />
              Submit Project
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div key={project.id} className="bg-[#1a1a1a] rounded-2xl border border-white/10 hover:border-[#fd4444]/50 transition-all overflow-hidden group">
                {project.featured && (
                  <div className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] text-white text-xs px-3 py-1.5 flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Featured Project
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-[#fd4444] transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-white/60 mb-4">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center">
                      <span className="text-xs">{project.authorAvatar}</span>
                    </div>
                    <span className="text-sm text-white/50">{project.author}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/70">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {project.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      {project.forks}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {project.likes}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Contributors */}
      <section className="px-4 md:px-8 py-16 bg-gradient-to-b from-transparent via-[#fd4444]/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] text-white border-0">
              <Zap className="w-4 h-4 mr-2" />
              This Month
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Top Contributors</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Recognizing the developers who make our community amazing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topContributors.map((contributor, index) => (
              <div key={contributor.name} className="bg-[#1a1a1a] rounded-2xl p-6 text-center border border-white/10 hover:border-[#fd4444]/50 transition-all">
                <div className="text-2xl mb-2">{contributor.badge}</div>
                <div className="text-4xl mb-3">{contributor.avatar}</div>
                <div className="font-semibold mb-2">{contributor.name}</div>
                <div className="text-sm text-white/60">{contributor.contributions} contributions</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Share Your Creation?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Join thousands of developers building amazing things with Hanzo AI
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button size="lg" className="bg-white text-black hover:bg-white/90">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Building
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <MessageSquare className="w-5 h-5 mr-2" />
              Join Discord
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}