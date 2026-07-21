"use client";

import { useEffect, useState } from "react";
import { MessageSquare, LayoutGrid } from "lucide-react";

/**
 * Cross-surface project deep-links (console <-> hanzo.app <-> hanzo.chat).
 *
 * A project is identified everywhere by its org-unique SLUG -- the key the
 * cloud `/v1/projects/:slug` store is keyed on (the org is derived server-side
 * from the IAM JWT owner claim, HIP-0111; it never travels in the URL). The
 * slug rides as `?project=<slug>`. When the builder is opened for a linked
 * project we surface "Chat" (hanzo.chat) + "Console" (manage) for the SAME
 * slug, so one project round-trips across every surface.
 *
 * Plain anchors (not `<Button asChild>`): the shared Button always wraps its
 * children in an array for the loading slot, which trips Radix Slot's
 * React.Children.only under asChild.
 */
const CHAT_ORIGIN = "https://hanzo.chat";
const CONSOLE_ORIGIN = "https://console.hanzo.ai";

// The org-unique slug grammar the cloud store enforces. Reject anything else so
// a hostile value can never be reflected into an outbound link.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export function chatProjectUrl(slug: string): string {
  return `${CHAT_ORIGIN}/c/new?project=${encodeURIComponent(slug)}`;
}

export function consoleProjectUrl(slug: string): string {
  return `${CONSOLE_ORIGIN}/?project=${encodeURIComponent(slug)}`;
}

/** The active project slug from `?project=`, or "" (read client-side only, so
 *  it never trips Next's useSearchParams suspense requirement). */
function useProjectSlug(): string {
  const [slug, setSlug] = useState("");
  useEffect(() => {
    try {
      const raw = (new URLSearchParams(window.location.search).get("project") || "")
        .trim()
        .toLowerCase();
      setSlug(SLUG_RE.test(raw) ? raw : "");
    } catch {
      setSlug("");
    }
  }, []);
  return slug;
}

const linkClass =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/** Compact "Chat" + "Console" links for the linked project, shown in the
 *  builder header only when the builder was opened for a project. */
export function CrossSurfaceLinks() {
  const slug = useProjectSlug();
  if (!slug) return null;
  return (
    <div className="hidden items-center gap-1 md:flex">
      <a
        href={chatProjectUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat about this project in hanzo.chat"
        className={linkClass}
      >
        <MessageSquare className="size-4" />
        <span className="hidden lg:inline">Chat</span>
      </a>
      <a
        href={consoleProjectUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        title="Manage this project in console.hanzo.ai"
        className={linkClass}
      >
        <LayoutGrid className="size-4" />
        <span className="hidden lg:inline">Console</span>
      </a>
    </div>
  );
}
