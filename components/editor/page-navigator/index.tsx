"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, RotateCw, Home, Check, ExternalLink } from "lucide-react";
import { Button } from "@hanzo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hanzo/ui";

interface DetectedRoute {
  path: string;
  visited: boolean;
  current: boolean;
}

interface PageNavigatorProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onReload?: () => void;
}

export function PageNavigator({ currentPath = "/", onNavigate, onReload }: PageNavigatorProps) {
  const [routes, setRoutes] = useState<DetectedRoute[]>([
    { path: "/", visited: true, current: currentPath === "/" },
    { path: "/auth", visited: false, current: false },
    { path: "/dashboard", visited: false, current: false },
    { path: "/publishers", visited: false, current: false },
    { path: "/advertisers", visited: false, current: false },
    { path: "/partners", visited: false, current: false },
    { path: "/about", visited: false, current: false },
    { path: "/ssp", visited: false, current: false },
    { path: "/white-label", visited: false, current: false },
  ]);

  const [inputPath, setInputPath] = useState(currentPath);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update routes when navigating
  useEffect(() => {
    setRoutes((prev) =>
      prev.map((route) => ({
        ...route,
        current: route.path === currentPath,
        visited: route.path === currentPath ? true : route.visited,
      }))
    );
    setInputPath(currentPath);
  }, [currentPath]);

  // Detect routes from HTML (in a real app, this would parse the actual content)
  const detectRoutes = () => {
    // Route detection from HTML/JSX would go here
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    setIsOpen(false);
  };

  const handleInputSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputPath) {
      handleNavigate(inputPath);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* URL Bar */}
      <div className="flex items-center bg-neutral-800 rounded-lg px-3 py-1.5 min-w-[200px]">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-neutral-900 border-neutral-700">
            <div className="px-2 py-1.5">
              <p className="text-xs text-neutral-500 font-medium mb-1">DETECTED ROUTES</p>
            </div>
            {routes.map((route) => (
              <DropdownMenuItem
                key={route.path}
                onClick={() => handleNavigate(route.path)}
                className="flex items-center justify-between hover:bg-neutral-800 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {route.path === "/" ? (
                    <Home className="w-3 h-3 text-neutral-400" />
                  ) : (
                    <span className="w-3" />
                  )}
                  <span className={route.current ? "text-purple-400 font-medium" : "text-neutral-300"}>
                    {route.path}
                  </span>
                </span>
                {route.current && <Check className="w-3 h-3 text-purple-400" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-neutral-700" />
            <DropdownMenuItem
              onClick={() => {
                const newPath = prompt("Enter custom path:");
                if (newPath) handleNavigate(newPath);
              }}
              className="text-neutral-400 hover:bg-neutral-800 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              Navigate to custom path...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={inputRef}
          type="text"
          value={inputPath}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputPath(e.target.value)}
          onKeyDown={handleInputSubmit}
          className="bg-transparent text-sm text-white outline-none flex-1 px-2"
          placeholder="/"
        />
      </div>

      {/* Reload Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReload}
        className="p-1.5 hover:bg-neutral-800"
      >
        <RotateCw className="w-4 h-4 text-neutral-400 hover:text-white" />
      </Button>
    </div>
  );
}