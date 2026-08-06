"use client";

import { SizableText, YStack, XStack, H1, Paragraph, H2, H3 } from '@hanzo/ui';
import { Button, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hanzo/ui';
import { accent } from '@/lib/chrome';
import Link from "next/link";
import SiteFooter from "@/components/landing/site-footer";
import { ArrowRight, Check, Sparkles, Zap, Brain, Code, Globe, Shield, Database, Rocket, Users, Server, Cloud, Settings, BarChart, Cpu, Layers, GitBranch, MonitorPlay, Package } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";

export default function FeaturesPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();

  const coreFeatures = [
    {
      icon: <Brain size={24} />,
      title: "AI-Powered Code Generation",
      description: "Advanced AI models generate production-ready code from natural language descriptions",
      features: ["Frontier model integration", "Custom code patterns", "Context-aware generation", "Multi-language support"]
    },
    {
      icon: <Code size={24} />,
      title: "Smart Development Tools",
      description: "Intelligent development environment with advanced debugging and optimization",
      features: ["Real-time code analysis", "Auto-completion", "Error detection", "Performance optimization"]
    },
    {
      icon: <Globe size={24} />,
      title: "Instant Deployment",
      description: "Deploy your applications instantly with global CDN and edge computing",
      features: ["One-click deployment", "Global CDN", "Edge functions", "Auto-scaling"]
    },
    {
      icon: <Shield size={24} />,
      title: "Enterprise Security",
      description: "Bank-grade security with encryption, compliance, and access controls",
      features: ["End-to-end encryption", "SOC 2 Type II audit in progress", "Role-based access", "Audit logging"]
    },
    {
      icon: <Database size={24} />,
      title: "Integrated Database",
      description: "Managed databases with automatic backups and scaling",
      features: ["PostgreSQL & SQLite", "Auto-backups", "Query optimization", "Real-time sync"]
    },
    {
      icon: <Rocket size={24} />,
      title: "Performance Monitoring",
      description: "Real-time analytics and performance monitoring for your applications",
      features: ["Real-time metrics", "Error tracking", "Performance insights", "Custom dashboards"]
    }
  ];

  const aiCapabilities = [
    {
      icon: <Sparkles size={32} />,
      title: "Natural Language to Code",
      description: "Describe what you want in plain English, and our AI will generate the complete application with all necessary components, styling, and functionality."
    },
    {
      icon: <GitBranch size={32} />,
      title: "Smart Code Evolution",
      description: "AI continuously learns from your codebase to suggest improvements, refactor legacy code, and maintain consistency across your projects."
    },
    {
      icon: <MonitorPlay size={32} />,
      title: "Visual Design Integration",
      description: "Upload mockups or describe your design vision, and AI will generate pixel-perfect implementations with responsive layouts."
    },
    {
      icon: <Package size={32} />,
      title: "Component Intelligence",
      description: "AI understands popular frameworks and libraries, automatically selecting the best components and patterns for your use case."
    }
  ];

  return (
    <YStack backgroundColor="$background" minHeight="100%">
      {/* Gradient background */}
      <YStack position="fixed" top={0} right={0} bottom={0} left={0} pointerEvents="none" zIndex={0}>
        <YStack position="absolute" top={0} right={0} bottom={0} left={0} />
        <YStack position="absolute" top="20%" left="50%" x="-50%" y="-50%" width={800} height={600} />
      </YStack>

      {/* The ONE header. This page hand-rolled its own nav and mobile sheet —
          a second header with different links, different labels ("Log in" vs
          "Sign In") and no search, on the only page in the app that did not use
          the shared one. */}
      <Header />

      <YStack position="relative" zIndex={10}>
        {/* Hero Section */}
        <YStack paddingHorizontal="$4" paddingTop="$10" paddingBottom="$10" $md={{ paddingHorizontal: "$6", paddingTop: "$12", paddingBottom: "$11" }}>
          <YStack maxWidth={1024} alignSelf="center" alignItems="center">
            <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" marginBottom="$5" backgroundColor="$color002" borderWidth={1} borderColor="$borderColor" borderRadius="$10" $md={{ marginBottom: "$6" }}>
              <Sparkles size={16} />
              <SizableText fontSize="$3" color="$color11">Powered by Advanced AI</SizableText>
            </XStack>

            <H1 fontSize="$11" fontWeight="500" marginBottom="$4" textAlign="center" $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13", marginBottom: "$5" }} lineHeight="1.1">
              {/* Plain ink. This was backgroundClip="text" + color transparent
                  over a gradient a codemod deleted — two invisible words in the
                  page's one headline. Monochrome law: emphasis is weight, not
                  paint. */}
              Everything you need to build faster
            </H1>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$8" maxWidth={768} alignSelf="center" textAlign="center" $md={{ fontSize: "$7" }} lineHeight="1.5">
              From AI-powered code generation to instant deployment, Hanzo provides all the tools you need to turn ideas into production-ready applications
            </Paragraph>

            <YStack gap="$4" justifyContent="center" alignItems="center" $sm={{ flexDirection: "row" }}>
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                {...accent}
                paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6"
              >
                <Zap size={20} />
                <SizableText color="$color12" fontWeight="500" fontSize="$6">Start Building</SizableText>
              </Button>
              <Button
                onClick={() => router.push('/docs')}
                variant="outline"
                borderColor="$borderColor" paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}
              >
                <SizableText color="$color" fontWeight="500" fontSize="$6">View Documentation</SizableText>
                <ArrowRight size={20} />
              </Button>
            </YStack>
          </YStack>
        </YStack>

        {/* Core Features */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={1280} alignSelf="center">
            <YStack marginBottom="$10" alignItems="center">
              <Badge variant="outline" className="mb-4 px-4 py-1.5">
                <Settings size={16} />
                Core Features
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">Everything you need in one platform</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Comprehensive development tools designed to accelerate your workflow
              </Paragraph>
            </YStack>

            <YStack gap="$6">
              {coreFeatures.map((feature, index) => (
                <Card key={index} backgroundColor="$color002" borderColor="$borderColor" hoverStyle={{ borderColor: "$color06" }}>
                  <CardHeader>
                    <XStack alignItems="center" gap="$3" marginBottom="$2">
                      {feature.icon}
                      <CardTitle fontSize="$7" color="$color">{feature.title}</CardTitle>
                    </XStack>
                    <CardDescription color="$color11">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <YStack rowGap="$2">
                      {feature.features.map((item, idx) => (
                        <XStack key={idx} alignItems="center" gap="$2">
                          <Check size={16} />
                          <SizableText fontSize="$3" color="$color">{item}</SizableText>
                        </XStack>
                      ))}
                    </YStack>
                  </CardContent>
                </Card>
              ))}
            </YStack>
          </YStack>
        </YStack>

        {/* AI Capabilities */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={1280} alignSelf="center">
            <YStack marginBottom="$10" alignItems="center">
              <Badge variant="outline" className="mb-4 px-4 py-1.5">
                <Brain size={16} />
                AI Capabilities
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">Next-generation AI development</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Advanced AI models that understand your intent and generate production-ready code
              </Paragraph>
            </YStack>

            <YStack gap="$8">
              {aiCapabilities.map((capability, index) => (
                <XStack key={index} gap="$5">
                  <YStack flexShrink={0}>
                    <YStack padding="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002">
                      {capability.icon}
                    </YStack>
                  </YStack>
                  <div>
                    <H3 fontSize="$7" fontWeight="500" marginBottom="$3" color="$color">{capability.title}</H3>
                    <Paragraph color="$color" lineHeight="1.625">{capability.description}</Paragraph>
                  </div>
                </XStack>
              ))}
            </YStack>
          </YStack>
        </YStack>

        {/* Technical Stack */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={1280} alignSelf="center">
            <YStack marginBottom="$10" alignItems="center">
              <Badge variant="outline" className="mb-4 px-4 py-1.5">
                <Layers size={16} />
                Technology Stack
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">Built on modern infrastructure</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Enterprise-grade technology stack designed for scale and performance
              </Paragraph>
            </YStack>

            <YStack gap="$6">
              <YStack alignItems="center">
                <XStack padding="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" marginBottom="$4">
                  <Cloud size={32} />
                </XStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">Cloud Infrastructure</H3>
                <Paragraph color="$color11" textAlign="center">Global CDN, edge computing, and auto-scaling infrastructure</Paragraph>
              </YStack>
              <YStack alignItems="center">
                <XStack padding="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" marginBottom="$4">
                  <Server size={32} />
                </XStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">Database Solutions</H3>
                <Paragraph color="$color11" textAlign="center">Hanzo Base (SQLite), Hanzo SQL, and Hanzo KV with auto-backups</Paragraph>
              </YStack>
              <YStack alignItems="center">
                <XStack padding="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" marginBottom="$4">
                  <Cpu size={32} />
                </XStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">AI Processing</H3>
                <Paragraph color="$color11" textAlign="center">GPT-4, Claude, and custom models for code generation</Paragraph>
              </YStack>
            </YStack>
          </YStack>
        </YStack>

        {/* Pricing — the LINK, never the numbers.
            This section used to render a hardcoded three-plan table with its
            own tier names, its own monthly figures and a trial button. None of
            it came from the catalog (`/v1/billing/plans`), so it matched
            neither the real plans nor the real prices, and it went on selling
            a free tier that is retired. A price written down twice has two
            sources and only one of them is ever right — /pricing is the one
            pricing surface, so this points at it and quotes no figure. */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={896} alignSelf="center" alignItems="center">
            {/* A Badge is typed as span props — it carries no layout, so the
                spacing lives on a stack around it. The sibling sections still
                write `className="mb-4 px-4 py-1.5"` here, which has matched no
                rule since Tailwind was removed. */}
            <YStack marginBottom="$4">
              <Badge variant="outline">
                <BarChart size={16} />
                Pricing
              </Badge>
            </YStack>
            <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">
              Plans and pricing
            </H2>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center" textAlign="center">
              Every plan and what it includes, on one page.
            </Paragraph>
            <Link href="/pricing">
              <Button {...accent}>View pricing</Button>
            </Link>
          </YStack>
        </YStack>

        {/* CTA Section */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={896} alignSelf="center" alignItems="center">
            <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">
              Ready to build your next project?
            </H2>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center" textAlign="center">
              Join thousands of developers who are already building amazing applications with Hanzo AI
            </Paragraph>

            <YStack gap="$4" justifyContent="center" alignItems="center" $sm={{ flexDirection: "row" }}>
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                {...accent}
                paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6"
              >
                <Zap size={20} />
                <SizableText color="$color12" fontWeight="500" fontSize="$6">Start Building Now</SizableText>
              </Button>
              <Button
                onClick={() => router.push('/community')}
                variant="outline"
                borderColor="$borderColor" paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}
              >
                <Users size={20} />
                <SizableText color="$color" fontWeight="500" fontSize="$6">Explore Community</SizableText>
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      {/* Footer — the ONE shared ecosystem footer (@hanzogui/shell via SiteFooter),
          same as every other marketing page. Replaces a bespoke footer whose
          internal links (/changelog, /tutorials, /blog, /about, /careers, /press,
          /contact) 404 on the static export; the shared registry routes them to
          the live canonical hanzo.ai/* destinations and carries SDKs → hanzo.ai/sdks
          and Docs → docs.hanzo.ai. */}
      <SiteFooter />
    </YStack>
  );
}