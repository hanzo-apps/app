'use client';

import { SizableText, XStack, YStack, Paragraph } from '@hanzo/ui';
import { useLocalStorage } from "react-use";
import { Button, Dialog, DialogContent, DialogTitle } from '@hanzo/ui';
import { useUser } from "@/hooks/useUser";
import { accent } from "@/lib/chrome";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { Page } from "@/types";

export const LoginModal = ({
  open,
  pages,
  onClose,
  title = "Sign in to keep building",
  description = "Sign in with your Hanzo account. What you have built so far comes with you.",
}: {
  open: boolean;
  pages?: Page[];
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  title?: string;
  description?: string;
}) => {
  const { openLoginWindow } = useUser();
  const [, setStorage] = useLocalStorage("pages");
  const handleClick = async () => {
    if (pages && !isTheSameHtml(pages[0].html)) {
      setStorage(pages);
    }
    openLoginWindow();
    onClose(false);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent borderRadius="$6" backgroundColor="$background" borderColor="$borderColor" $sm={{ maxWidth: 512 }} $lg={{ padding: "$6" }}>
        <DialogTitle display="none" />
        <YStack alignItems="flex-start" position="relative" paddingTop="$2">
          <XStack alignItems="center" justifyContent="flex-start" columnGap="$4" marginBottom="$4.5">
            <XStack width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
              <SizableText fontSize="$10">💪</SizableText>
            </XStack>
            <XStack width="$10" height="$10" borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={4} alignItems="center" justifyContent="center" zIndex={2}>
              <SizableText fontSize="$11">😎</SizableText>
            </XStack>
            <XStack width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
              <SizableText fontSize="$10">🙌</SizableText>
            </XStack>
          </XStack>
          <Paragraph fontSize="$8" fontWeight="500" color="$color">{title}</Paragraph>
          <Paragraph color="$color11" fontSize="$4" marginTop="$2" maxWidth={384}>
            {description}
          </Paragraph>
          {/* The one action this modal exists for, so it wears `accent` — and
              the label says nothing about colour, because the recipe already
              carries `$color12`. Spelling a foreground here is what broke it:
              `$color1` is hsl(0 0% 4%) and the unnamed variant's fill is now
              `$color2` at 8%, so "Log In to Continue" was painted at 1.07:1 —
              measured, not guessed. Legible only if you knew where to click. */}
          <Button
            {...accent}
            size="lg"
            width="100%" height={44} marginTop="$6"
            onClick={handleClick}
          >
            Sign in and keep building
          </Button>
        </YStack>
      </DialogContent>
    </Dialog>
  );
};
