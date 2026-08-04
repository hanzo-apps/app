'use client';

import { XStack, YStack, SizableText, H1, Paragraph } from '@hanzo/gui';
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function StoreSuccessPageView() {
  return (
    <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background" paddingHorizontal="$5">
      <YStack maxWidth={448}>
        <CheckCircle2 size={48} />
        <H1 fontSize="$8" fontWeight="500" marginBottom="$2" textAlign="center">Thank you — your order is confirmed</H1>
        <Paragraph color="$color11" marginBottom="$5" textAlign="center">
          Payment completed on Square. A receipt has been sent to your email.
        </Paragraph>
        <Link
          href="/store"
        ><XStack alignItems="center" justifyContent="center" borderRadius="$3" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingHorizontal="$4.5" paddingVertical="$2.5" hoverStyle={{ backgroundColor: "$color6" }}>
          <SizableText fontSize="$3" fontWeight="500" color="$background">Back to store</SizableText>
        </XStack></Link>
      </YStack>
    </XStack>
  );
}
