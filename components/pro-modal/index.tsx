'use client';

import { SizableText, XStack, H2, Paragraph } from '@hanzo/gui';
import { useLocalStorage } from "react-use";
import { Button, Dialog, DialogContent, DialogTitle, Separator } from '@hanzo/ui';
import { CheckCheck } from "lucide-react";
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
        <SizableText flexDirection="column" alignItems="flex-start" textAlign="left" position="relative" paddingTop="$2" display="flex">
          <XStack alignItems="center" justifyContent="flex-start" columnGap="$4" marginBottom="$4.5">
            <SizableText width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$10" display="flex" flexDirection="row">
              🚀
            </SizableText>
            <SizableText width="$10" height="$10" borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={4} alignItems="center" justifyContent="center" fontSize="$11" zIndex={2} display="flex" flexDirection="row">
              🤩
            </SizableText>
            <SizableText width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$10" display="flex" flexDirection="row">
              🥳
            </SizableText>
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
          <SizableText marginTop="$3" rowGap="$1" color="$color11" display="flex" flexDirection="column">
            <SizableText fontSize="$3" color="$color11" columnGap="$2" alignItems="center" justifyContent="flex-start" gap="$2" marginBottom="$3">
              You&apos;ll also unlock PRO features, like:
            </SizableText>
            <SizableText fontSize="$3" columnGap="$2" alignItems="center" justifyContent="flex-start" gap="$2">
              <CheckCheck size={16} color="var(--brand-accent-muted)" />
              Get acces to thousands of AI app (ZeroGPU) with high quota
            </SizableText>
            <SizableText fontSize="$3" columnGap="$2" alignItems="center" justifyContent="flex-start" gap="$2">
              <CheckCheck size={16} color="var(--brand-accent-muted)" />
              Get exclusive early access to new features and updates
            </SizableText>
            <SizableText fontSize="$3" columnGap="$2" alignItems="center" justifyContent="flex-start" gap="$2">
              <CheckCheck size={16} color="var(--brand-accent-muted)" />
              Get free credits across all Inference Providers
            </SizableText>
            <SizableText fontSize="$3" color="$color11" columnGap="$2" alignItems="center" justifyContent="flex-start" gap="$2" marginTop="$3">
              ... and lots more!
            </SizableText>
          </SizableText>
          <Button
            size="lg"
            width="100%" height={44} marginTop="$6"
            onClick={handleProClick}
          >
            <SizableText fontSize="$4">Subscribe to PRO ($9/month)</SizableText>
          </Button>
        </SizableText>
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
