'use client';

import { XStack, YStack, SizableText } from '@hanzo/gui';
import React from 'react';
import { Button } from '@hanzo/ui';
import { LogOut } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface ConnectionBadgeProps {
  method?: string;
  extra?: string;
  info?: React.ReactNode;
  onDisconnect: () => void;
  disconnecting?: boolean;
}

export function ConnectionBadge({ method, extra, info, onDisconnect, disconnecting }: ConnectionBadgeProps) {
  return (
    <div>
      <XStack alignItems="center" justifyContent="space-between" padding="$2.5" borderRadius="$5" borderWidth={1} borderColor="$green3" backgroundColor="$green1">
        <XStack alignItems="center" gap="$2">
          <YStack height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$green9" shadowColor="$shadowColor" />
          <SizableText fontSize="$3" fontWeight="500" color="$green11">Connected</SizableText>
          {method && (
            <SizableText fontSize="$1" color="$color11">via {method}</SizableText>
          )}
          {extra && (
            <SizableText fontSize="$1" color="$color11">{extra}</SizableText>
          )}
        </XStack>
        <Button
          size="sm"
          variant="ghost"
          group height={28} paddingHorizontal="$2"
          onClick={onDisconnect}
          disabled={disconnecting}
        >
          <XStack alignItems="center" gap="$1">
            {disconnecting ? (
              <Spinner size={12} />
            ) : (
              <LogOut size={12} />
            )}
            <SizableText color="$color11" fontSize="$1" $group-hover={{ color: "$red9" }}>Disconnect</SizableText>
          </XStack>
        </Button>
      </XStack>
      {info && (
        <YStack marginTop="$2" paddingLeft="$0.5">
          <SizableText fontSize="$1" color="$color11">{info}</SizableText>
        </YStack>
      )}
    </div>
  );
}
