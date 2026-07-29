'use client';

import { YStack, XStack } from '@hanzo/gui';
import Image from "next/image";

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
              width="$8" height="$8" borderRadius="$3" objectFit="cover"
              width={40}
              height={40}
  />
            <Button
              size="iconXsss"
              variant="secondary"
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
