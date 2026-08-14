"use client";

import { SizableText, YStack, H1, Paragraph, H2, H3, XStack } from '@hanzo/ui';
import { Button, Badge, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Shield, Lock, Users, Zap, Globe, HeadphonesIcon, ArrowRight, CheckCircle2, Building } from "lucide-react";
import Header from "@/components/layout/header";
import LogoWall from "@/components/landing/logo-wall";
import SiteFooter from "@/components/landing/site-footer";

export default function EnterprisePage() {
  const features = [
    {
      icon: <Shield size={24} />,
      title: "Single sign-on and access control",
      description: "SAML single sign-on, role-based access, and encryption at rest and in transit. SOC 2 Type II audit in progress."
    },
    {
      icon: <Users size={24} />,
      title: "As many seats as you need",
      description: "Everyone works in one organization, on shared projects and one bill. Roles keep owners and members apart."
    },
    {
      icon: <Zap size={24} />,
      title: "Your own compute",
      description: "Isolated compute rather than shared, backed by a 99.99% SLA."
    },
    {
      icon: <Globe size={24} />,
      title: "More than one region",
      description: "Run in several regions, with failover between them."
    },
    {
      icon: <Lock size={24} />,
      title: "Models trained on your data",
      description: "Train and run your own models on your own data, inside your organization."
    },
    {
      icon: <HeadphonesIcon size={24} />,
      title: "Support that answers",
      description: "A technical account manager, and a reply inside an hour, at any hour."
    }
  ];

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />

      {/* Hero Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
        <YStack maxWidth={896} alignSelf="center">
          <YStack marginBottom="$4">
            <Badge>
              <Building size={16} />
              Enterprise
            </Badge>
          </YStack>
          <H1 fontSize="$11" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$13" }} lineHeight="1.1">
            Hanzo, for
            <SizableText color="$color">
              {" "}your whole company
            </SizableText>
          </H1>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center" lineHeight="1.4">
            One organization, as many seats as you need, with single sign-on, role-based access and an audit trail. Your own compute, and a person to call.
          </Paragraph>
          <YStack alignItems="center" gap="$4" justifyContent="center" $sm={{ flexDirection: "row" }}>
            <Button size="lg" width="100%" backgroundColor="$color5" borderWidth={1} borderColor="$color6" $sm={{ width: "auto" }} hoverStyle={{ backgroundColor: "$color6" }}>
              Schedule a demo
              <ArrowRight size={20} />
            </Button>
            <Button size="lg" variant="outline" width="100%" borderColor="$borderColor" $sm={{ width: "auto" }} hoverStyle={{ backgroundColor: "$color3" }}>
              Talk to sales
            </Button>
          </YStack>
        </YStack>
      </YStack>

      {/* Trust Section — real Techstars '17 + infra-partner proof (shared with landing) */}
      <LogoWall />

      {/* Features Grid */}
      <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={1280} alignSelf="center">
          <YStack marginBottom="$10">
            <H2 fontSize="$10" fontWeight="500" marginBottom="$4" $md={{ fontSize: "$11" }} lineHeight="1.1">
              What an organization gets
            </H2>
            <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center">
              The parts a single-person account does not have.
            </Paragraph>
          </YStack>

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
              <YStack marginBottom="$4">
                <Badge variant="secondary">Security</Badge>
              </YStack>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$11" }} lineHeight="1.1">
                Security and compliance
              </H2>
              <Paragraph fontSize="$6" color="$color11" marginBottom="$6">
                Where your data sits, who can reach it, and what we can show an auditor.
              </Paragraph>
              <YStack rowGap="$4">
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} />
                  <div>
                    <YStack marginBottom="$1"><SizableText fontWeight="500">SOC 2 Type II audit in progress</SizableText></YStack>
                    <YStack><SizableText fontSize="$3" color="$color11">Independent Type II audit underway; report available under NDA on completion</SizableText></YStack>
                  </div>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} />
                  <div>
                    <YStack marginBottom="$1"><SizableText fontWeight="500">GDPR and CCPA</SizableText></YStack>
                    <YStack><SizableText fontSize="$3" color="$color11">Personal data is handled under the EU and California privacy rules</SizableText></YStack>
                  </div>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} />
                  <div>
                    <YStack marginBottom="$1"><SizableText fontWeight="500">Single sign-on, roles, and an audit trail</SizableText></YStack>
                    <YStack><SizableText fontSize="$3" color="$color11">SAML single sign-on, role-based access control, and a full audit trail</SizableText></YStack>
                  </div>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle2 size={24} />
                  <div>
                    <YStack marginBottom="$1"><SizableText fontWeight="500">Encryption</SizableText></YStack>
                    <YStack><SizableText fontSize="$3" color="$color11">Your data is encrypted at rest and in transit</SizableText></YStack>
                  </div>
                </XStack>
              </YStack>
            </div>
            <YStack backgroundColor="$color3" borderRadius="$8" padding="$6" borderWidth={1} borderColor="$borderColor">
              <H3 fontSize="$8" fontWeight="500" marginBottom="$5">Get a custom quote</H3>
              <Paragraph color="$color11" marginBottom="$6">
                Tell us what you are building and how many people will work on it. We come back with a plan and a price.
              </Paragraph>
              {/* This form used to run its own control spec, and got five controls
                  onto four of them: two 49px hand-rolled inputs, a 46px NATIVE
                  <select> painting a raw OS chevron and OS menu beside Radix-quality
                  siblings, a 118px textarea, and a 30px submit. Its only focus cue
                  was `focus:border-violet-500/50`, which the monochrome sweep
                  neutralises to a grey barely distinct from the resting border. All
                  five are now the ONE control. */}
              <YStack rowGap="$4">
                <Input type="text" placeholder="Company name" />
                <Input type="email" placeholder="Work email" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-50">10-50 employees</SelectItem>
                    <SelectItem value="50-200">50-200 employees</SelectItem>
                    <SelectItem value="200-1000">200-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="What you want to build, and how many people will work on it" rows={4} />
                {/* The fill is the variant's to choose, not this call site's. It
                    used to hand-paint a violet->purple gradient; the monochrome
                    sweep neutralises those decorative hues to a mid grey, but the
                    Button kept the near-black foreground that was picked for its
                    WHITE default fill — leaving the page's primary CTA at 1.10:1.
                    Its sibling, which never hand-painted, measures 19.80:1. */}
                <Button width="100%">Send this to sales</Button>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      {/* CTA Section */}
      <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6" }}>
        <YStack maxWidth={896} alignSelf="center">
          <H2 fontSize="$10" fontWeight="500" marginBottom="$5" $md={{ fontSize: "$11" }} lineHeight="1.1">
            Bring your whole team.
          </H2>
          <Paragraph fontSize="$7" color="$color11" marginBottom="$6" lineHeight="1.4">
            Tell us what you need and we will show you how it works on your own code.
          </Paragraph>
          <Button size="lg" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}>
            Schedule a demo
            <ArrowRight size={20} />
          </Button>
        </YStack>
      </YStack>

      <SiteFooter />
    </YStack>
  );
}