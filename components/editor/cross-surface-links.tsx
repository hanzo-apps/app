"use client";

import { useEffect, useState } from "react";
import { MessageSquare, LayoutGrid } from "lucide-react";
import { Button } from "@hanzo/ui";

/**
 * Cross-surface project deep-links (console <-> hanzo.app <-> hanzo.chat).
 *
 * A project is identified everywhere by its org-unique SLUG -- the key the
 * cloud `/v1/projects/:slug` store is keyed on (the org is derived server-side
 * from the IAM JWT owner claim, HIP-0111; it never travels in the URL). The
 * slug rides as `?project=<slug>`. When the builder is opened for a linked
 * project we surface "Chat" (hanzo.chat) + "Console" (manage) for the SAME
 * slug, so one project round-trips across every surface.
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

/** Compact "Chat" + "Console" links for the linked project, shown in the
 *  builder header only when the builder was opened for a project. */
export function CrossSurfaceLinks() {
  const slug = useProjectSlug();
  if (!slug) return null;
  return (
    <div className="hidden md:flex items-center gap-1">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="opacity-70 hover:opacity-100"
      >
        <a
          href={chatProjectUrl(slug)}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat about this project in hanzo.chat"
        >
          <MessageSquare className="size-4" />
          <span className="hidden lg:inline">Chat</span>
        </a>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="opacity-70 hover:opacity-100"
      >
        <a
          href={consoleProjectUrl(slug)}
          target="_blank"
          rel="noopener noreferrer"
          title="Manage this project in console.hanzo.ai"
        >
          <LayoutGrid className="size-4" />
          <span className="hidden lg:inline">Console</span>
        </a>
      </Button>
    </div>
  );
}
