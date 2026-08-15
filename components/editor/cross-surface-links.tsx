"use client";

import { XStack, YStack, SizableText } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
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

/** The link's shape, as props. It was a Tailwind class string against an app
 *  with no Tailwind, so these two links rendered as bare underlined anchors —
 *  no box, no padding, no hover ground. */
const LINK = {
  display: "inline-flex",
  alignItems: "center",
  gap: "$1.5",
  borderRadius: "$3",
  paddingHorizontal: "$2",
  paddingVertical: "$1.5",
  fontSize: "$3",
  fontWeight: "500",
  color: "$color11",
  textDecorationLine: "none",
  hoverStyle: { backgroundColor: "$color3", color: "$color" },
} as const;

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
        {...LINK}
      >
        <MessageSquare size={16} />
        <SizableText display="none" $lg={{ display: "inline" }}>Chat</SizableText>
      </Anchor>
      <Anchor
        href={consoleProjectUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Manage this project in console.hanzo.ai"
        {...LINK}
      >
        <LayoutGrid size={16} />
        <SizableText display="none" $lg={{ display: "inline" }}>Console</SizableText>
      </Anchor>
    </XStack>
  );
}
