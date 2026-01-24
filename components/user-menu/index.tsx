import {
  ChartSpline,
  CirclePlus,
  FolderCode,
  Import,
  LogOut,
  Settings,
  Home,
  MessageCircle,
  Sparkles,
  User,
  CreditCard,
  Palette,
  Shield,
  HelpCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { useUser } from "@/hooks/useUser";

export const UserMenu = ({ className }: { className?: string }) => {
  const { logout, user } = useUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`${className}`}>
          <Avatar className="size-8 mr-1">
            <AvatarImage src={user?.avatarUrl} alt="@shadcn" />
            <AvatarFallback className="text-sm">
              {(user?.fullname || user?.name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="max-lg:hidden">{user?.fullname || user?.name || 'User'}</span>
          <span className="lg:hidden">
            {(user?.fullname || user?.name || 'User').slice(0, 10)}
            {((user?.fullname || user?.name || '').length) > 10 ? "..." : ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.fullname || user?.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || user?.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Quick Actions */}
        <DropdownMenuGroup>
          <Link href="/dashboard">
            <DropdownMenuItem>
              <Home className="size-4 text-neutral-400" />
              Dashboard
            </DropdownMenuItem>
          </Link>
          <Link href="/chat">
            <DropdownMenuItem>
              <MessageCircle className="size-4 text-neutral-400" />
              Chat
            </DropdownMenuItem>
          </Link>
          <Link href="/new">
            <DropdownMenuItem>
              <CirclePlus className="size-4 text-neutral-400" />
              New Project
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Projects */}
        <DropdownMenuGroup>
          <Link href="/projects">
            <DropdownMenuItem>
              <FolderCode className="size-4 text-neutral-400" />
              My Projects
            </DropdownMenuItem>
          </Link>
          <Link href="/projects">
            <DropdownMenuItem>
              <Import className="size-4 text-neutral-400" />
              Import Project
            </DropdownMenuItem>
          </Link>
          <a href="https://huggingface.co/spaces/hanzoai/gallery" target="_blank">
            <DropdownMenuItem>
              <Sparkles className="size-4 text-neutral-400" />
              Gallery
            </DropdownMenuItem>
          </a>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Account */}
        <DropdownMenuGroup>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="size-4 text-neutral-400" />
              Settings
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem>
              <User className="size-4 text-neutral-400" />
              Profile
            </DropdownMenuItem>
          </Link>
          <a href="https://huggingface.co/settings/billing" target="_blank">
            <DropdownMenuItem>
              <ChartSpline className="size-4 text-neutral-400" />
              Usage & Billing
            </DropdownMenuItem>
          </a>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (confirm("Are you sure you want to log out?")) {
              logout();
            }
          }}
          className="text-red-500 focus:text-red-600"
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
