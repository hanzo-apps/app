'use client';

import { SizableText, XStack, Paragraph } from '@hanzo/gui';
import { useLocalStorage } from "react-use";
import { Button, Dialog, DialogContent, DialogTitle } from '@hanzo/ui';
import { useUser } from "@/hooks/useUser";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { Page } from "@/types";

export const LoginModal = ({
  open,
  pages,
  onClose,
  title = "Log In to use Hanzo for free",
  description = "Sign in with your Hanzo account to continue building and increase your monthly limit.",
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
        <SizableText flexDirection="column" alignItems="flex-start" textAlign="left" position="relative" paddingTop="$2" display="flex">
          <XStack alignItems="center" justifyContent="flex-start" columnGap="$4" marginBottom="$4.5">
            <SizableText width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$10" display="flex" flexDirection="row">
              💪
            </SizableText>
            <SizableText width="$10" height="$10" borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={4} alignItems="center" justifyContent="center" fontSize="$11" zIndex={2} display="flex" flexDirection="row">
              😎
            </SizableText>
            <SizableText width="$9" height="$9" borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$10" display="flex" flexDirection="row">
              🙌
            </SizableText>
          </XStack>
          <Paragraph fontSize="$8" fontWeight="500" color="$color">{title}</Paragraph>
          <Paragraph color="$color11" fontSize="$4" marginTop="$2" maxWidth={384}>
            {description}
          </Paragraph>
          <Button
            size="lg"
            width="100%" height={44} marginTop="$6"
            onClick={handleClick}
          >
            <SizableText fontSize="$4" color="$color1">Log In to Continue</SizableText>
          </Button>
        </SizableText>
      </DialogContent>
    </Dialog>
  );
};
