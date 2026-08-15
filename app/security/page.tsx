"use client";

// The human half of the disclosure surface. The machine half is
// public/.well-known/security.txt (RFC 9116), whose Policy field points here, so
// a researcher who finds either one finds the other.
//
// Nothing on this page claims a certification or a control. What hanzo.app has
// audited is stated on /enterprise, and repeating a claim onto a second page is
// how one becomes two that disagree.

import { SizableText, YStack, H1, H2, Paragraph } from '@hanzo/ui';
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";

export default function SecurityPage() {
  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />

      <YStack paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
        <YStack maxWidth={768} alignSelf="center">
          <H1 fontSize="$11" fontWeight="500" lineHeight="1.05" letterSpacing={-0.4} marginBottom="$5" $md={{ fontSize: "$12" }}>
            Report a security problem
          </H1>

          <Paragraph fontSize="$6" color="$color11" lineHeight="1.5" marginBottom="$6">
            Email{" "}
            <a href="mailto:security@hanzo.ai">
              <SizableText fontSize="$6" color="$color" textDecorationLine="underline">
                security@hanzo.ai
              </SizableText>
            </a>{" "}
            rather than opening a public issue, and include a reproduction if you have one. A real report from a
            stranger is worth more than an internal review. You will get a reply.
          </Paragraph>

          <H2 fontSize="$8" fontWeight="500" marginBottom="$4" lineHeight="1.2">
            While you are looking
          </H2>

          <Paragraph fontSize="$6" color="$color11" lineHeight="1.5" marginBottom="$6">
            Leave two things alone: anything that degrades the service for other people, and any data that is not
            yours. Neither one is needed to show us a bug, and a report that stops short of both is the one we can
            act on fastest.
          </Paragraph>

          <Paragraph fontSize="$5" color="$color11" lineHeight="1.5">
            The same address in machine-readable form is at{" "}
            <a href="/.well-known/security.txt">
              <SizableText fontSize="$5" color="$color" textDecorationLine="underline">
                /.well-known/security.txt
              </SizableText>
            </a>
            .
          </Paragraph>
        </YStack>
      </YStack>

      <SiteFooter />
    </YStack>
  );
}
