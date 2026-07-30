'use client';

import { SizableText, YStack, Paragraph, XStack } from '@hanzo/gui';
import {
  CirclePlus,
  FolderCode,
  Import,
  LogOut,
  Settings,
  Home,
  MessageCircle,
  Search,
  Sparkles,
  User,
  DollarSign,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Avatar, AvatarFallback, AvatarImage, Button } from '@hanzo/ui';
import { useUser } from "@/hooks/useUser";

export const UserMenu = ({ className }: { className?: string }) => {
  const { logout, user } = useUser();
  // Theme via the ONE controller (next-themes) — same source as settings + sonner.
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const activeTheme = mounted ? theme ?? "system" : "system";

  // Identity is resolved ONCE, in useUser — never re-derived per surface.
  const displayName = user?.name || "User";
  const userInitial = user?.initials || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`${className}`}>
          <Avatar width="$6" height="$6" marginRight="$1">
            <AvatarImage src={user?.avatarUrl} alt={displayName} />
            <AvatarFallback fontSize="$3">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <SizableText display="none" maxWidth="12rem" numberOfLines={1}>{displayName}</SizableText>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent width={224} align="start">
        <DropdownMenuLabel>
          <YStack rowGap="$1">
            <Paragraph fontSize="$3" fontWeight="500" lineHeight={1}>{displayName}</Paragraph>
            <Paragraph fontSize="$1" lineHeight={1} color="$color11">
              {user?.email || user?.username}
            </Paragraph>
          </YStack>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Quick Actions */}
        <DropdownMenuGroup>
          <Link href="/dashboard">
            <DropdownMenuItem>
              <Home size={16} color="$color11" />
              Dashboard
            </DropdownMenuItem>
          </Link>
          <Link href="/chat">
            <DropdownMenuItem>
              <MessageCircle size={16} color="$color11" />
              Chat
            </DropdownMenuItem>
          </Link>
          <Link href="/new">
            <DropdownMenuItem>
              <CirclePlus size={16} color="$color11" />
              New Project
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Projects */}
        <DropdownMenuGroup>
          <Link href="/projects">
            <DropdownMenuItem>
              <FolderCode size={16} color="$color11" />
              My Projects
            </DropdownMenuItem>
          </Link>
          <Link href="/projects">
            <DropdownMenuItem>
              <Import size={16} color="$color11" />
              Import Project
            </DropdownMenuItem>
          </Link>
          <Link href="/gallery">
            <DropdownMenuItem>
              <Sparkles size={16} color="$color11" />
              Gallery
            </DropdownMenuItem>
          </Link>
          {/* Everything the fleet has built, across every org — /v1/catalog. */}
          <Link href="/catalog">
            <DropdownMenuItem>
              <Search size={16} color="$color11" />
              Catalog
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Account */}
        <DropdownMenuGroup>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings size={16} color="$color11" />
              Settings
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem>
              <User size={16} color="$color11" />
              Profile
            </DropdownMenuItem>
          </Link>
          <Link href="/billing">
            <DropdownMenuItem>
              <DollarSign size={16} color="$color11" />
              Billing
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Theme — discoverable light/dark/system here instead of only buried in
            Settings. Drives the ONE next-themes source (consistent app-wide). */}
        <YStack paddingHorizontal="$2" paddingVertical="$1.5">
          <XStack alignItems="center" justifyContent="space-between" gap="$2">
            <SizableText fontSize="$1" color="$color11">Theme</SizableText>
            <XStack alignItems="center" gap="$0.5" borderRadius="$3" backgroundColor="$color3" padding="$0.5">
              {([
                { v: "light", Icon: Sun, label: "Light" },
                { v: "dark", Icon: Moon, label: "Dark" },
                { v: "system", Icon: Monitor, label: "System" },
              ] as const).map(({ v, Icon, label }) => (
                <Button
                  key={v}
                  type="button"
                  onClick={() => setTheme(v)}
                  title={`${label} theme`}
                  aria-label={`${label} theme`}
                  aria-pressed={activeTheme === v}
                  alignItems="center" justifyContent="center" borderRadius="$2" padding="$1.5" {...{ backgroundColor: activeTheme === v ? "$background" : undefined, color: activeTheme === v ? "$color" : "$color11", elevation: activeTheme === v ? 1 : undefined, hoverStyle: activeTheme === v ? undefined : {"color":"$color"} }}
                >
                  <Icon size={16} />
                </Button>
              ))}
            </XStack>
          </XStack>
        </YStack>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (confirm("Are you sure you want to log out?")) {
              logout();
            }
          }}
          color="$red9" focusStyle={{ color: "$red10" }}
        >
          <LogOut size={16} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
