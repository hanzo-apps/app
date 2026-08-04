'use client';

import { SizableText, YStack, H2, Paragraph, XStack } from '@hanzo/gui';
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import { CatalogBrowser } from "@/components/catalog-browser";
import { OFFICIAL_LABEL } from "@/lib/template-authors";

export default function CommunityPageView() {
  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />
      <CatalogBrowser
        origin="community"
        title="Community"
        blurb={
          <>
            What people built on Hanzo — forks, remixes, and our own example apps.
            Every entry names the template it came from and who built it, so you
            can follow a lineage instead of scrolling a pile. Ours carry a{" "}
            {OFFICIAL_LABEL} badge; everything else belongs to whoever built it.{" "}
            <Link
              href="/templates"
            ><SizableText textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
              Start from a template
            </SizableText></Link>{" "}
            to add yours.
          </>
        }
  />
      <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
        <YStack alignSelf="center" maxWidth={672}>
          <H2 fontSize="$8" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ fontSize: "$10" }}>
            Build something worth showing off.
          </H2>
          <Paragraph marginTop="$4" fontSize="$3" lineHeight="1.625" color="$color11" textAlign="center">
            Fork a starter or start from a blank prompt. Either way you are live
            on Hanzo Cloud — database, auth, AI and storage already wired.
          </Paragraph>
          <XStack marginTop="$6" flexWrap="wrap" alignItems="center" justifyContent="center" gap="$3">
            <Link
              href="/dev"
            ><XStack height={44} alignItems="center" gap="$1.5" borderRadius="$6" backgroundColor="$color12" paddingHorizontal="$4.5" hoverStyle={{ backgroundColor: "$color12" }}>
              <SizableText fontSize="$3" fontWeight="500" color="$background">Start building</SizableText> <ArrowUpRight size={16} />
            </XStack></Link>
            <Link
              href="/templates"
            ><XStack height={44} alignItems="center" gap="$1.5" borderRadius="$6" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$4.5" hoverStyle={{ backgroundColor: "$background" }}>
              <SizableText fontSize="$3" fontWeight="500" color="$color">Browse templates</SizableText>
            </XStack></Link>
          </XStack>
        </YStack>
      </YStack>
      <SiteFooter />
    </YStack>
  );
}
