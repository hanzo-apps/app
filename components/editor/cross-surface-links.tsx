"use client";

import { YStack, Anchor, SizableText } from '@hanzo/gui';
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
    <XStack display="none" $md={{ display: "flex" }} alignItems="center" gap="$1">
      <Anchor
        href={chatProjectUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat about this project in hanzo.chat"
        className={`${linkClass}`}
      >
        <MessageSquare size={16} />
        <SizableText display="none" $lg={{ display: "inline" }}>Chat</SizableText>
      </Anchor>
      <Anchor
        href={consoleProjectUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Manage this project in console.hanzo.ai"
        className={`${linkClass}`}
      >
        <LayoutGrid size={16} />
        <SizableText display="none" $lg={{ display: "inline" }}>Console</SizableText>
      </Anchor>
    </XStack>
  );
}
