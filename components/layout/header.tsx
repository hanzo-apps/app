"use client";

// Public/marketing header for hanzo.app — now the SHARED Hanzo shell. Brand,
// the universal "Meet Hanzo" mega-menu, local nav, the Download/+ New project
// CTAs and the mobile sheet all come from <HanzoHeader surface="hanzo.app">
// (@hanzogui/shell) — byte-identical with every other Hanzo property. The only
// app-specific piece is the far-right `account` slot: the cross-app launcher
// plus IAM auth (avatar menu when signed in; Sign In / Get started otherwise).

import { HanzoHeader, HanzoAppLauncher } from "@hanzogui/shell";
import { useRouter } from "next/navigation";
import { Button } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hanzo/ui";
import { LogOut, Settings, ChevronDown, Home, DollarSign } from "lucide-react";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function Header() {
  const { user, isAuthenticated, login, logout } = useAuthContext();
  const router = useRouter();

  // "Get started" = the SIGNUP funnel: land on IAM's registration (signup hint),
  // then after auth drop the new user into the builder — where OrgGate creates
  // their org (onboarding) before the first build. "Sign In" (plain `login()`)
  // is for returning users. Both go through the one canonical IAM PKCE flow.
  const getStarted = () => login("/dev", { signup: true });

  const userInitial = (user?.fullname || user?.name || "U").charAt(0).toUpperCase();
  const displayName = user?.fullname || user?.name || "User";

  const account =
    isAuthenticated && user ? (
      <div className="flex items-center gap-2">
        <HanzoAppLauncher currentApp="app" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-foreground/80 hover:text-foreground"
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src={user.avatarUrl} alt={displayName} />
                <AvatarFallback className="text-xs bg-foreground/10 text-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[150px] truncate">{displayName}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email || user.username}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/billing")}>
              <DollarSign className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-foreground/70">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <HanzoAppLauncher currentApp="app" />
        <Button
          onClick={() => login()}
          variant="ghost"
          className="text-foreground/70 hover:text-foreground text-sm font-medium"
        >
          Sign In
        </Button>
        <Button
          onClick={getStarted}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium px-5 py-2.5 rounded-xl"
        >
          Get started
        </Button>
      </div>
    );

  return <HanzoHeader surface="hanzo.app" account={account} />;
}
