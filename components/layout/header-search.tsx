'use client';

/**
 * HeaderSearch — the header's search affordance for the marketing surfaces.
 *
 * Renders a subtle "Search ⌘K" pill and mounts the EXISTING command palette
 * (components/command-palette). Wired to ⌘K / Ctrl-K AND `/` (via useCommandK),
 * so every marketing page — which uses this header, not the authenticated
 * AppShell that already owns its own palette — has the same fast switcher.
 *
 * The palette is mounted only while open, so a visitor who never searches never
 * triggers its project fetch.
 */
import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { CommandPalette } from '@/components/command-palette';
import { useCommandK } from '@/hooks/useCommandK';
import { cn } from '@/lib/utils';

export function HeaderSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  useCommandK(toggle);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search (Command-K)"
        className={cn(
          'group inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card/50 px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30',
          className,
        )}
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="ml-1 hidden items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
          ⌘K
        </kbd>
      </button>
      {open && <CommandPalette open={open} onOpenChange={setOpen} />}
    </>
  );
}

export default HeaderSearch;
