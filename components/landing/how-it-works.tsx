'use client';

import { YStack, Paragraph, H2, SizableText, H3 } from '@hanzo/ui';
// Three-step "how it works" — idea → build → ship, in Hanzo's monochrome. The
// third step is the differentiator: it ships to Hanzo Cloud, not just a preview.

import Reveal from "./reveal";

// The mono line above each step names what you HAVE at that point. It used to
// be an ordinal — "01/02/03" — which said nothing the order of the three cards
// wasn't already saying.
const steps = [
  {
    n: "A sentence",
    title: "Say what you want",
    body: "Type it in plain words. Or import a GitHub repo and start from code you already have.",
  },
  {
    n: "A working app",
    title: "Watch it get built",
    body: "Hanzo writes the screens, the database schema, the sign-in and the API. Keep talking to it and the app changes while you watch.",
  },
  {
    n: "A live URL",
    title: "Ship it on Hanzo Cloud",
    body: "Publish, and the app is on a URL with its database, sign-in, AI and storage already running. There is no pipeline to set up.",
  },
];

export default function HowItWorks() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph fontFamily="$mono" fontSize="$1" color="$color11" textAlign="center">
            How it works
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ fontSize: "$11" }} lineHeight="1.1">
            From a sentence to a shipped app.
          </H2>
        </Reveal>

        <Reveal delay={80} marginTop={56}>
          <div className="hiw-grid">
          {steps.map((s) => (
            <YStack
              key={s.n}
              backgroundColor="$background" padding="$6" hoverStyle={{ backgroundColor: "$background" }} $md={{ padding: "$7" }}
            >
              <SizableText fontFamily="$mono" fontSize="$3" color="$color11">{s.n}</SizableText>
              <H3 marginTop="$5" fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                {s.title}
              </H3>
              <Paragraph marginTop="$3" fontSize="$3" lineHeight="1.625" color="$color11">
                {s.body}
              </Paragraph>
            </YStack>
          ))}
          </div>
        </Reveal>
      </YStack>
    </YStack>
  );
}
