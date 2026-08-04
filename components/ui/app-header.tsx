'use client';

import { YStack, XStack, SizableText, H1, Paragraph } from '@hanzo/gui';
import React, { useState } from 'react';
import { Button, Badge } from '@hanzo/ui';
import { Logo } from '@/components/ui/logo';
import { ChevronDown, ChevronUp, Menu } from 'lucide-react';

export interface HeaderAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  content?: React.ReactNode;
  dataTourId?: string;
}

export interface ViewTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
}

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  onLogoClick?: () => void;
  actions?: HeaderAction[];
  mobileMenuContent?: React.ReactNode;
  desktopOnlyContent?: React.ReactNode; // Content shown only on desktop
  className?: string;
  leftText?: string; // Text to show next to logo on desktop, centered on mobile
  mobileVisibleActions?: string[]; // Action IDs to show outside dropdown on mobile
  viewTabs?: ViewTab[]; // View tabs for switching between sections
  activeViewTab?: string; // Currently active view tab
  onViewTabChange?: (tabId: string) => void; // Callback when view tab changes
  hideLogo?: boolean; // Hide the logo button (for use with sidebar)
  showMobileMenu?: boolean; // Show hamburger menu button on mobile (for sidebar)
  onMobileMenuClick?: () => void; // Callback when hamburger is clicked
  hideActionsOnMobile?: boolean; // Hide all actions on mobile (actions in sidebar instead)
  pageName?: string; // Page name to show in center on mobile (when showMobileMenu is true)
}

