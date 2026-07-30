// /features — a ZERO-JS marketing shell: pure RSC, no client component anywhere
// in the page subtree. The nav and footer are server components (StaticNav /
// StaticFooter), every CTA is a real link into the canonical auth funnel
// (/dev is middleware-gated → signed-out visitors bounce through
// /login?redirect=/dev, signed-in ones land in the builder), and the mobile
// menu is a native <details> disclosure. This page ships ZERO route-specific
// JavaScript — everything the browser downloads for it is the app-wide floor.

import Link from "next/link";
import StaticNav from "@/components/marketing/static-nav";
import StaticFooter from "@/components/marketing/static-footer";
import {
  ArrowRight,
  Check,
  X,
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
  Cpu,
  Layers,
  GitBranch,
  MonitorPlay,
  Package,
} from "lucide-react";

export const metadata = {
  title: "Features — Hanzo",
  description:
    "AI-powered code generation, instant deployment, integrated databases and enterprise security — everything you need to turn ideas into production apps.",
};

// Styled-anchor recipes — the visual register of @hanzo/ui Button variants,
// as classes on real links (a Button that only ever navigates is a link).
const BTN = "inline-flex items-center justify-center whitespace-nowrap transition-colors";

const coreFeatures = [
  {
    icon: <Brain className="w-6 h-6 text-violet-400" />,
    title: "AI-Powered Code Generation",
    description: "Advanced AI models generate production-ready code from natural language descriptions",
    features: ["Frontier model integration", "Custom code patterns", "Context-aware generation", "Multi-language support"],
  },
  {
    icon: <Code className="w-6 h-6 text-blue-400" />,
    title: "Smart Development Tools",
    description: "Intelligent development environment with advanced debugging and optimization",
    features: ["Real-time code analysis", "Auto-completion", "Error detection", "Performance optimization"],
  },
  {
    icon: <Globe className="w-6 h-6 text-green-400" />,
    title: "Instant Deployment",
    description: "Deploy your applications instantly with global CDN and edge computing",
    features: ["One-click deployment", "Global CDN", "Edge functions", "Auto-scaling"],
  },
  {
    icon: <Shield className="w-6 h-6 text-purple-400" />,
    title: "Enterprise Security",
    description: "Bank-grade security with encryption, compliance, and access controls",
    features: ["End-to-end encryption", "SOC 2 Type II audit in progress", "Role-based access", "Audit logging"],
  },
  {
    icon: <Database className="w-6 h-6 text-orange-400" />,
    title: "Integrated Database",
    description: "Managed databases with automatic backups and scaling",
    features: ["PostgreSQL & SQLite", "Auto-backups", "Query optimization", "Real-time sync"],
  },
  {
    icon: <Rocket className="w-6 h-6 text-pink-400" />,
    title: "Performance Monitoring",
    description: "Real-time analytics and performance monitoring for your applications",
    features: ["Real-time metrics", "Error tracking", "Performance insights", "Custom dashboards"],
  },
];

