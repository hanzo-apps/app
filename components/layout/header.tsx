"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  Menu,
  X,
  LogOut,
  Settings,
  Plus,
  ChevronDown,
  Home,
  DollarSign,
} from "lucide-react";
import { HanzoBrand } from "@/components/HanzoLogo";
import MeetHanzoMenu from "@/components/layout/meet-hanzo-menu";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function Header() {
  const { user, isAuthenticated, login, logout } = useAuthContext();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
  };

  // "Get started" = the SIGNUP funnel: land on IAM's registration (signup hint),
  // then after auth drop the new user into the builder — where OrgGate creates
  // their org (onboarding) before the first build. "Sign In" (plain `login()`)
  // is for returning users. Both go through the one canonical IAM PKCE flow.
  const getStarted = () => {
    setMobileMenuOpen(false);
    // Register (signup hint) → land in the builder, where OrgGate onboards the
    // new user (creates their org) before the first build.
    login("/dev", { signup: true });
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const userInitial = (user?.fullname || user?.name || "U").charAt(0).toUpperCase();
  const displayName = user?.fullname || user?.name || "User";

  return (
    <>
      <nav className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center">
            <HanzoBrand className="text-foreground" collapse />
          </Link>

          {/* Desktop Navigation — Meet Hanzo mega-menu + the key conversion
              links, matching hanzo.ai's dropdown-plus-Pricing shape. Apps,
              Community, Learn, Docs and Models all live inside the menu. */}
          <div className="hidden lg:flex items-center gap-8">
            <MeetHanzoMenu />
            <Link
              href="/pricing"
              className="text-foreground/70 hover:text-foreground text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/enterprise"
              className="text-foreground/70 hover:text-foreground text-sm font-medium transition-colors"
            >
              Enterprise
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Button
                  onClick={() => navigateTo("/new")}
                  className="gap-2"
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>

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
                      <span className="max-w-[150px] truncate">
                        {displayName}
                      </span>
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

                    <DropdownMenuItem onClick={() => navigateTo("/dashboard")}>
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigateTo("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigateTo("/billing")}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Billing
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleLogout} className="text-foreground/70">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link href="/" className="flex items-center">
                <HanzoBrand className="text-foreground" markClassName="w-8 h-8" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <div className="p-3 mb-4 bg-foreground/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatarUrl} alt={displayName} />
                        <AvatarFallback className="bg-foreground/10 text-foreground">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{displayName}</p>
                        <p className="text-sm text-foreground/60 truncate">
                          {user.email || user.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo("/new")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Project</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/dashboard")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/settings")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/billing")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Billing</span>
                  </button>

                  <div className="h-px bg-border my-4" />

                  <button
                    onClick={() => navigateTo("/install")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <span>Apps</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/community")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <span>Community</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/pricing")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <span>Pricing</span>
                  </button>

                  <div className="h-px bg-border my-4" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors text-foreground/70"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigateTo("/install")}
                    className="w-full px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    Apps
                  </button>
                  <button
                    onClick={() => navigateTo("/community")}
                    className="w-full px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    Community
                  </button>
                  <button
                    onClick={() => navigateTo("/pricing")}
                    className="w-full px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => navigateTo("/enterprise")}
                    className="w-full px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    Enterprise
                  </button>
                  <button
                    onClick={() => navigateTo("/learn")}
                    className="w-full px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    Learn
                  </button>

                  <div className="h-px bg-border my-4" />

                  <button
                    onClick={() => login()}
                    className="w-full px-4 py-3 text-left hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={getStarted}
                    className="w-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
