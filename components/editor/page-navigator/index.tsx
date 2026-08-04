"use client";

import { Input, Button } from '@hanzo/ui';
import { YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import { useEffect, useMemo, useRef, useState } from "react";
import { FileCode, Folder, Search } from "lucide-react";
/**
 * PagePanel — the ONE browsable page picker for the builder chrome.
 *
 * The header's page selector used to be a cramped dropdown that just listed
 * `path` strings; this is a proper panel: search + a folder-grouped, scrollable
 * list of EVERY page in the project, the working page highlighted, click to open.
 *
 * Presentational only — it holds just its search query. The caller owns the
 * `pages`/`currentPage` state and closes the surrounding popover via `onClose`.
 * Monochrome / true-black to sit inside the always-dark header chrome.
 */

interface PageLike {
  path: string;
}

interface PagePanelProps {
  pages: PageLike[];
  currentPage: string;
  onSelectPage: (path: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
}

interface PageGroup {
  folder: string;
  items: { path: string; name: string }[];
}

// index.html floats to the top of its folder; everything else is alphabetical.
function indexRank(name: string): number {
  return /^index\.html?$/i.test(name) ? 0 : 1;
}

// Group page paths by their containing folder. Paths may be bare
// ("about.html") or rooted ("/blog/post.html"); both normalize the same way.
function groupPages(paths: string[]): PageGroup[] {
  const map = new Map<string, { path: string; name: string }[]>();
  for (const path of paths) {
    const norm = path.replace(/^\/+/, "");
    const segments = norm.split("/");
    const name = segments[segments.length - 1] || norm;
    const folder = segments.slice(0, -1).join("/");
    const arr = map.get(folder) ?? [];
    arr.push({ path, name });
    map.set(folder, arr);
  }
  const folders = Array.from(map.keys()).sort((a, b) =>
    a === b ? 0 : a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)
  );
  return folders.map((folder) => ({
    folder,
    items: (map.get(folder) ?? []).sort(
      (a, b) =>
        indexRank(a.name) - indexRank(b.name) || a.name.localeCompare(b.name)
    ),
  }));
}

export function PagePanel({
  pages,
  currentPage,
  onSelectPage,
  onClose,
  autoFocus,
}: PagePanelProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [autoFocus]);

  const filteredPaths = useMemo(() => {
    const q = query.trim().toLowerCase();
    const paths = pages.map((p) => p.path);
    if (!q) return paths;
    return paths.filter((p) => p.toLowerCase().includes(q));
  }, [pages, query]);

  const groups = useMemo(() => groupPages(filteredPaths), [filteredPaths]);

  const select = (path: string) => {
    onSelectPage(path);
    onClose?.();
  };

  // Enter opens the first match — fast keyboard navigation from the search box.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const first = groups[0]?.items[0]?.path;
      if (first) {
        e.preventDefault();
        select(first);
      }
    }
  };

  return (
    <YStack maxHeight="min(60vh,24rem)" width="100%">
      <XStack alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingBottom="$2" paddingTop="$0.5">
        <Search size={14} />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages…"
          aria-label="Search pages"
          width="100%" backgroundColor="transparent" paddingVertical="$1" fontSize="$3" color="$color" placeholderTextColor="$color11" focusStyle={{ outlineWidth: 0 }}
  />
        <SizableText flexShrink={0} fontFamily="$mono" fontSize={10} color="$color11">
          {filteredPaths.length}
        </SizableText>
      </XStack>

      <YStack minHeight={0} flex={1} paddingVertical="$1" overflow="scroll">
        {groups.length === 0 ? (
          <Paragraph paddingHorizontal="$3" paddingVertical="$5" textAlign="center" fontSize="$1" color="$color11">
            No pages match “{query}”.
          </Paragraph>
        ) : (
          groups.map((group) => (
            <YStack key={group.folder || "/"} paddingVertical="$0.5">
              {group.folder && (
                <XStack alignItems="center" gap="$1.5" paddingHorizontal="$2.5" paddingVertical="$1">
                  <SizableText color="$color11"><Folder size={12} /></SizableText>
                  <SizableText numberOfLines={1} fontSize={10} fontWeight="500" letterSpacing={0.4} color="$color11">{group.folder}</SizableText>
                </XStack>
              )}
              {group.items.map((item) => {
                const active = item.path === currentPage;
                return (
                  <Button
                    key={item.path}
                    type="button"
                    onClick={() => select(item.path)}
                    title={item.path}
                    width="100%" alignItems="center" gap="$2" borderRadius="$3" paddingHorizontal="$2.5" paddingVertical="$1.5" justifyContent="flex-start" focusStyle={{ outlineWidth: 0 }} {...{ paddingLeft: group.folder ? "$5" : undefined, backgroundColor: active ? "$color3" : undefined, hoverStyle: active ? undefined : {"backgroundColor":"$color3"} }}
                  >
                    <FileCode size={14} />
                    <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
                      {item.name}
                    </SizableText>
                    {active && (
                      <SizableText marginLeft="auto" width="$1.5" height="$1.5" flexShrink={0} borderRadius="$10" backgroundColor="$color12" />
                    )}
                  </Button>
                );
              })}
            </YStack>
          ))
        )}
      </YStack>
    </YStack>
  );
}
