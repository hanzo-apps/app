'use client';

import { XStack, SizableText, H1, Paragraph } from '@hanzo/gui';
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function StoreSuccessPageView() {
  return (
    <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background" paddingHorizontal="$5">
      <SizableText maxWidth={448} textAlign="center" display="flex" flexDirection="column">
        <CheckCircle2 size={48} color="$green9" />
        <H1 fontSize="$8" fontWeight="500" marginBottom="$2">Thank you — your order is confirmed</H1>
        <Paragraph color="$color11" marginBottom="$5">
          Payment completed on Square. A receipt has been sent to your email.
        </Paragraph>
        <Link
          href="/store"
        ><SizableText alignItems="center" justifyContent="center" borderRadius="$3" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2.5" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
          Back to store
        </SizableText></Link>
      </SizableText>
    </XStack>
  );
}
