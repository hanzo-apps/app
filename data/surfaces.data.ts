// MIRROR of the canonical hanzoai/ui `pkg/ui/src/product/surfaces.data.ts` — keep
// byte-identical (data only). hanzo.app aliases `@hanzo/ui` to `@hanzo/ui-shadcn`,
// so it cannot resolve the canonical package's `@hanzo/ui/product` export; the ONE
// cross-surface app-switcher list is mirrored here. Update BOTH in the same change.
//
// `id` is the stable key AND the icon key (callers map it to a lucide glyph).

export type SurfaceId = "ai" | "console" | "app" | "chat" | "bot" | "team" | "billing";

/** One Hanzo surface the app switcher offers. */
export interface Surface {
  id: SurfaceId;
  label: string;
  href: string;
  hint: string;
}

/** The seven Hanzo surfaces (`console` opens the cloud AI console). */
export const SURFACES: Surface[] = [
  { id: "ai", label: "Hanzo AI", href: "https://hanzo.ai", hint: "hanzo.ai" },
  { id: "console", label: "Console", href: "https://console.hanzo.ai", hint: "console.hanzo.ai" },
  { id: "app", label: "App", href: "https://hanzo.app", hint: "hanzo.app" },
  { id: "chat", label: "Chat", href: "https://hanzo.chat", hint: "hanzo.chat" },
  { id: "bot", label: "Bot", href: "https://hanzo.bot", hint: "hanzo.bot" },
  { id: "team", label: "Team", href: "https://hanzo.team", hint: "hanzo.team" },
  { id: "billing", label: "Billing", href: "https://billing.hanzo.ai", hint: "billing.hanzo.ai" },
];

/** Every surface except `current` — a launcher never links to itself. */
export function otherSurfaces(current?: SurfaceId): Surface[] {
  return current !== undefined ? SURFACES.filter((s) => s.id !== current) : SURFACES;
}
