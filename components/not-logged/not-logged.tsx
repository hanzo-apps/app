"use client";

import { YStack, H2, Paragraph } from '@hanzo/gui';
import { useUser } from "@/hooks/useUser";
import { Button } from '@hanzo/ui';

export const NotLogged = () => {
  const { openLoginWindow } = useUser();
  return (
    <YStack maxWidth="86rem" paddingVertical="$8" paddingHorizontal="$4" alignSelf="center">
      <YStack marginTop="$6" maxWidth={576} alignSelf="center">
        <YStack rowGap="$4" marginBottom="$6" alignSelf="center">
          <H2 fontSize="$11" fontWeight="500" color="$color" textAlign="center">
            Oops! You must be logged to continue.
          </H2>
          <Paragraph color="$color11" fontSize="$6" marginTop="$1" textAlign="center">
            Unfortunately you cannot access Hanzo without being logged
            with your Hanzo account.
          </Paragraph>
        </YStack>
        <Button size="lg" variant="default" onClick={openLoginWindow}>
          Log In to Continue
        </Button>
      </YStack>
    </YStack>
  );
};
