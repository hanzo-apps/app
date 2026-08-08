'use client';

import { YStack, XStack, Image } from '@hanzo/ui';

import { Button } from '@hanzo/ui';
import { Minus } from "lucide-react";

export const SelectedFiles = ({
  files,
  isAiWorking,
  onDelete,
}: {
  files: string[];
  isAiWorking: boolean;
  onDelete: (file: string) => void;
}) => {
  if (files.length === 0) return null;
  return (
    <YStack paddingHorizontal="$4" paddingTop="$3">
      <XStack alignItems="center" justifyContent="flex-start" gap="$2">
        {files.map((file) => (
          <XStack
            key={file}
            alignItems="center" position="relative" justifyContent="flex-start" gap="$2" padding="$1" backgroundColor="$color3" borderRadius="$3"
          >
            <Image
              src={file}
              alt="uploaded image"
              width={40}
              height={40}
              borderRadius="$3"
              objectFit="cover"
  />
            <Button
              variant="ghost"
              width={20} height={20} minWidth={20} minHeight={20} padding={0}
              position="absolute" top="$0.5" right="$0.5" {...{ opacity: isAiWorking ? 0.5 : undefined, cursor: isAiWorking ? "not-allowed" : undefined }}
              disabled={isAiWorking}
              onClick={() => onDelete(file)}
            >
              <Minus size={16} />
            </Button>
          </XStack>
        ))}
      </XStack>
    </YStack>
  );
};
