"use client";

import { useState } from "react";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import Link from "next/link";
import { HanzoLogo } from "@/components/HanzoLogo";
import {
  ArrowRight,
  Check,
  X,
  Menu,
  Sparkles,
  Zap,
  Brain,
  Code,
  Globe,
  Shield,
  Database,
  Rocket,
  Users,
  Server,
  Cloud,
  Settings,
  BarChart,
  Lock,
  Cpu,
  Layers,
  GitBranch,
  MonitorPlay,
  Package,
  Terminal
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function FeaturesPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const coreFeatures = [
    {
      icon: <Brain className="w-6 h-6 text-violet-400" />,
      title: "AI-Powered Code Generation",
      description: "Advanced AI models generate production-ready code from natural language descriptions",
      features: ["GPT-4 Turbo integration", "Custom code patterns", "Context-aware generation", "Multi-language support"]
    },
    {
      icon: <Code className="w-6 h-6 text-blue-400" />,
      title: "Smart Development Tools",
      description: "Intelligent development environment with advanced debugging and optimization",
      features: ["Real-time code analysis", "Auto-completion", "Error detection", "Performance optimization"]
    },
    {
      icon: <Globe className="w-6 h-6 text-green-400" />,
      title: "Instant Deployment",
      description: "Deploy your applications instantly with global CDN and edge computing",
      features: ["One-click deployment", "Global CDN", "Edge functions", "Auto-scaling"]
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      title: "Enterprise Security",
      description: "Bank-grade security with encryption, compliance, and access controls",
      features: ["End-to-end encryption", "SOC 2 compliance", "Role-based access", "Audit logging"]
    },
    {
      icon: <Database className="w-6 h-6 text-orange-400" />,
      title: "Integrated Database",
      description: "Managed databases with automatic backups and scaling",
      features: ["PostgreSQL & MongoDB", "Auto-backups", "Query optimization", "Real-time sync"]
    },
    {
      icon: <Rocket className="w-6 h-6 text-pink-400" />,
      title: "Performance Monitoring",
      description: "Real-time analytics and performance monitoring for your applications",
      features: ["Real-time metrics", "Error tracking", "Performance insights", "Custom dashboards"]
    }
  ];

  const aiCapabilities = [
    {
      icon: <Sparkles className="w-8 h-8 text-violet-400" />,
      title: "Natural Language to Code",
      description: "Describe what you want in plain English, and our AI will generate the complete application with all necessary components, styling, and functionality."
    },
    {
      icon: <GitBranch className="w-8 h-8 text-blue-400" />,
      title: "Smart Code Evolution",
      description: "AI continuously learns from your codebase to suggest improvements, refactor legacy code, and maintain consistency across your projects."
    },
    {
      icon: <MonitorPlay className="w-8 h-8 text-green-400" />,
      title: "Visual Design Integration",
      description: "Upload mockups or describe your design vision, and AI will generate pixel-perfect implementations with responsive layouts."
    },
    {
      icon: <Package className="w-8 h-8 text-purple-400" />,
      title: "Component Intelligence",
      description: "AI understands popular frameworks and libraries, automatically selecting the best components and patterns for your use case."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      description: "Perfect for learning and small projects",
      features: [
        "5 projects",
        "Basic AI assistance",
        "Community templates",
        "Standard deployment",
        "Community support"
      ],
      notIncluded: [
        "Advanced AI models",
        "Priority support",
        "Custom domains",
        "Team collaboration"
      ],
      cta: "Start Building",
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For professional developers and teams",
      features: [
        "Unlimited projects",
        "Advanced AI models",
        "Premium templates",
        "Custom domains",
        "Priority deployment",
        "Email support",
        "Team collaboration",
        "Advanced analytics"
      ],
      notIncluded: [
        "24/7 phone support",
        "Enterprise SSO",
        "Custom integrations"
      ],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with specific needs",
      features: [
        "Everything in Pro",
        "Custom AI training",
        "Dedicated support",
        "Enterprise SSO",
        "Custom integrations",
        "SLA guarantees",
        "Advanced security",
        "Audit logs",
        "Priority features"
      ],
      notIncluded: [],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-violet-500/10 via-purple-500/5 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-white/10">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <HanzoLogo className="w-8 md:w-9 h-8 md:h-9 text-white" />
            <span className="text-xl md:text-2xl font-bold">Hanzo</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-white font-medium text-sm transition-colors">
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
            <Link href="/docs" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
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
                <Link href="/features" className="block text-2xl font-medium text-white transition-colors">
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
                <Link href="/docs" className="block text-2xl font-medium text-white/90 hover:text-white transition-colors">
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 md:mb-8 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Powered by Advanced AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6">
              Everything you need to{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  build faster
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-400/20 via-purple-400/20 to-pink-400/20 blur-2xl -z-10" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-12 max-w-3xl mx-auto">
              From AI-powered code generation to instant deployment, Hanzo provides all the tools you need to turn ideas into production-ready applications
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white px-8 py-3 rounded-xl font-semibold text-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Building
              </Button>
              <Button
                onClick={() => router.push('/docs')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-semibold text-lg"
              >
                View Documentation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 px-4 py-1.5">
                <Settings className="w-4 h-4 mr-2" />
                Core Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need in one platform</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Comprehensive development tools designed to accelerate your workflow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreFeatures.map((feature, index) => (
                <Card key={index} className="bg-[#141414] border-white/10 hover:border-violet-500/30 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      {feature.icon}
                      <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="text-white/60">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                          <Check className="w-4 h-4 text-green-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Capabilities */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0 px-4 py-1.5">
                <Brain className="w-4 h-4 mr-2" />
                AI Capabilities
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Next-generation AI development</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Advanced AI models that understand your intent and generate production-ready code
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {aiCapabilities.map((capability, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
                      {capability.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{capability.title}</h3>
                    <p className="text-white/70 leading-relaxed">{capability.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1.5">
                <Layers className="w-4 h-4 mr-2" />
                Technology Stack
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built on modern infrastructure</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Enterprise-grade technology stack designed for scale and performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 mb-4">
                  <Cloud className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Cloud Infrastructure</h3>
                <p className="text-white/60">Global CDN, edge computing, and auto-scaling infrastructure</p>
              </div>
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 mb-4">
                  <Server className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Database Solutions</h3>
                <p className="text-white/60">Managed PostgreSQL, MongoDB, and Redis with auto-backups</p>
              </div>
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl border border-purple-500/20 mb-4">
                  <Cpu className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">AI Processing</h3>
                <p className="text-white/60">GPT-4, Claude, and custom models for code generation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 px-4 py-1.5">
                <BarChart className="w-4 h-4 mr-2" />
                Simple Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose your plan</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Start free, scale as you grow. No hidden fees or surprises.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative bg-[#141414] border-white/10 transition-all ${
                    plan.popular ? 'border-violet-500/50 scale-105' : 'hover:border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-white/60 ml-1">{plan.period}</span>}
                    </div>
                    <CardDescription className="text-white/60 mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                      onClick={() => plan.name === 'Enterprise' ? router.push('/enterprise') : (user ? router.push('/dev') : openLoginWindow())}
                    >
                      {plan.cta}
                    </Button>
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-sm text-white/80">{feature}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-sm text-white/50">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-white/60 mb-4">All plans include free SSL certificates and 99.9% uptime SLA</p>
              <Link href="/pricing" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                View detailed pricing comparison →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-violet-950/10 to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to build your next project?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already building amazing applications with Hanzo AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white px-8 py-3 rounded-xl font-semibold text-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Building Now
              </Button>
              <Button
                onClick={() => router.push('/community')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-semibold text-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Explore Community
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0a0a0a] border-t border-white/10 mt-16 md:mt-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Product</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/features" className="text-white hover:text-white text-xs md:text-sm transition-colors">Features</Link></li>
                <li><Link href="/integrations" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Integrations</Link></li>
                <li><Link href="/pricing" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Resources</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/docs" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Documentation</Link></li>
                <li><Link href="/tutorials" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Tutorials</Link></li>
                <li><Link href="/blog" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Blog</Link></li>
                <li><Link href="/community" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Company</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/about" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Press</Link></li>
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