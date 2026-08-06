'use client';

import { SizableText, YStack, Paragraph, H1, XStack } from '@hanzo/ui';
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import type { listBuilds } from "@/lib/builds";

export default function BuildsIndexPageView({
  builds,
}: {
  builds: Awaited<ReturnType<typeof listBuilds>>;
}) {
  return (
    <YStack position="relative" minHeight="100%" backgroundColor="$background" overflow="hidden">
      <YStack pointerEvents="none" position="fixed" top={0} right={0} bottom={0} left={0} zIndex={0} overflow="hidden">
        <YStack position="absolute" left="50%" top="-14%" height={520} width={860} marginLeft={-430} borderRadius="$10" backgroundColor="$color005" filter="blur(130px)" />
      </YStack>
      <Header />
      <YStack position="relative" zIndex={10} paddingHorizontal="$4" paddingTop={36} $md={{ paddingHorizontal: "$6", paddingTop: "$9" }}>
        <YStack alignSelf="center" maxWidth={896}>
          <Paragraph fontFamily="$mono" fontSize={11} color="$color11">
            Builds
          </Paragraph>
          <H1 marginTop="$4" fontSize="$10" fontWeight="500" lineHeight="1.08" letterSpacing={-0.4} $sm={{ fontSize: "$11" }}>
            How these were actually made
          </H1>
          <Paragraph marginTop="$4" maxWidth={672} fontSize="$4" lineHeight="1.625" color="$color11">
            Each of these is a real agent session — the prompt, the reasoning, and the
            commit every turn produced. The turn&nbsp;⇄&nbsp;commit binding lives in git
            itself, so you can check any claim on this site against the repository.
          </Paragraph>

          {builds.length === 0 ? (
            <YStack marginTop="$7" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$5">
              <Paragraph fontSize="$3" lineHeight="1.625" color="$color11">
                No builds published yet. An author publishes one from the repo the
                session ran in:
              </Paragraph>
              <SizableText marginTop="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$3" fontFamily="$mono" fontSize={11} color="$color11" overflow="scroll" whiteSpace="pre">
                hanzo agent publish &lt;project&gt; --bind
              </SizableText>
            </YStack>
          ) : (
            <YStack marginTop="$7" borderTopWidth={1} borderBottomWidth={1} borderColor="$borderColor">
              {builds.map((b) => (
                <li key={`${b.org}/${b.project}`}>
                  <Link
                    href={`/builds/${b.org}/${b.project}`}
                  ><XStack group flexWrap="wrap" alignItems="baseline" justifyContent="space-between" gap="$3" paddingVertical="$4.5" hoverStyle={{ backgroundColor: "$color005" }}>
                    <YStack minWidth={0}>
                      <SizableText numberOfLines={1} fontSize="$4" fontWeight="500">
                        {b.title || `${b.org}/${b.project}`}
                      </SizableText>
                      <SizableText marginTop="$1" fontFamily="$mono" fontSize={11} color="$color11">
                        {b.org}/{b.project} · {b.agent} · {b.turns} turns
                      </SizableText>
                    </YStack>
                    <ArrowUpRight size={16} />
                  </XStack></Link>
                </li>
              ))}
            </YStack>
          )}
        </YStack>
      </YStack>
      <SiteFooter />
    </YStack>
  );
}
