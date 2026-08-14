'use client';

import { SizableText, YStack } from '@hanzo/ui';
import { useEffect, useRef } from 'react';
import { SyncableItem } from '@/lib/vfs/sync-types';
import { SummaryBar } from './summary-bar';
import { SyncItemRow } from '../sync-item-row';
import { skillsService } from '@/lib/vfs/skills/service';
import { getSyncManager } from '@/lib/vfs/sync-manager';
import { toast } from '@hanzo/ui';
import { logger } from '@/lib/utils';

interface SkillsTabProps {
  items: SyncableItem[];
  selectedIds: Set<string>;
  syncingIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  onSyncingIdsChange: (ids: Set<string>) => void;
  onRefresh: () => void;
  onSyncComplete: () => void;
  onRegisterPushSelected: (handler: (() => Promise<void>) | null) => void;
  onRegisterPullSelected: (handler: (() => Promise<void>) | null) => void;
}

export function SkillsTab({
  items,
  selectedIds,
  syncingIds,
  onSelectedIdsChange,
  onSyncingIdsChange,
  onRefresh,
  onSyncComplete,
  onRegisterPushSelected,
  onRegisterPullSelected,
}: SkillsTabProps) {
  const syncManager = getSyncManager();

  // Use refs to hold the latest values for use in handlers
  const selectedIdsRef = useRef(selectedIds);
  const syncingIdsRef = useRef(syncingIds);
  const itemsRef = useRef(items);

  // Keep refs up to date
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
    syncingIdsRef.current = syncingIds;
    itemsRef.current = items;
  }, [selectedIds, syncingIds, items]);

  const handleSelectChange = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectedIdsChange(newSelected);
  };

  const handlePushSingle = async (item: SyncableItem) => {
    onSyncingIdsChange(new Set(syncingIdsRef.current).add(item.id));
    try {
      const skill = await skillsService.getSkill(item.id);
      if (!skill) {
        toast.error(`"${item.name}" is no longer in this browser, so there is nothing to push. Refresh the list.`);
        return;
      }

      const result = await syncManager.pushSkill(skill);

      if (result.success) {
        // Update local sync metadata
        if (result.skill) {
          await skillsService.updateSyncMetadata(
            item.id,
            new Date(),
            new Date(result.skill.updatedAt)
          );
        }
        toast.success(`Pushed "${item.name}" to server`);
        onRefresh();
        onSyncComplete();
      } else {
        toast.error(result.error || `The server would not take "${item.name}". Try pushing it again.`);
      }
    } catch (error) {
      logger.error('Push skill error:', error);
      toast.error(`Could not reach the server to push "${item.name}".`);
    } finally {
      const next = new Set(syncingIdsRef.current);
      next.delete(item.id);
      onSyncingIdsChange(next);
    }
  };

  const handlePullSingle = async (item: SyncableItem) => {
    onSyncingIdsChange(new Set(syncingIdsRef.current).add(item.id));
    try {
      const result = await syncManager.pullSkill(item.id);

      if (!result.success || !result.skill) {
        toast.error(result.error || `The server did not return "${item.name}". Refresh the list and try again.`);
        return;
      }

      // Import skill to local storage
      await skillsService.importFromServer(result.skill);

      toast.success(`Pulled "${item.name}" from server`);
      onRefresh();
      onSyncComplete();
    } catch (error) {
      logger.error('Pull skill error:', error);
      toast.error(`Could not reach the server to pull "${item.name}".`);
    } finally {
      const next = new Set(syncingIdsRef.current);
      next.delete(item.id);
      onSyncingIdsChange(next);
    }
  };

  // Register handlers on mount only
  useEffect(() => {
    const pushSelected = async () => {
      const currentItems = itemsRef.current;
      const currentSelectedIds = selectedIdsRef.current;

      const itemsToPush = currentItems.filter(
        (item) =>
          currentSelectedIds.has(item.id) &&
          ['local-newer', 'local-only', 'conflict'].includes(item.status)
      );

      for (const item of itemsToPush) {
        await handlePushSingle(item);
      }

      onSelectedIdsChange(new Set());
    };

    const pullSelected = async () => {
      const currentItems = itemsRef.current;
      const currentSelectedIds = selectedIdsRef.current;

      const itemsToPull = currentItems.filter(
        (item) =>
          currentSelectedIds.has(item.id) &&
          ['server-newer', 'server-only', 'conflict'].includes(item.status)
      );

      for (const item of itemsToPull) {
        await handlePullSingle(item);
      }

      onSelectedIdsChange(new Set());
    };

    onRegisterPushSelected(pushSelected);
    onRegisterPullSelected(pullSelected);

    return () => {
      onRegisterPushSelected(null);
      onRegisterPullSelected(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  if (items.length === 0) {
    return (
      <YStack paddingVertical="$6">
        <SizableText textAlign="center" color="$color11">No custom skills here or on the server. Write one and it will show up to sync.</SizableText>
      </YStack>
    );
  }

  return (
    <div>
      {/* Summary */}
      <SummaryBar items={items} />

      {/* Item List - scrollable */}
      <YStack marginTop="$3" borderWidth={1} borderColor="$borderColor" borderRadius="$5" maxHeight={256} overflow="scroll">
        {items.map((item) => (
          <SyncItemRow
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onSelectChange={(selected) => handleSelectChange(item.id, selected)}
            onPush={() => handlePushSingle(item)}
            onPull={() => handlePullSingle(item)}
            syncing={syncingIds.has(item.id)}
            disabled={syncingIds.size > 0}
  />
        ))}
      </YStack>
    </div>
  );
}
