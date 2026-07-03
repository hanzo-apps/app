"use client";

import Link from "next/link";
import { Button } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { Badge } from "@hanzo/ui";
import { Rocket, TrendingUp, Users, Globe, Calendar, ExternalLink, Star, Award } from "lucide-react";
import { useState } from "react";

export default function LaunchedPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("This Week");

  const periods = ["Today", "This Week", "This Month", "All Time"];

  const launches = [
    {
      id: "1",
      title: "AI Resume Builder",
      tagline: "Create stunning resumes with AI-powered suggestions",
      description: "An intelligent resume builder that uses AI to optimize your resume for ATS systems and suggest improvements based on job descriptions.",
      maker: "alex_chen",
      makerAvatar: "👨‍💻",
      votes: 342,
      comments: 56,
      category: "Productivity",
      featured: true,
      rank: 1,
      launchedAt: "2 hours ago",
      url: "https://airesume.hanzo.ai"
    },
    {
      id: "2",
      title: "CodeSync",
      tagline: "Real-time collaborative coding with AI assistance",
      description: "Collaborate on code in real-time with team members while getting AI-powered suggestions and bug detection.",
      maker: "sarah_dev",
      makerAvatar: "👩‍💻",
      votes: 289,
      comments: 42,
      category: "Developer Tools",
      rank: 2,
      launchedAt: "5 hours ago",
      url: "https://codesync.hanzo.ai"
    },
    {
      id: "3",
      title: "DesignAI Studio",
      tagline: "Generate stunning designs from text descriptions",
      description: "Transform your ideas into beautiful designs instantly. Just describe what you want and watch AI create it.",
      maker: "mike_design",
      makerAvatar: "🎨",
      votes: 267,
      comments: 38,
      category: "Design Tools",
      featured: true,
      rank: 3,
      launchedAt: "8 hours ago",
      url: "https://designai.hanzo.ai"
    },
    {
      id: "4",
      title: "DataViz Pro",
      tagline: "Turn complex data into beautiful visualizations",
      description: "Automatically create interactive charts and dashboards from your data with AI-powered insights.",
      maker: "data_wizard",
      makerAvatar: "📊",
      votes: 234,
      comments: 29,
      category: "Analytics",
      rank: 4,
      launchedAt: "12 hours ago",
      url: "https://dataviz.hanzo.ai"
    },
    {
      id: "5",
      title: "ChatBot Builder",
      tagline: "Create custom AI chatbots without code",
      description: "Build and deploy intelligent chatbots for your website or app in minutes using our visual builder.",
      maker: "bot_master",
      makerAvatar: "🤖",
      votes: 198,
      comments: 24,
      category: "AI Tools",
      rank: 5,
      launchedAt: "Yesterday",
      url: "https://chatbot.hanzo.ai"
    },
    {
      id: "6",
      title: "VideoAI Editor",
      tagline: "Edit videos with AI-powered automation",
      description: "Automatically edit your videos with AI: remove silence, add captions, enhance audio, and more.",
      maker: "video_pro",
      makerAvatar: "🎬",
      votes: 176,
      comments: 18,
      category: "Video Tools",
      rank: 6,
      launchedAt: "Yesterday",
      url: "https://videoai.hanzo.ai"
    }
  ];

  const topMakers = [
    { name: "alex_chen", avatar: "👨‍💻", launches: 12, totalVotes: 4520 },
    { name: "sarah_dev", avatar: "👩‍💻", launches: 10, totalVotes: 3890 },
    { name: "mike_design", avatar: "🎨", launches: 8, totalVotes: 3210 },
    { name: "data_wizard", avatar: "📊", launches: 7, totalVotes: 2890 },
  ];

  const categories = [
    "All", "AI Tools", "Developer Tools", "Productivity", "Design Tools",
    "Analytics", "Video Tools", "Marketing", "Education"
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
              <Link href="/community" className="text-white/70 hover:text-white">Community</Link>
              <Link href="/pricing" className="text-white/70 hover:text-white">Pricing</Link>
              <Link href="/enterprise" className="text-white/70 hover:text-white">Enterprise</Link>
              <Link href="/learn" className="text-white/70 hover:text-white">Learn</Link>
              <Link href="/launched" className="text-white font-medium">Launched</Link>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400">
            <Rocket className="w-5 h-5 mr-2" />
            Launch Your Project
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
            <Rocket className="w-4 h-4 mr-2" />
            Product Hunt for AI
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover the latest{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              AI innovations
            </span>
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            See what the community is building and launch your own AI products
          </p>
        </div>
      </section>

      {/* Period Filter */}
      <section className="px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {periods.map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedPeriod === period
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Launches List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Top Launches</h2>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white/40" />
                  <span className="text-white/60">{selectedPeriod}</span>
                </div>
              </div>

              <div className="space-y-4">
                {launches.map(launch => (
                  <div key={launch.id} className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10 hover:border-violet-500/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-violet-400">#{launch.rank}</div>
                        <button className="mt-2 p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <TrendingUp className="w-5 h-5 text-white/60" />
                        </button>
                        <div className="text-sm text-white/60 mt-1">{launch.votes}</div>
                      </div>

                      <div className="flex-1">
                        {launch.featured && (
                          <Badge className="mb-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}

                        <h3 className="text-xl font-semibold mb-1 hover:text-violet-400 transition-colors">
                          <a href={launch.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            {launch.title}
                            <ExternalLink className="w-4 h-4 opacity-50" />
                          </a>
                        </h3>

                        <p className="text-white/80 mb-2">{launch.tagline}</p>
                        <p className="text-sm text-white/60 mb-4">{launch.description}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                <span className="text-xs">{launch.makerAvatar}</span>
                              </div>
                              <span className="text-sm text-white/50">{launch.maker}</span>
                            </div>
                            <Badge className="bg-white/10 text-white/70 border-white/20">
                              {launch.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white/40">
                            <span>{launch.comments} comments</span>
                            <span>{launch.launchedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white">
                Load More Launches
              </Button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Top Makers */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Top Makers
                </h3>
                <div className="space-y-4">
                  {topMakers.map((maker, index) => (
                    <div key={maker.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-white/40">#{index + 1}</div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                          <span className="text-sm">{maker.avatar}</span>
                        </div>
                        <div>
                          <div className="font-medium">{maker.name}</div>
                          <div className="text-xs text-white/40">{maker.launches} launches</div>
                        </div>
                      </div>
                      <div className="text-sm text-white/60">{maker.totalVotes.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Badge
                      key={category}
                      className="bg-white/10 text-white/70 border-white/20 hover:bg-white/20 cursor-pointer"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Launch CTA */}
              <div className="bg-gradient-to-br from-violet-950/50 to-purple-950/50 rounded-2xl p-6 border border-violet-500/30">
                <h3 className="text-lg font-semibold mb-2">Ready to launch?</h3>
                <p className="text-sm text-white/60 mb-4">
                  Share your project with the community and get feedback
                </p>
                <Button className="w-full bg-white text-black hover:bg-white/90">
                  <Rocket className="w-5 h-5 mr-2" />
                  Launch Project
                </Button>
              </div>

              {/* Stats */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Platform Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Launches Today</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Active Makers</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Products</span>
                    <span className="font-semibold">10,567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Community Votes</span>
                    <span className="font-semibold">489K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}