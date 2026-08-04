'use client';

import { Paragraph } from '@hanzo/gui';
import { ItemSyncStatus } from '@/lib/vfs/sync-types';
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@hanzo/ui';
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
  className?: string;
}

/**
 * Status is carried by the ICON and the LABEL, never by hue. The eight states
 * used to be eight colours (green/blue/orange/red/purple/neutral), which is both
 * off-palette and the least accessible way to encode a distinction the text
 * already makes. `outline` is the one badge every state wears.
 */
const STATUS_CONFIG: Record<
  ItemSyncStatus,
  { label: string; description: string; icon: typeof CheckCircle }
> = {
  synced: {
    label: 'Synced',
    description: 'Local and server are in sync. No action needed.',
    icon: CheckCircle,
  },
  'local-newer': {
    label: 'Local newer',
    description: 'You have local changes not yet on the server. Push to sync.',
    icon: ArrowUp,
  },
  'server-newer': {
    label: 'Server newer',
    description: 'Server has updates you don\'t have locally. Pull to get latest.',
    icon: ArrowDown,
  },
  conflict: {
    label: 'Conflict',
    description: 'Both local and server have changes. Push to overwrite server, or pull to discard local changes.',
    icon: AlertTriangle,
  },
  'local-only': {
    label: 'Local only',
    description: 'Only exists in your browser. Push to save to server.',
    icon: HardDrive,
  },
  'server-only': {
    label: 'Server only',
    description: 'Only exists on server. Pull to download locally.',
    icon: Cloud,
  },
  syncing: {
    label: 'Syncing...',
    description: 'Currently syncing with server.',
    icon: RefreshCw,
  },
  error: {
    label: 'Error',
    description: 'Sync failed. Try again.',
    icon: XCircle,
  },
};

export function SyncStatusBadge({ status, showLabel = true, className }: SyncStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" cursor="help" className={className}>
          <Icon size={14} className={status === 'syncing' ? 'spin' : undefined} />
          {showLabel && config.label}
        </Badge>
      </TooltipTrigger>
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
