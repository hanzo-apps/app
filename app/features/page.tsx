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
      title: "Code from a description",
      description: "Say what you want and Hanzo writes the files — components, styles, routes, and the server code behind them",
      features: ["Zen and Enso models", "Edits across files, not one at a time", "HTML, CSS, TypeScript and SQL", "Streams as it writes"]
    },
    {
      icon: <Code size={24} />,
      title: "An editor that stays open",
      description: "The generated code is right there. Read it, change it by hand, and keep talking about it in the same window",
      features: ["The whole file tree", "Edit any file yourself", "Live preview, desktop and phone", "Checkpoints you can roll back to"]
    },
    {
      icon: <Globe size={24} />,
      title: "Publish to a URL",
      description: "One click puts the app on a hanzo.app address. Point your own domain at it from the app's settings",
      features: ["One-click publish", "Your own domain", "Global CDN", "Edge functions"]
    },
    {
      icon: <Shield size={24} />,
      title: "Keys and access",
      description: "API keys live in Hanzo KMS and never in the code. Sign-in and org-scoped access come from Hanzo IAM",
      features: ["Secrets in Hanzo KMS", "Sign-in through Hanzo IAM", "Role-based access", "SOC 2 Type II audit in progress"]
    },
    {
      icon: <Database size={24} />,
      title: "A database, already there",
      description: "Every app gets Hanzo Base — SQLite with realtime queries — and its schema comes from what you asked for",
      features: ["Hanzo Base, on SQLite", "Realtime queries", "Schema from your prompt", "Automatic backups"]
    },
    {
      icon: <Rocket size={24} />,
      title: "See what visitors do",
      description: "Once an app is published, its dashboard fills up with who came, what they did, and where they clicked",
      features: ["Traffic over time", "Sessions", "Click heatmaps", "Engagement metrics"]
    }
  ];

  const aiCapabilities = [
    {
      icon: <Sparkles size={32} />,
      title: "Plain words to code",
      description: "Describe the app and Hanzo writes all of it — the screens, the styling, and the code running behind them. You never start at a blank file."
    },
    {
      icon: <GitBranch size={32} />,
      title: "It reads what is already there",
      description: "Ask for a change and it opens the files it needs first, so the edit fits the code around it instead of replacing it."
    },
    {
      icon: <MonitorPlay size={32} />,
      title: "Give it a picture",
      description: "Upload a screenshot or a mockup and ask for that. Describe the layout in words instead, and it builds from the description."
    },
    {
      icon: <Package size={32} />,
      title: "It picks the libraries",
      description: "It chooses the framework and the components that fit what you asked for, so you don't have to name them before you start."
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
              <SizableText fontSize="$3" color="$color11">What you get</SizableText>
            </XStack>

            <H1 fontSize="$11" fontWeight="500" marginBottom="$4" textAlign="center" $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13", marginBottom: "$5" }} lineHeight="1.1">
              {/* Plain ink. This was backgroundClip="text" + color transparent
                  over a gradient a codemod deleted — two invisible words in the
                  page's one headline. Monochrome law: emphasis is weight, not
                  paint. */}
              What comes with every app you build
            </H1>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$8" maxWidth={768} alignSelf="center" textAlign="center" $md={{ fontSize: "$7" }} lineHeight="1.5">
              Hanzo writes the code, runs it, and hosts it. The database, the sign-in, the AI calls and the file storage are connected the first time the app runs.
            </Paragraph>

            <YStack gap="$4" justifyContent="center" alignItems="center" $sm={{ flexDirection: "row" }}>
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                {...accent}
                paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6"
              >
                <Zap size={20} />
                <SizableText color="$color12" fontWeight="500" fontSize="$6">Start building</SizableText>
              </Button>
              <Button
                onClick={() => router.push('/docs')}
                variant="outline"
                borderColor="$borderColor" paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}
              >
                <SizableText color="$color" fontWeight="500" fontSize="$6">Read the docs</SizableText>
                <ArrowRight size={20} />
              </Button>
            </YStack>
          </YStack>
        </YStack>

        {/* Core Features */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
          <YStack maxWidth={1280} alignSelf="center">
            <YStack marginBottom="$10" alignItems="center">
              <YStack marginBottom="$4">
                <Badge variant="outline">
                  <Settings size={16} />
                  What&apos;s included
                </Badge>
              </YStack>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">The parts of an app you don&apos;t have to write</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                Each one is a Hanzo product, connected before you ask for it.
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
              <YStack marginBottom="$4">
                <Badge variant="outline">
                  <Brain size={16} />
                  How it works
                </Badge>
              </YStack>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">What the AI actually does</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                The parts worth knowing about before you type the first sentence.
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
              <YStack marginBottom="$4">
                <Badge variant="outline">
                  <Layers size={16} />
                  Technology Stack
                </Badge>
              </YStack>
              <H2 fontSize="$10" fontWeight="500" marginBottom="$4" textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">What it runs on</H2>
              <Paragraph fontSize="$6" color="$color11" maxWidth={672} alignSelf="center" textAlign="center">
                The same infrastructure Hanzo runs on.
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
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">Databases</H3>
                <Paragraph color="$color11" textAlign="center">Hanzo Base (SQLite), Hanzo SQL, and Hanzo KV with auto-backups</Paragraph>
              </YStack>
              <YStack alignItems="center">
                <XStack padding="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" marginBottom="$4">
                  <Cpu size={32} />
                </XStack>
                <H3 fontSize="$7" fontWeight="500" marginBottom="$2" color="$color" textAlign="center">Models</H3>
                <Paragraph color="$color11" textAlign="center">Zen and Enso, plus Anthropic, OpenAI, Google and Mistral, through one endpoint</Paragraph>
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
                spacing lives on a stack around it. Every section on this page
                spells it this way; the three that reached for utility classes
                instead were styling nothing at all. */}
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
              Start with a sentence.
            </H2>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$6" maxWidth={672} alignSelf="center" textAlign="center">
              Open the builder, type what you want, and watch it get written.
            </Paragraph>

            <YStack gap="$4" justifyContent="center" alignItems="center" $sm={{ flexDirection: "row" }}>
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                {...accent}
                paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6"
              >
                <Zap size={20} />
                <SizableText color="$color12" fontWeight="500" fontSize="$6">Start building</SizableText>
              </Button>
              <Button
                onClick={() => router.push('/community')}
                variant="outline"
                borderColor="$borderColor" paddingHorizontal="$6" paddingVertical="$3" borderRadius="$6" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}
              >
                <Users size={20} />
                <SizableText color="$color" fontWeight="500" fontSize="$6">See what people built</SizableText>
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