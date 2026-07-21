"use client";

// Editor theme picker — lets the user switch the CodeMirror theme (Hanzo Dracula
// by default). The choice persists in localStorage and syncs to every editor via
// the shared hook. Rendered in the builder's Code view chrome.
import { Check, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hanzo/ui";

import { EDITOR_THEMES, useEditorTheme } from "./themes";

export function EditorThemePicker({ className }: { className?: string }) {
  const { themeId, setThemeId } = useEditorTheme();
  const active = EDITOR_THEMES.find((t) => t.id === themeId) ?? EDITOR_THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`Editor theme: ${active.label}`}
          aria-label="Change editor theme"
          className={
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 " +
            (className ?? "")
          }
        >
          <Palette className="size-3.5" />
          <span className="hidden sm:inline">{active.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {EDITOR_THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setThemeId(t.id)}
            className="flex items-center justify-between gap-2"
          >
            <span>{t.label}</span>
            {t.id === active.id && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default EditorThemePicker;
