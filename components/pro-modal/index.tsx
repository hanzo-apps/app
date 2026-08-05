'use client';

import { SizableText, XStack, YStack, H2, Paragraph } from '@hanzo/gui';
import { useLocalStorage } from "react-use";
import { Button, Dialog, DialogContent, DialogTitle, Separator } from '@hanzo/ui';
import { CheckCheck } from "lucide-react";
import { accent } from "@/lib/chrome";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { Page } from "@/types";

export const ProModal = ({
  open,
  pages,
  onClose,
}: {
  open: boolean;
  pages: Page[];
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [, setStorage] = useLocalStorage("pages");
  const handleProClick = () => {
    if (pages && !isTheSameHtml(pages?.[0].html)) {
      setStorage(pages);
    }
    window.open("/pricing", "_blank");
    onClose(false);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent borderRadius="$6" backgroundColor="$background" borderColor="$borderColor" $sm={{ maxWidth: 512 }} $lg={{ padding: "$6" }}>
        <DialogTitle display="none" />
        <YStack alignItems="flex-start" position="relative" paddingTop="$2">
          <XStack alignItems="center" justifyContent="flex-start" columnGap="$4" marginBottom="$4.5">
            <XStack width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
              <SizableText fontSize="$10">🚀</SizableText>
            </XStack>
            <XStack width="$10" height="$10" borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={4} alignItems="center" justifyContent="center" zIndex={2}>
              <SizableText fontSize="$11">🤩</SizableText>
            </XStack>
            <XStack width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
              <SizableText fontSize="$10">🥳</SizableText>
            </XStack>
          </XStack>
          <H2 fontSize="$8" fontWeight="500" color="$color">
            Only $9 to enhance your possibilities
          </H2>
          <Paragraph color="$color11" fontSize="$4" marginTop="$2" maxWidth={384}>
            It seems like you have reached the monthly free limit of Hanzo.
          </Paragraph>
          <Separator borderColor="$borderColor" width="100%" maxWidth={150} marginVertical="$5" />
          <Paragraph fontSize="$6" marginTop="$3" color="$color" fontWeight="500">
            Upgrade to a <ProTag /> Account, and unlock your
            Hanzo high quota access ⚡
          </Paragraph>
          <YStack marginTop="$3" rowGap="$1">
            <SizableText fontSize="$3" color="$color11" marginBottom="$3">
              You&apos;ll also unlock PRO features, like:
            </SizableText>
            <XStack alignItems="center" justifyContent="flex-start" gap="$2" columnGap="$2">
              <CheckCheck size={16} color="var(--brand-accent-muted)" />
              <SizableText fontSize="$3" color="$color11">Get acces to thousands of AI app (ZeroGPU) with high quota</SizableText>
            </XStack>
            <XStack alignItems="center" justifyContent="flex-start" gap="$2" columnGap="$2">
              <CheckCheck size={16} color="var(--brand-accent-muted)" />
              <SizableText fontSize="$3" color="$color11">Get exclusive early access to new features and updates</SizableText>
            </XStack>
            <XStack alignItems="center" justifyContent="flex-start" gap="$2" columnGap="$2">
              <CheckCheck size={16} color="var(--brand-accent-muted)" />
              <SizableText fontSize="$3" color="$color11">Get free credits across all Inference Providers</SizableText>
            </XStack>
            <SizableText fontSize="$3" color="$color11" marginTop="$3">
              ... and lots more!
            </SizableText>
          </YStack>
          {/* Sole action of the modal, so it is the loud one. Unnamed, it
              resolved to the quiet variant — `$color2`, the same fill a panel
              uses — and the only thing this dialog asks you to do read as
              another surface rather than a control. */}
          <Button
            {...accent}
            size="lg"
            width="100%" height={44} marginTop="$6"
            onClick={handleProClick}
          >
            Subscribe to PRO ($9/month)
          </Button>
        </YStack>
      </DialogContent>
    </Dialog>
  );
};

const ProTag = () => (
  <SizableText
    borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="var(--brand-accent-soft)" marginHorizontal="$1" paddingHorizontal="$2.5" paddingVertical="$0.5" fontSize="$1" fontWeight="500" color="var(--brand-accent-muted)"
  >
    PRO
  </SizableText>
);
export default ProModal;
