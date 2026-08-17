"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Paragraph,
  SizableText,
  YStack,
} from '@hanzo/ui';
import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Check, FileCode } from "lucide-react";
/**
 * PagePanel — the ONE browsable page picker for the builder chrome.
 *
 * Search, then a folder-grouped scrollable list of EVERY page in the project
 * with the open one marked. Click to open.
 *
 * It IS `Command`, the same palette `components/model-selector.tsx` opens, and
 * what that replaced is the point. This file used to hand-roll a search row, a
 * filter, an Enter handler and rows built out of Buttons — four answers to
 * questions the palette already answers, and each had drifted from the picker
 * standing next to it in the same header. The row's search field, being a
 * `width: 100%` field in a flex row, took the panel's whole width and pushed the
 * icon and the match count out past the edge; every option carried a filled
 * Button's ground and border, so five pages read as five stacked buttons; and
 * the open-page dot asked for `$1.5`, a SIZE token, which is 24px — the white
 * disc that swallowed the first row.
 *
 * What is left is the only thing that is this picker's own: how pages group
 * into folders, and which one is open.
 *
 * Presentational only. The caller owns the `pages`/`currentPage` state and
 * closes the surrounding popover via `onClose`.
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
  // A gui element, not an `HTMLInputElement`: gui hands back the DOM node plus
  // its own `measure*` methods, so naming the field's own ref type is the way to
  // say it. `focus()` is the HTMLElement half.
  const inputRef = useRef<ComponentRef<typeof CommandInput>>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [autoFocus]);

  // Every page, always. The palette HIDES the rows a search misses rather than
  // unmounting them — that is what keeps its cursor in source order — so
  // filtering is not this component's to do, and a group whose every page
  // filtered out hides itself.
  const groups = useMemo(() => groupPages(pages.map((p) => p.path)), [pages]);

  // Two different facts, and they used to be told as one sentence. A project
  // with no pages is not a failed search, and `No pages match “”` blames the
  // reader for a query they never typed.
  if (pages.length === 0) {
    return (
      <Paragraph paddingHorizontal="$3" paddingVertical="$5" textAlign="center" fontSize="$1" color="$color11">
        This project has no pages yet.
      </Paragraph>
    );
  }

  return (
    // The cursor opens on the page you are already on, so Enter re-opens it
    // rather than jumping to whatever happens to be first.
    <Command backgroundColor="transparent" defaultValue={currentPage}>
      <CommandInput ref={inputRef} placeholder="Search pages…" aria-label="Search pages" />
      <CommandList>
        <CommandEmpty>No pages match that search.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.folder || "/"} heading={group.folder || undefined}>
            {group.items.map((item) => {
              const current = item.path === currentPage;
              return (
                <CommandItem
                  key={item.path}
                  // The whole path, so typing a folder finds the pages inside it.
                  value={item.path}
                  // The row says its PATH. `index.html` names nothing on its own
                  // in a project that has several, and the visible name is the
                  // one thing that may be clipped. There is no tooltip to carry
                  // it: `title` is a web attribute @hanzo/ui declares on the
                  // components that spread it, and neither ListItem nor
                  // SizableText is one — widening that belongs upstream.
                  aria-label={item.path}
                  onSelect={() => {
                    onSelectPage(item.path);
                    onClose?.();
                  }}
                >
                  {/* The open page keeps a rail. The row highlight belongs to the
                      CURSOR, so without a second mark "which page am I on" is
                      lost the moment an arrow key moves. Same rail the model
                      picker draws, for the same reason.

                      NO vertical margin: a ListItem is padded 14px, so the flex
                      line it stretches into is only 20px of a 48px row, and 6px
                      a side left a 2x8 tick — a mark you cannot see is not a
                      mark. Measured 8 with the margins, 20 without. */}
                  <YStack width={2} alignSelf="stretch" borderRadius={1} backgroundColor={current ? "$color" : "transparent"} />
                  <FileCode size={14} />
                  <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
                    {item.name}
                  </SizableText>
                  {/* Reserved, never collapsed: a check that takes the row's
                      space only when it is set moves every other row's text. */}
                  <Check size={14} opacity={current ? 1 : 0} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