export function AppHeader({
  title,
  subtitle,
  badge,
  onLogoClick,
  actions = [],
  mobileMenuContent,
  desktopOnlyContent,
  className = '',
  leftText,
  mobileVisibleActions = [],
  viewTabs,
  activeViewTab,
  onViewTabChange,
  hideLogo = false,
  showMobileMenu = false,
  onMobileMenuClick,
  hideActionsOnMobile = false,
  pageName
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Split actions into mobile-visible and dropdown-only
  const mobileVisibleActionsSet = new Set(mobileVisibleActions);
  const visibleOnMobile = hideActionsOnMobile ? [] : actions.filter(a => mobileVisibleActionsSet.has(a.id));
  const dropdownOnlyActions = hideActionsOnMobile ? [] : actions.filter(a => !mobileVisibleActionsSet.has(a.id));

  return (
    <YStack borderBottomWidth={1} backgroundColor="$background" elevation={1} position="relative" zIndex={20} className={`${className}`}>
      <XStack paddingHorizontal="$3" paddingVertical="$2" alignItems="center" justifyContent="space-between">
        {/* Left side - Logo + pageName (mobile when showMobileMenu is true) */}
        {showMobileMenu && (
          <XStack alignItems="center" gap="$3" $md={{ display: "none" }}>
            <Logo width={24} height={24} />
            {pageName && <SizableText fontSize="$3" fontWeight="500">{pageName}</SizableText>}
          </XStack>
        )}

        {/* Left side - Logo + text (desktop), empty (mobile with sidebar) */}
        {!hideLogo && !showMobileMenu && (
          <Button
            onClick={onLogoClick}
            alignItems="center" gap="$2" padding="$1" paddingRight="$2" borderRadius="$1"
          >
            <Logo width={24} height={24} />
            {/* Show leftText next to logo on desktop only */}
            {leftText && <SizableText fontWeight="500" fontSize="$6" display="none">{leftText}</SizableText>}
          </Button>
        )}

        {/* Center - View tabs or leftText/title (desktop only now) */}
        <XStack alignItems="center" gap="$2" flex={1} justifyContent="center" $md={{ justifyContent: "flex-start", marginLeft: "$5" }}>
          {viewTabs && viewTabs.length > 0 ? (
            /* Show view tabs as pill toggle */
            <XStack borderWidth={1} borderRadius="$10">
              {viewTabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  variant={activeViewTab === tab.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewTabChange?.(tab.id)}
                  gap="$2"
                  {...(index === 0
                    ? { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 9999, borderBottomLeftRadius: 9999 }
                    : index === viewTabs.length - 1
                      ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 9999, borderBottomRightRadius: 9999 }
                      : { borderRadius: 0 })}
                >
                  {tab.icon && <tab.icon size={16} />}
                  {tab.label}
                </Button>
              ))}
            </XStack>
          ) : leftText && !showMobileMenu ? (
            /* Show leftText in center on mobile (only when not using sidebar) */
            <H1 fontSize="$6" fontWeight="500" $md={{ display: "none" }}>{leftText}</H1>
          ) : title ? (
            <>
              {title && <H1 fontSize="$6" fontWeight="500" $md={{ fontSize: "$7" }} lineHeight="1.1">{title}</H1>}
              {badge && <Badge variant="secondary">{badge}</Badge>}
            </>
          ) : null}
        </XStack>

        {/* Desktop - Show subtitle only if no leftText and no center title */}
        {!leftText && !title && subtitle && (
          <YStack display="none" alignItems="center" flex={1} marginLeft="$5">
            <SizableText fontSize="$3" color="$color11">{subtitle}</SizableText>
          </YStack>
        )}

        {/* Right side controls */}
        <XStack alignItems="center" gap="$2">
          {/* Desktop actions */}
          <YStack display="none" alignItems="center" gap="$2">
            {actions.map((action) => (
              action.content ? (
                <div key={action.id}>{action.content}</div>
              ) : (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size={action.size || 'sm'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  gap="$2" justifyContent="flex-start"
                  data-tour-id={action.dataTourId}
                >
                  {action.icon && <action.icon size={16} />}
                  {action.label}
                </Button>
              )
            ))}
            {desktopOnlyContent}
          </YStack>

          {/* Mobile visible actions */}
          <XStack alignItems="center" gap="$2" $md={{ display: "none" }}>
            {visibleOnMobile.map((action) => (
              action.content ? (
                <div key={action.id}>{action.content}</div>
              ) : (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size={action.size || 'sm'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  gap="$2" height="$6" paddingHorizontal="$3"
                  data-tour-id={action.dataTourId}
                >
                  {action.icon && <action.icon size={16} />}
                  {action.label}
                </Button>
              )
            ))}
          </XStack>

          {/* Mobile menu toggle */}
          {(dropdownOnlyActions.length > 0 || mobileMenuContent) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              height="$6" width="$6" $md={{ display: "none" }}
            >
              {mobileMenuOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </Button>
          )}

          {/* Mobile hamburger menu (on right side) */}
          {showMobileMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuClick}
              height="$6" width="$6" $md={{ display: "none" }}
            >
              <Menu size={20} />
            </Button>
          )}
        </XStack>
      </XStack>
      
      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (dropdownOnlyActions.length > 0 || mobileMenuContent) && (
        <YStack borderTopWidth={1} backgroundColor="$color3" paddingHorizontal="$4" paddingVertical="$4" rowGap="$3" $md={{ display: "none" }}>
          {/* Show subtitle on mobile if no leftText and no center title */}
          {!leftText && !title && subtitle && (
            <YStack paddingBottom="$2" borderBottomWidth={1} borderColor="$borderColor">
              <Paragraph fontSize="$3" color="$color11">{subtitle}</Paragraph>
            </YStack>
          )}

          {/* Mobile dropdown-only actions */}
          {dropdownOnlyActions.length > 0 && (
            <YStack rowGap="$2">
              {dropdownOnlyActions.map((action) => (
                action.content ? (
                  <div key={action.id}>{action.content}</div>
                ) : (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size={action.size || 'sm'}
                    onClick={() => {
                      action.onClick();
                      setMobileMenuOpen(false);
                    }}
                    disabled={action.disabled}
                    gap="$2" width="100%" justifyContent="flex-start"
                    data-tour-id={action.dataTourId}
                  >
                    {action.icon && <action.icon size={16} />}
                    {action.label}
                  </Button>
                )
              ))}
            </YStack>
          )}

          {/* Custom mobile menu content */}
          {mobileMenuContent && (
            <YStack paddingTop="$2" borderTopWidth={1} borderColor="$borderColor">
              {mobileMenuContent}
            </YStack>
          )}
        </YStack>
      )}
    </YStack>
  );
}