'use client';

import { XStack, YStack, SizableText } from '@hanzo/gui';
import { SyncableItem } from '@/lib/vfs/sync-types';
import { SyncStatusBadge } from './sync-status-badge';
import { Button, Checkbox } from '@hanzo/ui';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
interface SyncItemRowProps {
  item: SyncableItem;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
  onPush?: () => void;
  onPull?: () => void;
  onResolve?: () => void;
  disabled?: boolean;
  syncing?: boolean;
}

export function SyncItemRow({
  item,
  selected,
  onSelectChange,
  onPush,
  onPull,
  onResolve,
  disabled = false,
  syncing = false,
}: SyncItemRowProps) {
  const canPush = ['local-newer', 'local-only', 'conflict'].includes(item.status);
  const canPull = ['server-newer', 'server-only', 'conflict'].includes(item.status);
  const isConflict = item.status === 'conflict';

  return (
    <XStack
      alignItems="center" gap="$3" padding="$2" borderRadius="$3" hoverStyle={{ backgroundColor: "$color3" }} {...{ backgroundColor: selected ? "$color3" : undefined }}
    >
      {/* Checkbox */}
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelectChange(checked === true)}
        disabled={disabled || syncing || item.status === 'synced' || item.status === 'server-only'}
        aria-label={`Select ${item.name}`}
  />

      {/* Name */}
      <YStack flex={1} minWidth={0}>
        <SizableText fontSize="$3" fontWeight="500" numberOfLines={1}>{item.name}</SizableText>
      </YStack>

      {/* Status Badge */}
      <SyncStatusBadge status={syncing ? 'syncing' : item.status} showLabel />

      {/* Actions */}
      <XStack alignItems="center" gap="$1">
        {isConflict && onResolve ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onResolve}
            disabled={disabled || syncing}
            height={28}
          >
            <SizableText fontSize="$1" color="$color">Resolve</SizableText>
          </Button>
        ) : (
          <>
            {canPush && onPush && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPush}
                disabled={disabled || syncing}
                height={28} width={28}
                title="Push to server"
              >
                {syncing ? (
                  <RefreshCw size={14} />
                ) : (
                  <ArrowUp size={14} />
                )}
              </Button>
            )}
            {canPull && onPull && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPull}
                disabled={disabled || syncing}
                height={28} width={28}
                title="Pull from server"
              >
                {syncing ? (
                  <RefreshCw size={14} />
                ) : (
                  <ArrowDown size={14} />
                )}
              </Button>
            )}
          </>
        )}
      </XStack>
    </XStack>
  );
}
