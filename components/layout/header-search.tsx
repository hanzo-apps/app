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
import { Button } from '@hanzo/ui';
import { SizableText, XStack } from '@hanzo/gui';
import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { CommandPalette } from '@/components/command-palette';
import { useCommandK } from '@/hooks/useCommandK';
export function HeaderSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  useCommandK(toggle);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="Search (Command-K)"
        group height={36} alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$2.5" outlineWidth={0} hoverStyle={{ borderColor: "$color06" }} className={`${className}`}
      >
        <XStack alignItems="center" gap="$2">
          <SizableText color="$color11" $group-hover={{ color: "$color" }}>
            <Search size={16} />
          </SizableText>
          <SizableText display="none">Search</SizableText>
          <kbd className="hs-kbd">
            ⌘K
          </kbd>
        </XStack>
      </Button>
      {open && <CommandPalette open={open} onOpenChange={setOpen} />}
    </>
  );
}

export default HeaderSearch;
