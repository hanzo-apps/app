'use client';

import { XStack, SizableText, Paragraph, YStack } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button } from '@hanzo/ui';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckSquare, ArrowUp, ArrowDown } from 'lucide-react';
import { SyncTabs, BulkActionState } from './sync-tabs';
import { useSyncStatus } from './hooks/use-sync-status';

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

export function SyncDialog({ open, onOpenChange, onSyncComplete }: SyncDialogProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const { status, refresh, loading, refreshing, error } = useSyncStatus();
  const [bulkState, setBulkState] = useState<BulkActionState | null>(null);

  useEffect(() => {
    if (open) {
      checkAuth();
      refresh();
    }
  }, [open, refresh]);

  const checkAuth = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch('/v1/auth/me');
      const data = await response.json();
      setAuthenticated(data.authenticated);
    } catch {
      setAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSyncComplete = () => {
    refresh();
    onSyncComplete?.();
  };

  const dialogContentClass = "sm:max-w-2xl";

  // Loading state
  if (authLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${dialogContentClass}`}>
          <DialogHeader>
            <DialogTitle>Server Sync</DialogTitle>
            <DialogDescription>
              Checking authentication status...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${dialogContentClass}`}>
          <DialogHeader>
            <DialogTitle alignItems="center" gap="$2">
              <CloudOff size={20} />
              Not Authenticated
            </DialogTitle>
            <DialogDescription>
              You need to login to sync projects, skills, and templates with the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => (window.location.href = '/admin/login')}>
              Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogContentClass}`}>
        <DialogHeader>
          <DialogTitle alignItems="center" gap="$2">
            <Cloud size={20} />
            Server Sync
          </DialogTitle>
          <DialogDescription>
            Synchronize projects, skills, and templates between your browser and the server.
          </DialogDescription>
        </DialogHeader>

        <div>
          {/* Error Banner */}
          {error && (
            <XStack alignItems="flex-start" gap="$3" padding="$3" backgroundColor="$red9" borderWidth={1} borderColor="$red9" borderRadius="$5">
              <AlertTriangle size={20} color="$red9" />
              <SizableText fontSize="$3" display="flex" flexDirection="column">
                <Paragraph fontWeight="500" color="$red10" $theme-dark={{ color: "$red8" }}>
                  Error loading sync status
                </Paragraph>
                <Paragraph color="$color11" marginTop="$1">{error}</Paragraph>
              </SizableText>
            </XStack>
          )}

          {/* Initial Loading */}
          {loading && (
            <XStack alignItems="center" justifyContent="center" paddingVertical="$6">
              <RefreshCw size={24} color="$color11" />
              <SizableText marginLeft="$2" color="$color11">Loading sync status...</SizableText>
            </XStack>
          )}

          {/* Tabbed Content (kept visible during refresh) */}
          {!loading && !error && (
            <YStack position="relative">
              {refreshing && (
                <XStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$background" zIndex={10} alignItems="center" justifyContent="center" borderRadius="$5">
                  <RefreshCw size={20} color="$color11" />
                </XStack>
              )}
              <SyncTabs
                syncStatus={status}
                onRefresh={refresh}
                onSyncComplete={handleSyncComplete}
                onBulkActionStateChange={setBulkState}
  />
            </YStack>
          )}
        </div>

        <DialogFooter flexDirection="column" alignItems="stretch" gap="$2" $sm={{ flexDirection: "row", alignItems: "center" }}>
          {/* Bulk Actions - left side */}
          <XStack alignItems="center" gap="$2" flexWrap="wrap" flex={1}>
            {bulkState && bulkState.selectableCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={bulkState.onSelectAll}
                disabled={bulkState.isSyncing}
              >
                <CheckSquare size={14} />
                {bulkState.selectedCount === bulkState.selectableCount ? 'Deselect' : 'Select All'}
              </Button>
            )}

            {bulkState && bulkState.pushableCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={bulkState.onPushSelected}
                disabled={bulkState.isSyncing}
              >
                <ArrowUp size={14} />
                Push ({bulkState.pushableCount})
              </Button>
            )}

            {bulkState && bulkState.pullableCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={bulkState.onPullSelected}
                disabled={bulkState.isSyncing}
              >
                <ArrowDown size={14} />
                Pull ({bulkState.pullableCount})
              </Button>
            )}
          </XStack>

          {/* Right side buttons */}
          <XStack alignItems="center" gap="$2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading || refreshing}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </XStack>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
