"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@hanzo/ui";
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
  User,
  LogOut,
  Settings,
  FolderOpen,
  Plus,
  ChevronDown,
  Home,
  FileText,
  HelpCircle,
  DollarSign
} from "lucide-react";
import { HanzoLogo } from "@/components/HanzoLogo";
import { useUser } from "@/hooks/useUser";

export default function Header() {
  const { user, logout, openLoginWindow } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center">
            <HanzoLogo className="w-8 md:w-9 h-8 md:h-9 text-white" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/community"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Community
            </Link>
            <Link
              href="/pricing"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/enterprise"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Enterprise
            </Link>
            <Link
              href="/learn"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Learn
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
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
                      className="gap-2 text-white/80 hover:text-white"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="max-w-[150px] truncate">
                        {user.name || user.id || "User"}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => navigateTo("/dashboard")}>
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigateTo("/projects")}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      My Projects
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

                    <DropdownMenuItem onClick={() => navigateTo("/docs")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Documentation
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigateTo("/help")}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  onClick={openLoginWindow}
                  variant="ghost"
                  className="text-white/70 hover:text-white text-sm font-medium"
                >
                  Log in
                </Button>
                <Button
                  onClick={openLoginWindow}
                  className="bg-white text-black hover:bg-white/90 text-sm font-semibold px-5 py-2.5 rounded-xl"
                >
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Link href="/" className="flex items-center">
                <HanzoLogo className="w-8 h-8 text-white" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {user ? (
                <>
                  <div className="p-3 mb-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name || "User"}</p>
                        <p className="text-sm text-white/60">{user.email || user.id}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo("/new")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Project</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/dashboard")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/projects")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FolderOpen className="w-5 h-5" />
                    <span>My Projects</span>
                  </button>

                  <div className="h-px bg-white/10 my-4" />

                  <button
                    onClick={() => navigateTo("/community")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span>Community</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/pricing")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span>Pricing</span>
                  </button>

                  <button
                    onClick={() => navigateTo("/docs")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Documentation</span>
                  </button>

                  <div className="h-px bg-white/10 my-4" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors text-red-500"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigateTo("/community")}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Community
                  </button>
                  <button
                    onClick={() => navigateTo("/pricing")}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => navigateTo("/enterprise")}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Enterprise
                  </button>
                  <button
                    onClick={() => navigateTo("/learn")}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Learn
                  </button>

                  <div className="h-px bg-white/10 my-4" />

                  <button
                    onClick={openLoginWindow}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={openLoginWindow}
                    className="w-full px-4 py-3 bg-white text-black hover:bg-white/90 rounded-lg font-semibold"
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