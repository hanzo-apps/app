"use client";

import { XStack, YStack, Paragraph, SizableText } from '@hanzo/gui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button } from '@hanzo/ui';
import { ExternalLink, AlertTriangle } from "lucide-react";
import { SITE_URL } from "@/lib/site";

interface IframeWarningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IframeWarningModal({
  isOpen,
}: // onOpenChange,
IframeWarningModalProps) {
  const handleVisitSite = () => {
    window.open(SITE_URL, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent $sm={{ maxWidth: 448 }}>
        <DialogHeader>
          <XStack alignItems="center" gap="$2">
            <AlertTriangle size={20} color="$red9" />
            <DialogTitle>Unauthorized Embedding</DialogTitle>
          </XStack>
          <DialogDescription textAlign="left">
            You&apos;re viewing Hanzo AI through an unauthorized iframe. For the
            best experience and security, please visit the official website
            directly.
          </DialogDescription>
        </DialogHeader>

        <YStack backgroundColor="$color3" borderRadius="$5" padding="$4" rowGap="$2">
          <Paragraph fontSize="$3" fontWeight="500">Why visit the official site?</Paragraph>
          <YStack rowGap="$1">
            <SizableText fontSize="$3" color="$color11">• Better performance and security</SizableText>
            <SizableText fontSize="$3" color="$color11">• Full functionality access</SizableText>
            <SizableText fontSize="$3" color="$color11">• Latest features and updates</SizableText>
            <SizableText fontSize="$3" color="$color11">• Proper authentication support</SizableText>
          </YStack>
        </YStack>

        <DialogFooter flexDirection="column" gap="$2" $sm={{ flexDirection: "row" }}>
          <Button onClick={handleVisitSite} width="100%" $sm={{ width: "auto" }}>
            <ExternalLink size={16} />
            Visit Hanzo.App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
