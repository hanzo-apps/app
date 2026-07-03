"use client";

import { useState } from "react";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import Link from "next/link";
import { HanzoLogo } from "@/components/HanzoLogo";
import {
  ArrowRight,
  Search,
  Menu,
  X,
  BookOpen,
  Code,
  Play,
  Zap,
  Users,
  MessageSquare,
  FileText,
  Settings,
  Globe,
  Database,
  Shield,
  Terminal,
  Rocket,
  Brain,
  Package,
  GitBranch,
  ExternalLink,
  ChevronRight,
  Star,
  Clock,
  Download
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function DocsPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Getting Started");

  const docCategories = [
    {
      id: "getting-started",
      name: "Getting Started",
      icon: <Rocket className="w-5 h-5" />,
      description: "Quick start guides and tutorials",
      color: "text-green-400"
    },
    {
      id: "api-reference",
      name: "API Reference",
      icon: <Terminal className="w-5 h-5" />,
      description: "Complete API documentation",
      color: "text-blue-400"
    },
    {
      id: "guides",
      name: "Guides",
      icon: <BookOpen className="w-5 h-5" />,
      description: "Step-by-step tutorials",
      color: "text-purple-400"
    },
    {
      id: "examples",
      name: "Examples",
      icon: <Code className="w-5 h-5" />,
      description: "Code samples and templates",
      color: "text-orange-400"
    },
    {
      id: "integrations",
      name: "Integrations",
      icon: <Package className="w-5 h-5" />,
      description: "Third-party integrations",
      color: "text-pink-400"
    },
    {
      id: "deployment",
      name: "Deployment",
      icon: <Globe className="w-5 h-5" />,
      description: "Hosting and deployment guides",
      color: "text-cyan-400"
    }
  ];

  const quickStartItems = [
    {
      icon: <Play className="w-6 h-6 text-green-400" />,
      title: "Create Your First Project",
      description: "Build a complete web application in under 5 minutes",
      time: "5 min",
      link: "/docs/quickstart/first-project"
    },
    {
      icon: <Code className="w-6 h-6 text-blue-400" />,
      title: "AI Code Generation",
      description: "Learn how to use natural language to generate code",
      time: "10 min",
      link: "/docs/quickstart/ai-generation"
    },
    {
      icon: <Globe className="w-6 h-6 text-purple-400" />,
      title: "Deploy Your App",
      description: "Deploy your application to production instantly",
      time: "3 min",
      link: "/docs/quickstart/deployment"
    },
    {
      icon: <Settings className="w-6 h-6 text-orange-400" />,
      title: "Configure Your Environment",
      description: "Set up your development environment and tools",
      time: "8 min",
      link: "/docs/quickstart/setup"
    }
  ];

  const popularDocs = [
    {
      title: "Authentication & User Management",
      description: "Implement secure authentication flows",
      category: "Guides",
      views: "12.4k",
      updated: "2 days ago",
      link: "/docs/guides/authentication"
    },
    {
      title: "Database Integration",
      description: "Connect and manage your databases",
      category: "API Reference",
      views: "8.7k",
      updated: "1 week ago",
      link: "/docs/api/database"
    },
    {
      title: "Real-time Features",
      description: "Add real-time functionality to your apps",
      category: "Guides",
      views: "6.2k",
      updated: "3 days ago",
      link: "/docs/guides/realtime"
    },
    {
      title: "React Components Library",
      description: "Pre-built components for React applications",
      category: "Examples",
      views: "15.1k",
      updated: "5 days ago",
      link: "/docs/examples/react-components"
    }
  ];

  const apiEndpoints = [
    {
      method: "POST",
      endpoint: "/api/projects",
      description: "Create a new project",
      methodColor: "text-green-400"
    },
    {
      method: "GET",
      endpoint: "/api/projects/{id}",
      description: "Get project details",
      methodColor: "text-blue-400"
    },
    {
      method: "PUT",
      endpoint: "/api/projects/{id}",
      description: "Update project settings",
      methodColor: "text-yellow-400"
    },
    {
      method: "DELETE",
      endpoint: "/api/projects/{id}",
      description: "Delete a project",
      methodColor: "text-red-400"
    }
  ];

  const tutorials = [
    {
      icon: "🚀",
      title: "Building a SaaS Dashboard",
      description: "Complete guide to building a SaaS application with authentication, billing, and analytics",
      level: "Intermediate",
      duration: "45 min",
      link: "/docs/tutorials/saas-dashboard"
    },
    {
      icon: "🛒",
      title: "E-commerce Store",
      description: "Create a full-featured e-commerce store with cart, checkout, and payment processing",
      level: "Advanced",
      duration: "60 min",
      link: "/docs/tutorials/ecommerce"
    },
    {
      icon: "📱",
      title: "Mobile-First Web App",
      description: "Build responsive web applications optimized for mobile devices",
      level: "Beginner",
      duration: "30 min",
      link: "/docs/tutorials/mobile-app"
    },
    {
      icon: "🤖",
      title: "AI-Powered Chatbot",
      description: "Integrate AI chat functionality into your applications",
      level: "Intermediate",
      duration: "40 min",
      link: "/docs/tutorials/ai-chatbot"
    }
  ];

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-blue-500/8 via-purple-500/4 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-white/10">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <HanzoLogo className="w-8 md:w-9 h-8 md:h-9 text-white" />
            <span className="text-xl md:text-2xl font-bold">Hanzo</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Features
            </Link>
            <Link href="/community" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Community
            </Link>
            <Link href="/pricing" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/enterprise" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Enterprise
            </Link>
            <Link href="/docs" className="text-white font-medium text-sm transition-colors">
              Docs
            </Link>
          </div>
        </div>

        {/* Desktop Nav Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Button
                onClick={() => router.push('/projects')}
                variant="ghost"
                className="text-white/70 hover:text-white text-sm font-medium"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/dev')}
                className="bg-white text-black hover:bg-white/90 text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                Get started
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={openLoginWindow}
                variant="ghost"
                className="text-white/70 hover:text-white text-sm font-medium"
              >
                Log in
              </Button>
              <Button
                onClick={openLoginWindow}
                className="bg-white text-black hover:bg-white/90 text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 md:hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Link href="/" className="flex items-center gap-2.5">
                <HanzoLogo className="w-8 h-8 text-white" />
                <span className="text-xl font-bold">Hanzo</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-8 px-4">
              <div className="space-y-6">
                <Link href="/features" className="block text-2xl font-medium text-white/90 hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="/community" className="block text-2xl font-medium text-white/90 hover:text-white transition-colors">
                  Community
                </Link>
                <Link href="/pricing" className="block text-2xl font-medium text-white/90 hover:text-white transition-colors">
                  Pricing
                </Link>
                <Link href="/enterprise" className="block text-2xl font-medium text-white/90 hover:text-white transition-colors">
                  Enterprise
                </Link>
                <Link href="/docs" className="block text-2xl font-medium text-white transition-colors">
                  Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 md:mb-8 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Documentation Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6">
              Everything you need to{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                  get started
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-violet-400/20 blur-2xl -z-10" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-12 max-w-3xl mx-auto">
              Comprehensive guides, API reference, examples, and tutorials to help you build amazing applications with Hanzo AI
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="pl-12 pr-4 py-3 bg-[#141414] border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
                <Button
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push('/docs/quickstart')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white px-8 py-3 rounded-xl font-semibold text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Quick Start
              </Button>
              <Button
                onClick={() => router.push('/docs/api')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-semibold text-lg"
              >
                <Terminal className="w-5 h-5 mr-2" />
                API Reference
              </Button>
            </div>
          </div>
        </section>

        {/* Documentation Categories */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0 px-4 py-1.5">
                <FileText className="w-4 h-4 mr-2" />
                Documentation Categories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Find what you're looking for</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Organized documentation to help you at every stage of your development journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docCategories.map((category) => (
                <Card
                  key={category.id}
                  className="bg-[#141414] border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                  onClick={() => router.push(`/docs/${category.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`${category.color}`}>
                        {category.icon}
                      </div>
                      <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors">
                        {category.name}
                      </CardTitle>
                      <ChevronRight className="w-4 h-4 text-white/40 ml-auto group-hover:text-white/60 transition-colors" />
                    </div>
                    <CardDescription className="text-white/60">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 px-4 py-1.5">
                <Rocket className="w-4 h-4 mr-2" />
                Quick Start
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get up and running in minutes</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Follow these essential guides to start building with Hanzo AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickStartItems.map((item, index) => (
                <Card
                  key={index}
                  className="bg-[#141414] border-white/10 hover:border-green-500/30 transition-all cursor-pointer group"
                  onClick={() => router.push(item.link)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg text-white group-hover:text-green-400 transition-colors">
                            {item.title}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-white/10 text-white/70">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.time}
                          </Badge>
                        </div>
                        <CardDescription className="text-white/60 mb-3">
                          {item.description}
                        </CardDescription>
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                          Read guide
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Documentation */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1.5">
                <Star className="w-4 h-4 mr-2" />
                Popular Docs
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Most viewed documentation</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                The most popular guides and references from our community
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {popularDocs.map((doc, index) => (
                <Card
                  key={index}
                  className="bg-[#141414] border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
                  onClick={() => router.push(doc.link)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg text-white group-hover:text-purple-400 transition-colors flex-1">
                        {doc.title}
                      </CardTitle>
                      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                    </div>
                    <CardDescription className="text-white/60 mb-3">
                      {doc.description}
                    </CardDescription>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-white/50">
                        <Badge variant="secondary" className="bg-white/10 text-white/70">
                          {doc.category}
                        </Badge>
                        <span>{doc.views} views</span>
                      </div>
                      <span className="text-white/40">Updated {doc.updated}</span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* API Reference Preview */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0 px-4 py-1.5">
                <Terminal className="w-4 h-4 mr-2" />
                API Reference
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete API documentation</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                RESTful API endpoints with detailed examples and responses
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-[#141414] border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    Projects API
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Manage your projects programmatically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiEndpoints.map((endpoint, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/docs/api/projects#${endpoint.endpoint.replace(/[{}\/]/g, '-')}`)}
                      >
                        <Badge className={`${endpoint.methodColor} bg-transparent border px-2 py-1 text-xs font-mono`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-white/80 font-mono text-sm flex-1">{endpoint.endpoint}</code>
                        <span className="text-white/60 text-sm">{endpoint.description}</span>
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={() => router.push('/docs/api')}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      View Full API Reference
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tutorials */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-orange-950/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 px-4 py-1.5">
                <Play className="w-4 h-4 mr-2" />
                Tutorials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Learn by building</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Step-by-step tutorials to help you build real-world applications
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tutorials.map((tutorial, index) => (
                <Card
                  key={index}
                  className="bg-[#141414] border-white/10 hover:border-orange-500/30 transition-all cursor-pointer group"
                  onClick={() => router.push(tutorial.link)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{tutorial.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg text-white group-hover:text-orange-400 transition-colors">
                            {tutorial.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-white/60 mb-3">
                          {tutorial.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge
                            variant="secondary"
                            className={`${
                              tutorial.level === 'Beginner'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : tutorial.level === 'Intermediate'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {tutorial.level}
                          </Badge>
                          <span className="text-white/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {tutorial.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                onClick={() => router.push('/docs/tutorials')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl font-semibold"
              >
                View All Tutorials
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Community & Support */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Need help or have questions?
            </h2>
            <p className="text-lg text-white/60 mb-12">
              Join our community or reach out to our support team
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#141414] border-white/10 hover:border-blue-500/30 transition-all cursor-pointer">
                <CardHeader className="text-center">
                  <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <CardTitle className="text-lg text-white">Community</CardTitle>
                  <CardDescription className="text-white/60">
                    Join our Discord community for discussions and help
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 mt-4"
                    onClick={() => window.open('https://discord.gg/hanzoai', '_blank')}
                  >
                    Join Discord
                  </Button>
                </CardHeader>
              </Card>

              <Card className="bg-[#141414] border-white/10 hover:border-green-500/30 transition-all cursor-pointer">
                <CardHeader className="text-center">
                  <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <CardTitle className="text-lg text-white">Support</CardTitle>
                  <CardDescription className="text-white/60">
                    Get help from our support team
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 mt-4"
                    onClick={() => router.push('/support')}
                  >
                    Contact Support
                  </Button>
                </CardHeader>
              </Card>

              <Card className="bg-[#141414] border-white/10 hover:border-purple-500/30 transition-all cursor-pointer">
                <CardHeader className="text-center">
                  <Download className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <CardTitle className="text-lg text-white">Resources</CardTitle>
                  <CardDescription className="text-white/60">
                    Download SDKs, templates, and tools
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 mt-4"
                    onClick={() => router.push('/resources')}
                  >
                    Browse Resources
                  </Button>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0a0a0a] border-t border-white/10 mt-16 md:mt-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Documentation</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/docs/quickstart" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Quick Start</Link></li>
                <li><Link href="/docs/api" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">API Reference</Link></li>
                <li><Link href="/docs/guides" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Guides</Link></li>
                <li><Link href="/docs/tutorials" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Tutorials</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Resources</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/docs/examples" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Examples</Link></li>
                <li><Link href="/templates" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Templates</Link></li>
                <li><Link href="/blog" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Blog</Link></li>
                <li><Link href="/community" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Support</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/help" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Help Center</Link></li>
                <li><Link href="/status" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Status</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 md:pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                <div className="flex items-center gap-3">
                  <HanzoLogo className="w-6 md:w-7 h-6 md:h-7 text-white" />
                  <span className="text-base md:text-lg font-bold">Hanzo</span>
                </div>
                <span className="text-xs md:text-sm text-white/40">
                  © 2025 Hanzo AI, Inc. All rights reserved.
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}