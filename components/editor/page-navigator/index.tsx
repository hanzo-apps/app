"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileCode, Folder, Search } from "lucide-react";
import classNames from "classnames";

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
    <div className="flex max-h-[min(60vh,24rem)] w-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-2.5 pb-2 pt-0.5">
        <Search className="size-3.5 shrink-0 text-white/30" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages…"
          aria-label="Search pages"
          className="w-full bg-transparent py-1 text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <span className="shrink-0 font-mono text-[10px] text-white/25">
          {filteredPaths.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {groups.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-white/40">
            No pages match “{query}”.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.folder || "/"} className="py-0.5">
              {group.folder && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white/35">
                  <Folder className="size-3 shrink-0" />
                  <span className="truncate">{group.folder}</span>
                </div>
              )}
              {group.items.map((item) => {
                const active = item.path === currentPage;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => select(item.path)}
                    title={item.path}
                    className={classNames(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                      group.folder ? "pl-6" : "",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/[0.06] hover:text-white/90"
                    )}
                  >
                    <FileCode className="size-3.5 shrink-0 text-white/40" />
                    <span className="truncate font-mono text-xs">
                      {item.name}
                    </span>
                    {active && (
                      <span className="ml-auto size-1.5 shrink-0 rounded-full bg-white/70" />
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
