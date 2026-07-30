'use client';

import { YStack, Paragraph, H2, SizableText, H3 } from '@hanzo/gui';
// Three-step "how it works" — the Lovable structure (idea → build → ship) in
// Hanzo's monochrome. The third step is the differentiator: it ships to Hanzo
// Cloud, not just a preview.

import Reveal from "./reveal";

const steps = [
  {
    n: "01",
    title: "Describe it",
    body: "Type what you want to build in plain English — or import an existing GitHub repo to start from real code.",
  },
  {
    n: "02",
    title: "Watch it come to life",
    body: "Hanzo generates the UI, database schema, auth, and API — then refines with you in a live editor as you chat.",
  },
  {
    n: "03",
    title: "Ship it on Hanzo Cloud",
    body: "One click deploys to a live URL with your database, auth, AI, and storage already running. No pipeline to set up.",
  },
];

export default function HowItWorks() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672} textAlign="center">
          <Paragraph fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={3.2} color="$color11">
            How it works
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
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
              <Paragraph marginTop="$3" fontSize="$3" lineHeight={1.625} color="$color11">
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
