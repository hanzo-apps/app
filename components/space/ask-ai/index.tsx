"use client";

import { YStack, XStack } from '@hanzo/gui';
import { ArrowUp } from "lucide-react";
import { PiGearSixFill } from "react-icons/pi";
import { TiUserAdd } from "react-icons/ti";

import { Button, Textarea } from '@hanzo/ui';

export const AskAi = () => {
  return (
    <>
      <YStack backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" borderRadius="$8" group focusStyle={{ borderColor: "$borderColor" }}>
        <Textarea
          rows={3}
          width="100%" backgroundColor="transparent" fontSize="$3" outlineWidth={0} color="$color" placeholderTextColor="$color11" padding="$4" resize="none" marginBottom="$1"
          placeholder="Ask Hanzo anything..."
          onChange={() => {}}
          onKeyDown={() => {}}
  />
        <XStack alignItems="center" justifyContent="space-between" gap="$2" paddingHorizontal="$4" paddingBottom="$3">
          <XStack flex={1} justifyContent="flex-start">
            <Button
              size="iconXs"
              variant="outline"
              borderColor="$borderColor" color="$color11" hoverStyle={{ borderColor: "$color", color: "$color" }}
            >
              <TiUserAdd size={16} />
            </Button>
          </XStack>
          <XStack alignItems="center" justifyContent="flex-end" gap="$2">
            <Button backgroundColor="$color12" color="$color4" size="sm">
              <PiGearSixFill size={16} />
              Settings
            </Button>
            <Button size="iconXs">
              <ArrowUp size={16} />
            </Button>
          </XStack>
        </XStack>
      </YStack>
    </>
  );
};
