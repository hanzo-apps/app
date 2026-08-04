'use client';

import { XStack, YStack, SizableText, H1, Paragraph } from '@hanzo/gui';
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function StoreCancelPageView() {
  return (
    <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background" paddingHorizontal="$5">
      <YStack maxWidth={448} alignItems="center">
        <XCircle size={48} color="$color11" />
        <H1 fontSize="$8" fontWeight="500" marginBottom="$2" textAlign="center">Checkout canceled</H1>
        <Paragraph color="$color11" marginBottom="$5" textAlign="center">
          No payment was taken. Your cart is still here when you’re ready.
        </Paragraph>
        <Link
          href="/store"
        ><XStack alignItems="center" justifyContent="center" borderRadius="$3" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2.5" hoverStyle={{ backgroundColor: "$color12" }}>
          <SizableText fontSize="$3" fontWeight="500" color="$background">Return to store</SizableText>
        </XStack></Link>
      </YStack>
    </XStack>
  );
}
