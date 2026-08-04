"use client";

import { SizableText, YStack, XStack, H1, Paragraph, H2, H3 } from '@hanzo/gui';
import { Button, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hanzo/ui';
import Link from "next/link";
import SiteFooter from "@/components/landing/site-footer";
import { ArrowRight, Check, X, Sparkles, Zap, Brain, Code, Globe, Shield, Database, Rocket, Users, Server, Cloud, Settings, BarChart, Cpu, Layers, GitBranch, MonitorPlay, Package } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";

export default function FeaturesPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();

  const coreFeatures = [
    {
      icon: <Brain size={24} color="$purple8" />,
      title: "AI-Powered Code Generation",
      description: "Advanced AI models generate production-ready code from natural language descriptions",
      features: ["Frontier model integration", "Custom code patterns", "Context-aware generation", "Multi-language support"]
    },
    {
      icon: <Code size={24} color="$blue8" />,
      title: "Smart Development Tools",
      description: "Intelligent development environment with advanced debugging and optimization",
      features: ["Real-time code analysis", "Auto-completion", "Error detection", "Performance optimization"]
    },
    {
      icon: <Globe size={24} color="$green8" />,
      title: "Instant Deployment",
      description: "Deploy your applications instantly with global CDN and edge computing",
      features: ["One-click deployment", "Global CDN", "Edge functions", "Auto-scaling"]
    },
    {
      icon: <Shield size={24} color="$purple8" />,
      title: "Enterprise Security",
      description: "Bank-grade security with encryption, compliance, and access controls",
      features: ["End-to-end encryption", "SOC 2 Type II audit in progress", "Role-based access", "Audit logging"]
    },
    {
      icon: <Database size={24} color="$orange8" />,
      title: "Integrated Database",
      description: "Managed databases with automatic backups and scaling",
      features: ["PostgreSQL & SQLite", "Auto-backups", "Query optimization", "Real-time sync"]
    },
    {
      icon: <Rocket size={24} color="$pink8" />,
      title: "Performance Monitoring",
      description: "Real-time analytics and performance monitoring for your applications",
      features: ["Real-time metrics", "Error tracking", "Performance insights", "Custom dashboards"]
    }
  ];

  const aiCapabilities = [
    {
      icon: <Sparkles size={32} color="$purple8" />,
      title: "Natural Language to Code",
      description: "Describe what you want in plain English, and our AI will generate the complete application with all necessary components, styling, and functionality."
    },
    {
      icon: <GitBranch size={32} color="$blue8" />,
      title: "Smart Code Evolution",
      description: "AI continuously learns from your codebase to suggest improvements, refactor legacy code, and maintain consistency across your projects."
    },
    {
      icon: <MonitorPlay size={32} color="$green8" />,
      title: "Visual Design Integration",
      description: "Upload mockups or describe your design vision, and AI will generate pixel-perfect implementations with responsive layouts."
    },
    {
      icon: <Package size={32} color="$purple8" />,
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
    <YStack backgroundColor="$background" minHeight="100%">
      {/* Gradient background */}
      <YStack position="fixed" top={0} right={0} bottom={0} left={0} pointerEvents="none" zIndex={0}>
        <YStack position="absolute" top={0} right={0} bottom={0} left={0} />
        <YStack position="absolute" top="20%" left="50%" x="50%" y="50%" width={800} height={600} />
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
            <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" marginBottom="$5" backgroundColor="$purple9" borderWidth={1} borderColor="$purple9" borderRadius="$10" $md={{ marginBottom: "$6" }}>
              <Sparkles size={16} color="$purple8" />
              <SizableText fontSize="$3" color="$purple4">Powered by Advanced AI</SizableText>
            </XStack>

            <H1 fontSize="$11" fontWeight="500" marginBottom="$4" textAlign="center" $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13", marginBottom: "$5" }}>
              Everything you need to{" "}
              <SizableText position="relative">
                <SizableText backgroundClip="text" color="transparent">
                  build faster
                </SizableText>
                <YStack position="absolute" top="-2" right="-2" bottom="-2" left="-2" zIndex={10} />
              </SizableText>
            </H1>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$8" maxWidth={768} alignSelf="center" textAlign="center" $md={{ fontSize: "$7" }}>
              From AI-powered code generation to instant deployment, Hanzo provides all the tools you need to turn ideas into production-ready applications
            </Paragraph>

            <YStack gap="$4" justifyContent="center" alignItems="center" $sm={{ flexDirection: "row" }}>
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6"
              >
                <Zap size={20} />
                <SizableText color="white" fontWeight="500" fontSize="$6">Start Building</SizableText>
              </Button>
              <Button
                onClick={() => router.push('/docs')}
                variant="outline"
                borderColor="$borderColor" paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6" hoverStyle={{ backgroundColor: "$color3" }}
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
              <Badge className="mb-4 px-4 py-1.5">
                <Settings size={16} />
                Core Features
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }}>Everything you need in one platform</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Comprehensive development tools designed to accelerate your workflow
              </Paragraph>
            </YStack>

            <YStack gap="$6">
              {coreFeatures.map((feature, index) => (
                <Card key={index} backgroundColor="$background" borderColor="$borderColor" hoverStyle={{ borderColor: "$purple9" }}>
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
                          <Check size={16} color="$green8" />
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
              <Badge className="mb-4 px-4 py-1.5">
                <Brain size={16} />
                AI Capabilities
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }}>Next-generation AI development</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Advanced AI models that understand your intent and generate production-ready code
              </Paragraph>
            </YStack>

            <YStack gap="$8">
              {aiCapabilities.map((capability, index) => (
                <XStack key={index} gap="$5">
                  <YStack flexShrink={0}>
                    <YStack padding="$3" borderRadius="$6" borderWidth={1} borderColor="$purple9">
                      {capability.icon}
                    </YStack>
                  </YStack>
                  <div>
                    <H3 fontSize="$7" fontWeight="500" marginBottom="$3" color="$color">{capability.title}</H3>
                    <Paragraph color="$color" lineHeight={1.625}>{capability.description}</Paragraph>
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
              <Badge className="mb-4 px-4 py-1.5">
                <Layers size={16} />
                Technology Stack
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }}>Built on modern infrastructure</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Enterprise-grade technology stack designed for scale and performance
              </Paragraph>
            </YStack>

            <YStack gap="$6">
              <YStack alignItems="center">
                <XStack padding="$4" borderRadius="$8" borderWidth={1} borderColor="$blue9" marginBottom="$4">
                  <Cloud size={32} color="$blue8" />
                </XStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">Cloud Infrastructure</H3>
                <Paragraph color="$color11" textAlign="center">Global CDN, edge computing, and auto-scaling infrastructure</Paragraph>
              </YStack>
              <YStack alignItems="center">
                <XStack padding="$4" borderRadius="$8" borderWidth={1} borderColor="$green9" marginBottom="$4">
                  <Server size={32} color="$green8" />
                </XStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">Database Solutions</H3>
                <Paragraph color="$color11" textAlign="center">Hanzo Base (SQLite), Hanzo SQL, and Hanzo KV with auto-backups</Paragraph>
              </YStack>
              <YStack alignItems="center">
                <XStack padding="$4" borderRadius="$8" borderWidth={1} borderColor="$purple9" marginBottom="$4">
                  <Cpu size={32} color="$purple8" />
                </XStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">AI Processing</H3>
                <Paragraph color="$color11" textAlign="center">GPT-4, Claude, and custom models for code generation</Paragraph>
              </YStack>
            </YStack>
          </YStack>
        </YStack>

        {/* Pricing Comparison */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={1280} alignSelf="center">
            <YStack marginBottom="$10" alignItems="center">
              <Badge className="mb-4 px-4 py-1.5">
                <BarChart size={16} />
                Simple Pricing
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }}>Choose your plan</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Start free, scale as you grow. No hidden fees or surprises.
              </Paragraph>
            </YStack>

            <YStack gap="$6">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  position="relative" backgroundColor="$background" {...{ borderColor: plan.popular ? "$purple9" : "$borderColor", scale: plan.popular ? 1.05 : undefined, hoverStyle: plan.popular ? undefined : {"borderColor":"$color"} }}
                >
                  {plan.popular && (
                    <YStack position="absolute" top="-3" left="50%" x="50%">
                      <Badge className="px-4 py-1">
                        Most Popular
                      </Badge>
                    </YStack>
                  )}
                  <CardHeader alignItems="center" paddingBottom="$5">
                    <CardTitle fontSize="$8" color="$color">{plan.name}</CardTitle>
                    <YStack marginTop="$4">
                      <SizableText fontSize="$11" fontWeight="500" color="$color">{plan.price}</SizableText>
                      {plan.period && <SizableText color="$color11" marginLeft="$1">{plan.period}</SizableText>}
                    </YStack>
                    <CardDescription color="$color11" marginTop="$2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent rowGap="$4">
                    <Button
                      width="100%" {...{ color: plan.popular ? "white" : "$color", backgroundColor: plan.popular ? undefined : "$color3", borderWidth: plan.popular ? undefined : 1, borderColor: plan.popular ? undefined : "$borderColor", hoverStyle: plan.popular ? undefined : {"borderColor":"$color"} }}
                      onClick={() => plan.name === 'Enterprise' ? router.push('/enterprise') : (user ? router.push('/dev') : openLoginWindow())}
                    >
                      {plan.cta}
                    </Button>
                    <YStack rowGap="$3">
                      {plan.features.map((feature, idx) => (
                        <XStack key={idx} alignItems="center" gap="$3">
                          <Check size={16} color="$green8" />
                          <SizableText fontSize="$3" color="$color">{feature}</SizableText>
                        </XStack>
                      ))}
                      {plan.notIncluded.map((feature, idx) => (
                        <XStack key={idx} alignItems="center" gap="$3">
                          <X size={16} color="$red8" />
                          <SizableText fontSize="$3" color="$color11">{feature}</SizableText>
                        </XStack>
                      ))}
                    </YStack>
                  </CardContent>
                </Card>
              ))}
            </YStack>

            <YStack marginTop="$8" alignItems="center">
              <Paragraph color="$color11" marginBottom="$4" textAlign="center">All plans include free SSL certificates and 99.9% uptime SLA</Paragraph>
              <Link href="/pricing"><SizableText color="$purple8" fontSize="$3" fontWeight="500" textAlign="center" hoverStyle={{ color: "$purple4" }}>
                View detailed pricing comparison →
              </SizableText></Link>
            </YStack>
          </YStack>
        </YStack>

        {/* CTA Section */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={896} alignSelf="center" alignItems="center">
            <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }}>
              Ready to build your next project?
            </H2>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center" textAlign="center">
              Join thousands of developers who are already building amazing applications with Hanzo AI
            </Paragraph>

            <YStack gap="$4" justifyContent="center" alignItems="center" $sm={{ flexDirection: "row" }}>
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6"
              >
                <Zap size={20} />
                <SizableText color="white" fontWeight="500" fontSize="$6">Start Building Now</SizableText>
              </Button>
              <Button
                onClick={() => router.push('/community')}
                variant="outline"
                borderColor="$borderColor" paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6" hoverStyle={{ backgroundColor: "$color3" }}
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