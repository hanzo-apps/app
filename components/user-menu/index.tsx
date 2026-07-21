import {
  CirclePlus,
  FolderCode,
  Import,
  LogOut,
  Settings,
  Home,
  MessageCircle,
  Sparkles,
  User,
  DollarSign,
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
import { useAuthContext } from "@/components/providers/AuthProvider";

export const UserMenu = ({ className }: { className?: string }) => {
  const { logout, user } = useAuthContext();

  const displayName = user?.fullname || user?.name || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`${className}`}>
          <Avatar className="size-8 mr-1">
            <AvatarImage src={user?.avatarUrl} alt={displayName} />
            <AvatarFallback className="text-sm">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[12rem] truncate">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
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
              <Home className="size-4 text-muted-foreground" />
              Dashboard
            </DropdownMenuItem>
          </Link>
          <Link href="/chat">
            <DropdownMenuItem>
              <MessageCircle className="size-4 text-muted-foreground" />
              Chat
            </DropdownMenuItem>
          </Link>
          <Link href="/new">
            <DropdownMenuItem>
              <CirclePlus className="size-4 text-muted-foreground" />
              New Project
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Projects */}
        <DropdownMenuGroup>
          <Link href="/projects">
            <DropdownMenuItem>
              <FolderCode className="size-4 text-muted-foreground" />
              My Projects
            </DropdownMenuItem>
          </Link>
          <Link href="/projects">
            <DropdownMenuItem>
              <Import className="size-4 text-muted-foreground" />
              Import Project
            </DropdownMenuItem>
          </Link>
          <Link href="/gallery">
            <DropdownMenuItem>
              <Sparkles className="size-4 text-muted-foreground" />
              Gallery
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Account */}
        <DropdownMenuGroup>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem>
              <User className="size-4 text-muted-foreground" />
              Profile
            </DropdownMenuItem>
          </Link>
          <Link href="/billing">
            <DropdownMenuItem>
              <DollarSign className="size-4 text-muted-foreground" />
              Billing
            </DropdownMenuItem>
          </Link>
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
