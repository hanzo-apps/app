"use client";

import { SizableText, YStack, XStack, H1, H2, H3, Paragraph, Button, Badge } from '@hanzo/ui';
import { accent } from '@/lib/chrome';
import Link from "next/link";
import SiteFooter from "@/components/landing/site-footer";
import Walkthrough from "@/components/landing/walkthrough";
import { ArrowRight, Sparkles, Zap, Brain, Users, Server, Cloud, BarChart, Cpu, Layers, GitBranch, MonitorPlay, Package } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";

export default function FeaturesPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();

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
      {/* The ONE header. This page hand-rolled its own nav and mobile sheet —
          a second header with different links, different labels ("Log in" vs
          "Sign In") and no search, on the only page in the app that did not use
          the shared one. */}
      <Header />

      <YStack position="relative" zIndex={10}>
        {/* Hero Section */}
        <YStack paddingHorizontal="$4" paddingTop="$11" paddingBottom="$11" $md={{ paddingHorizontal: "$6", paddingTop: "$12", paddingBottom: "$10" }}>
          {/* `width="100%"` on every centred column below. `alignSelf="center"`
              + `maxWidth` alone is shrink-to-fit, so `maxWidth` caps a width the
              column never takes and the section sizes to its longest sentence:
              measured 794px inside a 1440 viewport, which is why nothing on this
              page could ever lay out more than one card per row. */}
          <YStack maxWidth={1024} width="100%" alignSelf="center" alignItems="center">
            <SizableText marginBottom="$5" fontFamily="$mono" fontSize="$1" color="$color11" $md={{ marginBottom: "$6" }}>
              The full app stack
            </SizableText>

            <H1 fontSize="$11" fontWeight="500" marginBottom="$4" textAlign="center" letterSpacing={-1} $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13", marginBottom: "$5" }} lineHeight="1.05">
              {/* Plain ink. This was backgroundClip="text" + color transparent
                  over a gradient a codemod deleted — two invisible words in the
                  page's one headline. Monochrome law: emphasis is weight, not
                  paint. */}
              Everything your app needs. Already connected.
            </H1>
            <Paragraph fontSize="$6" color="$color11" marginBottom="$8" maxWidth={768} alignSelf="center" textAlign="center" $md={{ fontSize: "$7" }} lineHeight="1.5">
              Hanzo writes the code and runs it. Data, sign-in, AI, storage, and deployment are ready from the first build.
            </Paragraph>

            <YStack gap="$4" justifyContent="center" alignItems="center" $sm={{ flexDirection: "row" }}>
              <Button
                onClick={() => user ? router.push('/dev') : openLoginWindow()}
                {...accent}
                paddingHorizontal="$6" paddingVertical="$3" borderRadius="$10"
              >
                <Zap size={20} />
                <SizableText color="$color12" fontWeight="500" fontSize="$6">Start building</SizableText>
              </Button>
              <Button
                onClick={() => router.push('/docs')}
                variant="outline"
                borderColor="$borderColor" paddingHorizontal="$6" paddingVertical="$3" borderRadius="$10" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}
              >
                <SizableText color="$color" fontWeight="500" fontSize="$6">Read the docs</SizableText>
                <ArrowRight size={20} />
              </Button>
            </YStack>
          </YStack>
        </YStack>

        {/* What's included — the WALKTHROUGH.
            These six were six full-bleed cards stacked head to toe: an icon,
            two lines of prose and four ticks each, and nothing on the page ever
            showed the product. A card can only assert that there is an editor
            and a database. `Walkthrough` opens the builder pane that does each
            one — Files for the editor, More › Database for the data plane, More
            › Analytics for the traffic — and the copy travelled with it
            unchanged, so this section holds the tour and no card. */}
        <Walkthrough />

        {/* AI Capabilities */}
        <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
          <YStack maxWidth={1152} width="100%" alignSelf="center">
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

            {/* `.card-grid` — the app's ONE card grid (auto-fit/minmax, so the
                column count follows the width and there is no breakpoint to
                keep in sync). These four were a plain column at every width. */}
            <div className="card-grid">
              {aiCapabilities.map((capability, index) => (
                <XStack key={index} gap="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" padding="$4">
                  <YStack flexShrink={0} alignSelf="flex-start" padding="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002">
                    {capability.icon}
                  </YStack>
                  {/* A YStack, not a `<div>`. H3 and Paragraph are TEXT
                      primitives and render INLINE, so a block box holds them as
                      inline content and they run together on ONE line —
                      measured here at 1440, the heading ended at x 429 and its
                      paragraph began at x 429 on the heading's own baseline.
                      Only a flex column stacks them. */}
                  <YStack minWidth={0} flex={1} gap="$2">
                    <H3 fontSize="$6" fontWeight="500" letterSpacing={-0.4} color="$color">{capability.title}</H3>
                    <Paragraph fontSize="$3" color="$color11" lineHeight="1.625">{capability.description}</Paragraph>
                  </YStack>
                </XStack>
              ))}
            </div>
          </YStack>
        </YStack>

        {/* Technical Stack */}
        <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
          <YStack maxWidth={1152} width="100%" alignSelf="center">
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

            {/* Three, and they were a column — three centred blocks each alone
                on a 1152px row. Data + the one grid, like every other section. */}
            <div className="card-grid">
              {[
                { icon: <Cloud size={28} />, title: "Cloud Infrastructure", desc: "Global CDN, edge computing, and auto-scaling infrastructure" },
                { icon: <Server size={28} />, title: "Databases", desc: "Hanzo Base (SQLite), Hanzo SQL, and Hanzo KV with auto-backups" },
                { icon: <Cpu size={28} />, title: "Models", desc: "Zen and Enso, plus Anthropic, OpenAI, Google and Mistral, through one endpoint" },
              ].map((item) => (
                <YStack key={item.title} alignItems="center" gap="$3" height="100%" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" paddingHorizontal="$4" paddingVertical="$6">
                  <XStack padding="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor">
                    {item.icon}
                  </XStack>
                  <H3 fontSize="$6" fontWeight="500" letterSpacing={-0.4} color="$color" textAlign="center">{item.title}</H3>
                  <Paragraph fontSize="$3" color="$color11" lineHeight="1.625" textAlign="center">{item.desc}</Paragraph>
                </YStack>
              ))}
            </div>
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
        <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
          <YStack maxWidth={896} width="100%" alignSelf="center" alignItems="center">
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
        <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
          <YStack maxWidth={896} width="100%" alignSelf="center" alignItems="center">
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
