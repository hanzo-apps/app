'use client';

import { YStack } from '@hanzo/gui';
import { Deployment } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@hanzo/ui';
import { DatabaseManager } from '@/components/database-manager';

interface ServerSettingsModalProps {
  deployment: Deployment;
  isOpen: boolean;
  onClose: () => void;
}

export function ServerSettingsModal({ deployment, isOpen, onClose }: ServerSettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent height="80vh" flexDirection="column" $sm={{ maxWidth: 896 }}>
        <DialogHeader>
          <DialogTitle>Server Settings</DialogTitle>
          <DialogDescription>
            Manage database, edge functions, and secrets for {deployment.name}
          </DialogDescription>
        </DialogHeader>

        <YStack flex={1} overflow="hidden">
          <DatabaseManager deploymentId={deployment.id} />
        </YStack>
      </DialogContent>
    </Dialog>
  );
}
