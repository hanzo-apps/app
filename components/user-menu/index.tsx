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
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";

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

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const UserMenu = ({ className }: { className?: string }) => {
  const { logout, user } = useAuthContext();
  const { address, isConnected } = useAccount();

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
          <span className="max-lg:hidden">{displayName}</span>
          <span className="lg:hidden">
            {displayName.slice(0, 10)}
            {displayName.length > 10 ? "..." : ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || user?.username}
            </p>
            {isConnected && address && (
              <p className="text-xs leading-none text-muted-foreground font-mono flex items-center gap-1 pt-1">
                <Wallet className="size-3" />
                {truncateAddress(address)}
              </p>
            )}
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
          <Link href="/gallery">
            <DropdownMenuItem>
              <Sparkles className="size-4 text-neutral-400" />
              Gallery
            </DropdownMenuItem>
          </Link>
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
          <Link href="/billing">
            <DropdownMenuItem>
              <DollarSign className="size-4 text-neutral-400" />
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
