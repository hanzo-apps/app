'use client';

import { SizableText, Paragraph } from '@hanzo/gui';
import { ItemSyncStatus } from '@/lib/vfs/sync-types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@hanzo/ui';
import {
  CheckCircle,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  HardDrive,
  Cloud,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface SyncStatusBadgeProps {
  status: ItemSyncStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

// Status → value: label, copy, icon, and the gui color pair (text on a soft
// wash of the same hue). Colors are theme tokens, so dark mode is free.
const STATUS_CONFIG: Record<
  ItemSyncStatus,
  {
    label: string;
    description: string;
    icon: typeof CheckCircle;
    color: string;
    background: string;
  }
> = {
  synced: {
    label: 'Synced',
    description: 'Local and server are in sync. No action needed.',
    icon: CheckCircle,
    color: '$green10',
    background: '$green3',
  },
  'local-newer': {
    label: 'Local newer',
    description: 'You have local changes not yet on the server. Push to sync.',
    icon: ArrowUp,
    color: '$blue10',
    background: '$blue3',
  },
  'server-newer': {
    label: 'Server newer',
    description: 'Server has updates you don\'t have locally. Pull to get latest.',
    icon: ArrowDown,
    color: '$orange10',
    background: '$orange3',
  },
  conflict: {
    label: 'Conflict',
    description: 'Both local and server have changes. Push to overwrite server, or pull to discard local changes.',
    icon: AlertTriangle,
    color: '$red10',
    background: '$red3',
  },
  'local-only': {
    label: 'Local only',
    description: 'Only exists in your browser. Push to save to server.',
    icon: HardDrive,
    color: '$color11',
    background: '$color3',
  },
  'server-only': {
    label: 'Server only',
    description: 'Only exists on server. Pull to download locally.',
    icon: Cloud,
    color: '$purple10',
    background: '$purple3',
  },
  syncing: {
    label: 'Syncing...',
    description: 'Currently syncing with server.',
    icon: RefreshCw,
    color: '$blue10',
    background: '$blue3',
  },
  error: {
    label: 'Error',
    description: 'Sync failed. Try again.',
    icon: XCircle,
    color: '$red10',
    background: '$red3',
  },
};

export function SyncStatusBadge({
  status,
  showLabel = true,
  size = 'sm',
}: SyncStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const sm = size === 'sm';

  const badge = (
    <SizableText
      alignItems="center"
      gap="$1"
      borderRadius="$10"
      fontWeight="500"
      cursor="help"
      fontSize={sm ? '$2' : '$3'}
      paddingHorizontal={sm ? '$1.5' : '$2'}
      paddingVertical={sm ? '$0.5' : '$1'}
      color={config.color}
      backgroundColor={config.background}
    >
      <Icon size={sm ? 14 : 16} className={status === 'syncing' ? 'spin' : undefined} />
      {showLabel && <span>{config.label}</span>}
    </SizableText>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" maxWidth={320}>
        <Paragraph fontSize="$3">{config.description}</Paragraph>
      </TooltipContent>
    </Tooltip>
  );
}

export function getStatusPriority(status: ItemSyncStatus): number {
  const priorities: Record<ItemSyncStatus, number> = {
    conflict: 0,
    error: 1,
    'local-newer': 2,
    'server-newer': 3,
    syncing: 4,
    'local-only': 5,
    'server-only': 6,
    synced: 7,
  };
  return priorities[status];
}
