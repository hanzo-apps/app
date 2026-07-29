'use client';

import { XStack, YStack, SizableText, Paragraph } from '@hanzo/gui';
import React, { useState, useEffect } from 'react';
import { Project } from '@/lib/vfs/types';
import { Sidebar } from '@/components/sidebar';
import { AppHeader } from '@/components/ui/app-header';
import { Cloud, AlertTriangle, Database } from 'lucide-react';
import { SyncDialog } from '@/components/project-manager/sync-dialog';
import { logger } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getSyncOverviewStatus } from '@/lib/vfs/auto-sync';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button } from '@hanzo/ui';

interface PageLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onProjectSelect: (project: Project) => void;
  onStartTour?: () => void;
  onOpenAbout?: () => void;
  onOpenSettings?: () => void;
  showSidebar?: boolean; // false when in Workspace
}

export function PageLayout({
  children,
  currentView,
  onNavigate,
  onProjectSelect,
  onStartTour,
  onOpenAbout,
  onOpenSettings,
  showSidebar = true,
}: PageLayoutProps) {
  const router = useRouter();
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [sidebarHovering, setSidebarHovering] = useState(false);
  const [, setSidebarCollapsed] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [localProjectCount, setLocalProjectCount] = useState(0);

  const isServerMode = process.env.NEXT_PUBLIC_SERVER_MODE === 'true';
  const INIT_DISMISSED_KEY = 'osw-server-init-dismissed';

  // Check if server needs initialization on mount (Server Mode only)
  useEffect(() => {
    if (!isServerMode || !showSidebar) return;

    // Check if user has already dismissed this modal
    const dismissed = localStorage.getItem(INIT_DISMISSED_KEY);
    if (dismissed === 'true') return;

    async function checkServerInit() {
      try {
        const status = await getSyncOverviewStatus();
        setLocalProjectCount(status.localProjectCount);

        // Show modal if server is uninitialized but local has projects
        if (status.isUninitialized && status.localProjectCount > 0) {
          setInitModalOpen(true);
        }
      } catch (error) {
        logger.error('Failed to check server initialization:', error);
      }
    }
    checkServerInit();
  }, [isServerMode, showSidebar]);

  const handleDismissInitModal = () => {
    localStorage.setItem(INIT_DISMISSED_KEY, 'true');
    setInitModalOpen(false);
  };

  const handleOpenSyncFromInit = () => {
    setInitModalOpen(false);
    setSyncDialogOpen(true);
  };

  // When in Workspace, don't show sidebar or header
  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <XStack position="relative" height="100%" overflow="hidden">
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        onProjectSelect={onProjectSelect}
        onStartTour={onStartTour}
        onOpenAbout={onOpenAbout}
        onOpenSettings={onOpenSettings}
        onServerSync={() => setSyncDialogOpen(true)}
        onLogoClick={() => router.push('/admin')}
        onPinnedChange={setSidebarPinned}
        onHoverChange={setSidebarHovering}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
  />

      {/* Backdrop when sidebar is unpinned and hovering */}
      {!sidebarPinned && sidebarHovering && (
        <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="black" zIndex={30} />
      )}

      <YStack
        flex={1} overflow="hidden" {...{ $md: !sidebarPinned ? {"marginLeft":56} : undefined }}
      >
        {/* Header - mobile only (logo + page name + hamburger) */}
        <AppHeader
          hideLogo={true}
          showMobileMenu={true}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          hideActionsOnMobile={true}
          pageName={currentView.charAt(0).toUpperCase() + currentView.slice(1)}
          className="md:hidden"
  />
        {/* Content area */}
        <YStack flex={1} overflow="hidden">
          {children}
        </YStack>
      </YStack>

      {/* Sync Dialog */}
      <SyncDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
  />

      {/* First-Time Server Initialization Modal */}
      <Dialog open={initModalOpen} onOpenChange={setInitModalOpen}>
        <DialogContent $sm={{ maxWidth: 448 }}>
          <DialogHeader>
            <DialogTitle alignItems="center" gap="$2">
              <AlertTriangle size={20} color="$orange9" />
              Server Database Not Initialized
            </DialogTitle>
            <DialogDescription>
              Your server database is empty, but you have {localProjectCount} project{localProjectCount !== 1 ? 's' : ''} stored locally.
            </DialogDescription>
          </DialogHeader>

          <YStack rowGap="$4" paddingVertical="$4">
            <XStack alignItems="flex-start" gap="$3" padding="$3" backgroundColor="$color3" borderRadius="$5">
              <Database size={20} color="$color11" />
              <SizableText fontSize="$3" display="flex" flexDirection="column">
                <Paragraph fontWeight="500">Why does this matter?</Paragraph>
                <Paragraph color="$color11" marginTop="$1">
                  The <strong>Deployments</strong> feature requires projects to be synced to the server database.
                  Until you push your local projects, the Deployments view won&apos;t show any projects to publish.
                </Paragraph>
              </SizableText>
            </XStack>

            <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">
              Click <strong>Open Sync</strong> to push your local projects to the server, or dismiss this message to configure it later.
            </SizableText>
          </YStack>

          <DialogFooter flexDirection="column" gap="$2" $sm={{ flexDirection: "row" }}>
            <Button
              variant="outline"
              onClick={handleDismissInitModal}
            >
              Dismiss
            </Button>
            <Button
              onClick={handleOpenSyncFromInit}
            >
              <Cloud size={16} />
              Open Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </XStack>
  );
}
