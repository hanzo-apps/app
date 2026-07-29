"use client";

import { SizableText, YStack, H1, Paragraph, H2, H3, XStack } from '@hanzo/gui';
import { Button, Badge, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Shield, Lock, Users, Zap, Globe, HeadphonesIcon, ArrowRight, CheckCircle2, Building } from "lucide-react";
import Header from "@/components/layout/header";
import LogoWall from "@/components/landing/logo-wall";
import SiteFooter from "@/components/landing/site-footer";

export default function EnterprisePage() {
  const features = [
    {
      icon: <Shield size={24} />,
      title: "Enterprise Security",
      description: "End-to-end encryption, SAML SSO, and advanced access controls. SOC 2 Type II audit in progress."
    },
    {
      icon: <Users size={24} />,
      title: "Unlimited Team Members",
      description: "Scale your team without limits. Advanced role management and permissions"
    },
    {
      icon: <Zap size={24} />,
      title: "Dedicated Infrastructure",
      description: "Isolated compute resources with guaranteed performance and 99.99% SLA"
    },
    {
      icon: <Globe size={24} />,
      title: "Global Deployment",
      description: "Deploy to multiple regions with automatic failover and edge optimization"
    },
    {
      icon: <Lock size={24} />,
      title: "Private AI Models",
      description: "Train and deploy custom models on your data with complete privacy"
    },
    {
      icon: <HeadphonesIcon size={24} />,
      title: "24/7 Priority Support",
      description: "Dedicated support team with <1 hour response time and technical account manager"
    }
  ];

  return (
    <SizableText minHeight="100%" backgroundColor="$background" color="$color" display="flex" flexDirection="column">
      <Header />

      {/* Hero Section */}
      <SizableText paddingHorizontal="$4" paddingVertical="$10" textAlign="center" display="flex" flexDirection="column" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
        <YStack maxWidth={896} alignSelf="center">
          <Badge marginBottom="$4" backgroundColor="$color12" color="$background" borderWidth={0}>
            <Building size={16} />
            Enterprise Ready
          </Badge>
          <H1 fontSize="$11" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$13" }}>
            AI Development at
            <SizableText color="$color">
              {" "}Enterprise Scale
            </SizableText>
          </H1>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center">
            Build, deploy, and scale AI applications with enterprise-grade security, compliance, and dedicated support
          </Paragraph>
          <YStack alignItems="center" gap="$4" justifyContent="center" $sm={{ flexDirection: "row" }}>
            <Button size="lg" width="100%" backgroundColor="$color12" color="$background" $sm={{ width: "auto" }} hoverStyle={{ backgroundColor: "$color12" }}>
              Schedule Demo
              <ArrowRight size={20} />
            </Button>
            <Button size="lg" variant="outline" width="100%" borderColor="$borderColor" color="$color" $sm={{ width: "auto" }} hoverStyle={{ backgroundColor: "$color3" }}>
              Download Whitepaper
            </Button>
          </YStack>
        </YStack>
      </SizableText>

      {/* Trust Section — real Techstars '17 + infra-partner proof (shared with landing) */}
      <LogoWall />

      {/* Features Grid */}
      <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <SizableText textAlign="center" marginBottom="$10" display="flex" flexDirection="column">
            <H2 fontSize="$10" fontWeight="500" marginBottom="$4" $md={{ fontSize: "$11" }}>
              Everything you need for enterprise AI
            </H2>
            <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center">
              Built from the ground up with enterprise requirements in mind
            </Paragraph>
          </SizableText>

          <YStack gap="$6">
            {features.map(feature => (
              <YStack key={feature.title} backgroundColor="$color3" borderRadius="$8" padding="$6" borderWidth={1} borderColor="$borderColor" hoverStyle={{ borderColor: "$purple9" }}>
                <YStack padding="$3" borderRadius="$6" marginBottom="$5">
                  {feature.icon}
                </YStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$3">{feature.title}</H3>
                <Paragraph color="$color11">{feature.description}</Paragraph>
              </YStack>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* Security & Compliance */}
      <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <YStack gap="$10" alignItems="center">
            <div>
              <Badge marginBottom="$4" backgroundColor="$purple9" color="$purple8" borderColor="$purple9">
                Security First
              </Badge>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$11" }}>
                Bank-grade security & compliance
              </H2>
              <Paragraph fontSize="$6" color="$color11" marginBottom="$6">
                We take security seriously so you can focus on building amazing products
              </Paragraph>
              <YStack rowGap="$4">
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} color="$green8" />
                  <div>
                    <SizableText fontWeight="500" marginBottom="$1" display="flex" flexDirection="column">SOC 2 Type II — Audit in Progress</SizableText>
                    <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">Independent Type II audit underway; report available under NDA on completion</SizableText>
                  </div>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} color="$green8" />
                  <div>
                    <SizableText fontWeight="500" marginBottom="$1" display="flex" flexDirection="column">GDPR & CCPA Compliant</SizableText>
                    <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">Full compliance with global data privacy regulations</SizableText>
                  </div>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} color="$green8" />
                  <div>
                    <SizableText fontWeight="500" marginBottom="$1" display="flex" flexDirection="column">SSO, RBAC & Audit Logs</SizableText>
                    <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">SAML single sign-on, role-based access control, and a full audit trail</SizableText>
                  </div>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} color="$green8" />
                  <div>
                    <SizableText fontWeight="500" marginBottom="$1" display="flex" flexDirection="column">End-to-end Encryption</SizableText>
                    <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">Your data is encrypted at rest and in transit</SizableText>
                  </div>
                </XStack>
              </YStack>
            </div>
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$6" borderWidth={1} borderColor="$borderColor">
              <H3 fontSize="$8" fontWeight="500" marginBottom="$5">Get a custom quote</H3>
              <Paragraph color="$color11" marginBottom="$6">
                Tell us about your needs and we'll create a custom plan for your organization
              </Paragraph>
              {/* This form used to run its own control spec, and got five controls
                  onto four of them: two 49px hand-rolled inputs, a 46px NATIVE
                  <select> painting a raw OS chevron and OS menu beside Radix-quality
                  siblings, a 118px textarea, and a 30px submit. Its only focus cue
                  was `focus:border-violet-500/50`, which the monochrome sweep
                  neutralises to a grey barely distinct from the resting border. All
                  five are now the ONE control. */}
              <YStack rowGap="$4">
                <Input type="text" placeholder="Company Name" />
                <Input type="email" placeholder="Work Email" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Company Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-50">10-50 employees</SelectItem>
                    <SelectItem value="50-200">50-200 employees</SelectItem>
                    <SelectItem value="200-1000">200-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Tell us about your project" rows={4} />
                {/* The fill is the variant's to choose, not this call site's. It
                    used to hand-paint a violet->purple gradient; the monochrome
                    sweep neutralises those decorative hues to a mid grey, but the
                    Button kept the near-black foreground that was picked for its
                    WHITE default fill — leaving the page's primary CTA at 1.10:1.
                    Its sibling, which never hand-painted, measures 19.80:1. */}
                <Button width="100%">Contact Sales Team</Button>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      {/* CTA Section */}
      <SizableText paddingHorizontal="$4" paddingVertical="$11" textAlign="center" display="flex" flexDirection="column" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={896} alignSelf="center">
          <H2 fontSize="$10" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$11" }}>
            Ready to transform your business with AI?
          </H2>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6">
            Join leading companies using Hanzo to build the future
          </Paragraph>
          <Button size="lg" backgroundColor="$color12" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
            Schedule Enterprise Demo
            <ArrowRight size={20} />
          </Button>
        </YStack>
      </SizableText>

      <SiteFooter />
    </SizableText>
  );
}