const aiCapabilities = [
  {
    icon: <Sparkles className="w-8 h-8 text-violet-400" />,
    title: "Natural Language to Code",
    description:
      "Describe what you want in plain English, and our AI will generate the complete application with all necessary components, styling, and functionality.",
  },
  {
    icon: <GitBranch className="w-8 h-8 text-blue-400" />,
    title: "Smart Code Evolution",
    description:
      "AI continuously learns from your codebase to suggest improvements, refactor legacy code, and maintain consistency across your projects.",
  },
  {
    icon: <MonitorPlay className="w-8 h-8 text-green-400" />,
    title: "Visual Design Integration",
    description:
      "Upload mockups or describe your design vision, and AI will generate pixel-perfect implementations with responsive layouts.",
  },
  {
    icon: <Package className="w-8 h-8 text-purple-400" />,
    title: "Component Intelligence",
    description:
      "AI understands popular frameworks and libraries, automatically selecting the best components and patterns for your use case.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for learning and small projects",
    features: ["5 projects", "Basic AI assistance", "Community templates", "Standard deployment", "Community support"],
    notIncluded: ["Advanced AI models", "Priority support", "Custom domains", "Team collaboration"],
    cta: "Start Building",
    href: "/dev",
    popular: false,
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
      "Advanced analytics",
    ],
    notIncluded: ["24/7 phone support", "Enterprise SSO", "Custom integrations"],
    cta: "Start Pro Trial",
    href: "/dev",
    popular: true,
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
      "Priority features",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    href: "/enterprise",
    popular: false,
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-card text-foreground min-h-screen">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card to-card" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-violet-500/10 via-purple-500/5 to-transparent blur-3xl" />
      </div>

      <StaticNav current="/features" />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 md:mb-8 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Powered by Advanced AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium mb-4 md:mb-6">
              Everything you need to{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  build faster
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-400/20 via-purple-400/20 to-pink-400/20 blur-2xl -z-10" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              From AI-powered code generation to instant deployment, Hanzo provides all the tools you need to turn ideas into production-ready applications
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dev"
                className={`${BTN} bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white px-8 py-3 rounded-xl font-medium text-lg`}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Building
              </Link>
              <Link
                href="/docs"
                className={`${BTN} border border-border text-foreground hover:bg-accent px-8 py-3 rounded-xl font-medium text-lg`}
              >
                View Documentation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center rounded-full mb-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 px-4 py-1.5 text-xs font-semibold">
                <Settings className="w-4 h-4 mr-2" />
                Core Features
              </span>
              <h2 className="text-3xl md:text-4xl font-medium mb-4">Everything you need in one platform</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive development tools designed to accelerate your workflow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreFeatures.map((feature, index) => (
                <div key={index} className="rounded-xl border bg-card border-border hover:border-violet-500/30 transition-all">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      {feature.icon}
                      <h3 className="text-xl font-semibold leading-none tracking-tight text-foreground">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <div className="p-6 pt-0">
                    <ul className="space-y-2">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="w-4 h-4 text-green-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Capabilities */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center rounded-full mb-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0 px-4 py-1.5 text-xs font-semibold">
                <Brain className="w-4 h-4 mr-2" />
                AI Capabilities
              </span>
              <h2 className="text-3xl md:text-4xl font-medium mb-4">Next-generation AI development</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                    <h3 className="text-xl font-medium mb-3 text-foreground">{capability.title}</h3>
                    <p className="text-foreground leading-relaxed">{capability.description}</p>
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
              <span className="inline-flex items-center rounded-full mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1.5 text-xs font-semibold">
                <Layers className="w-4 h-4 mr-2" />
                Technology Stack
              </span>
              <h2 className="text-3xl md:text-4xl font-medium mb-4">Built on modern infrastructure</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enterprise-grade technology stack designed for scale and performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 mb-4">
                  <Cloud className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Cloud Infrastructure</h3>
                <p className="text-muted-foreground">Global CDN, edge computing, and auto-scaling infrastructure</p>
              </div>
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 mb-4">
                  <Server className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Database Solutions</h3>
                <p className="text-muted-foreground">Hanzo Base (SQLite), Hanzo SQL, and Hanzo KV with auto-backups</p>
              </div>
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl border border-purple-500/20 mb-4">
                  <Cpu className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">AI Processing</h3>
                <p className="text-muted-foreground">GPT-4, Claude, and custom models for code generation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="px-4 md:px-8 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center rounded-full mb-4 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 px-4 py-1.5 text-xs font-semibold">
                <BarChart className="w-4 h-4 mr-2" />
                Simple Pricing
              </span>
              <h2 className="text-3xl md:text-4xl font-medium mb-4">Choose your plan</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free, scale as you grow. No hidden fees or surprises.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative rounded-xl border bg-card border-border transition-all ${
                    plan.popular ? "border-violet-500/50 scale-105" : "hover:border-foreground/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 px-4 py-1 text-xs font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col space-y-1.5 p-6 text-center pb-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight text-foreground">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-medium text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>
                  <div className="p-6 pt-0 space-y-4">
                    <Link
                      href={plan.href}
                      className={`${BTN} w-full px-4 py-2.5 rounded-md text-sm font-medium ${
                        plan.popular
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white"
                          : "bg-accent text-foreground border border-border hover:border-foreground/30"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">All plans include free SSL certificates and 99.9% uptime SLA</p>
              <Link href="/pricing" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                View detailed pricing comparison →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-8 py-16 md:py-20 bg-gradient-to-b from-violet-950/10 to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-medium mb-4">
              Ready to build your next project?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already building amazing applications with Hanzo AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dev"
                className={`${BTN} bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white px-8 py-3 rounded-xl font-medium text-lg`}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Building Now
              </Link>
              <Link
                href="/community"
                className={`${BTN} border border-border text-foreground hover:bg-accent px-8 py-3 rounded-xl font-medium text-lg`}
              >
                <Users className="w-5 h-5 mr-2" />
                Explore Community
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* The ONE ecosystem footer content (shell registry), server-rendered. */}
      <StaticFooter currentProductId="app" />
    </div>
  );
}
