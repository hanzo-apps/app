"use client";

import { YStack, SizableText, H2, Paragraph } from '@hanzo/gui';
import { useUser } from "@/hooks/useUser";
import { Button } from '@hanzo/ui';

export const NotLogged = () => {
  const { openLoginWindow } = useUser();
  return (
    <YStack maxWidth="86rem" paddingVertical="$8" paddingHorizontal="$4" alignSelf="center">
      <SizableText marginTop="$6" textAlign="center" maxWidth={576} alignSelf="center" display="flex" flexDirection="column">
        <SizableText rowGap="$4" marginBottom="$6" textAlign="center" alignSelf="center" display="flex" flexDirection="column">
          <H2 fontSize="$11" fontWeight="500" color="$color">
            Oops! You must be logged to continue.
          </H2>
          <Paragraph color="$color11" fontSize="$6" marginTop="$1">
            Unfortunately you cannot access Hanzo without being logged
            with your Hanzo account.
          </Paragraph>
        </SizableText>
        <Button size="lg" variant="default" onClick={openLoginWindow}>
          Log In to Continue
        </Button>
      </SizableText>
    </YStack>
  );
};
