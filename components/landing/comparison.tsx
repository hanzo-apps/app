"use client";

import { H2, H3, Paragraph, SizableText, XStack, YStack } from "@hanzo/ui";
import Reveal from "@/components/landing/reveal";

type Column = "hanzo" | "sites" | "agents" | "stack";

const choices: Array<{
  key: Column;
  name: string;
  note: string;
  lead?: boolean;
}> = [
  { key: "hanzo", name: "Hanzo", note: "Prompt to production", lead: true },
  { key: "sites", name: "Site builders", note: "Canvas first" },
  { key: "agents", name: "Coding agents", note: "Code first" },
  { key: "stack", name: "DIY stack", note: "Assemble it yourself" },
];

const rows: Array<{
  label: string;
  values: Record<Column, string>;
}> = [
  {
    label: "Build from a prompt",
    values: { hanzo: "Included", sites: "Varies", agents: "Included", stack: "Manual" },
  },
  {
    label: "Own the source",
    values: { hanzo: "Yes", sites: "Limited", agents: "Yes", stack: "Yes" },
  },
  {
    label: "Data and sign-in",
    values: { hanzo: "Connected", sites: "Add-ons", agents: "Bring your own", stack: "Assemble" },
  },
  {
    label: "AI models",
    values: { hanzo: "Connected", sites: "Add-ons", agents: "Bring your own", stack: "Assemble" },
  },
  {
    label: "Publish",
    values: { hanzo: "One click", sites: "Included", agents: "Set it up", stack: "Set it up" },
  },
  {
    label: "Operations",
    values: { hanzo: "Managed", sites: "Managed", agents: "Your team", stack: "Your team" },
  },
];

export default function Comparison() {
  return (
    <YStack
      position="relative"
      borderTopWidth={1}
      borderColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$11"
      $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}
    >
      <YStack alignSelf="center" width="100%" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={720}>
          <SizableText textAlign="center" fontFamily="$mono" fontSize="$1" color="$color11">
            One continuous workflow
          </SizableText>
          <H2
            marginTop="$4"
            textAlign="center"
            fontSize="$10"
            fontWeight="500"
            letterSpacing={-0.8}
            lineHeight="1.08"
            $md={{ fontSize: "2.75rem" }}
          >
            Build, ship, and own it.
          </H2>
          <Paragraph
            alignSelf="center"
            marginTop="$4"
            maxWidth={640}
            textAlign="center"
            fontSize="$4"
            color="$color11"
            lineHeight="1.55"
            $md={{ fontSize: "$6" }}
          >
            Most tools stop at the canvas or the code. Hanzo carries the same idea
            through data, infrastructure, and deployment.
          </Paragraph>
        </Reveal>

        <div className="matrix">
          {choices.map((choice, index) => (
            <Reveal
              key={choice.key}
              delay={60 + index * 35}
              height="100%"
              overflow="hidden"
              borderRadius="$8"
              borderWidth={1}
              borderColor={choice.lead ? "$color06" : "$borderColor"}
              backgroundColor={choice.lead ? "$color3" : "$color002"}
            >
              <YStack padding="$4.5">
                <XStack alignItems="center" justifyContent="space-between" gap="$3">
                  <YStack minWidth={0}>
                    <H3 fontSize="$6" fontWeight="500" letterSpacing={-0.3} color="$color">
                      {choice.name}
                    </H3>
                    <SizableText marginTop="$0.5" fontFamily="$mono" fontSize="$1" color="$color11">
                      {choice.note}
                    </SizableText>
                  </YStack>
                  {choice.lead ? (
                    <SizableText
                      flexShrink={0}
                      borderRadius="$10"
                      backgroundColor="$color"
                      paddingHorizontal="$2.5"
                      paddingVertical="$1"
                      fontFamily="$mono"
                      fontSize="$1"
                      color="$background"
                    >
                      Complete
                    </SizableText>
                  ) : null}
                </XStack>
              </YStack>

              <YStack>
                {rows.map((row) => (
                  <XStack
                    key={row.label}
                    minHeight={64}
                    alignItems="center"
                    justifyContent="space-between"
                    gap="$3"
                    borderTopWidth={1}
                    borderColor="$borderColor"
                    paddingHorizontal="$4.5"
                    paddingVertical="$3"
                  >
                    <SizableText minWidth={0} fontSize="$2" color="$color11" lineHeight="1.35">
                      {row.label}
                    </SizableText>
                    <SizableText
                      flexShrink={0}
                      textAlign="right"
                      fontSize="$2"
                      fontWeight={choice.lead ? "500" : "400"}
                      color={choice.lead ? "$color" : "$color11"}
                    >
                      {row.values[choice.key]}
                    </SizableText>
                  </XStack>
                ))}
              </YStack>
            </Reveal>
          ))}
        </div>
      </YStack>
    </YStack>
  );
}
