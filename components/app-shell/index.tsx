'use client';

/**
 * AppShell — the ONE chrome for authenticated top-level content pages
 * (dashboard, resources, connectors, settings, skills, gallery, …).
 *
 * It mounts the SAME left `Sidebar` the builder/admin uses — so the org/project
 * `OrgSwitcher` sits at the top-left and the identity/credit cluster at the
 * bottom-left, exactly like console.hanzo.ai's `DashboardShell` — but WITHOUT the
 * builder's VFS/sync/server-init baggage (that lives in `PageLayout`, coupled to
 * the workspace). Content is a scrollable flex child so each page owns its own
 * scroll region beside the in-flow sidebar.
 *
 * There is no mode bar. hanzo.app IS the dev surface — the app builder and the
 * work around it — and hanzo.chat is the chat surface, until the two converge on
 * one thing. A three-way switcher across surfaces that do not yet behave alike
 * advertises a choice the product has not made.
 *
 * The shell also owns the ⌘K command palette: a global keydown opens it, the
 * sidebar's "Search" item opens it (`onOpenSearch`), and it renders here so it is
 * reachable from every content page.
 *
 * Responsive: at ≥md the sidebar is a static in-flow column (collapsible via the
 * toggle at its top). Below md it is an off-canvas drawer opened by the mobile
 * top-bar hamburger here — without which a phone would have NO way to reach the
 * nav. The Sidebar's own nav items self-route (absolute canonical routes);
 * selecting a recent project opens it in the builder.
 *
 * ── The shell owns the header, and that is the whole uniformity law ──────────
 *
 * Pass `title` (with optional `subtitle`/`actions`) and the shell draws the page
 * header AND the content rail underneath it, both on the same `RAIL` measure.
 * Every signed-in page used to draw its own: five title sizes ($6, $7, $8, $10,
 * $11), five column widths, two of them with a "← Back" button standing in for
 * the sidebar that the page had simply forgotten to mount. /profile's header
 * rail (1280) and its body rail (896) did not even agree with each other, and
 * because that header set `maxWidth` with no `width`, it shrink-wrapped and
 * centered itself — which is why the title and its button collided mid-screen in
 * the owner's screenshot.
 *
 * The presence of a title is the ONLY switch: a titled page gets header + rail,
 * a page without one owns the canvas (the dashboard hero, chat, the builder).
 * There is no `bleed` flag and no second header component to reach for, so an
 * ad-hoc header is not something a page can drift into — it is something it
 * would have to go out of its way to build.
 */
import { Button } from '@hanzo/ui';
import { YStack, XStack, H1, Paragraph } from '@hanzo/ui';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { OrgProvider } from '@/lib/org/client';
import { HanzoLogo } from '@/components/HanzoLogo';
import { CommandPalette } from '@/components/command-palette';
import { useCommandK } from '@hanzo/ui/product';
import type { Project } from '@/lib/vfs/types';
import { builderLink } from '@/lib/api/projects';
import { RAIL, glass } from '@/lib/chrome';

interface AppShellProps {
  children: React.ReactNode;
  /** Which sidebar item is active (highlights it). Defaults to 'templates'. */
  currentView?: string;
  /**
   * The page title. Drawing it here is what makes the chrome uniform — and its
   * presence is also what gives the page its content rail (see above).
   */
  title?: string;
  /** One line under the title. Say what the page is for, not what it is called. */
  subtitle?: React.ReactNode;
  /** Page-level controls, right-aligned on the title row. */
  actions?: React.ReactNode;
}

export function AppShell({
  children,
  currentView = 'templates',
  title,
  subtitle,
  actions,
}: AppShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / `/` opens the command palette — the ONE shared keybinding.
  useCommandK(useCallback(() => setPaletteOpen((o) => !o), []));

  return (
    // ONE org scope for the whole shell — the Sidebar's org switcher AND every
    // page rendered as {children} (Connectors, Settings, …) read the SAME context,
    // so a page that calls useOrg never crashes for lack of a provider ancestor.
    <OrgProvider>
    {/* The shell owns the viewport, so it MEASURES the viewport. `height="100%"`
        looked equivalent and was not: a percentage resolves against the parent's
        computed height, every ancestor up to <body> is `height: auto` (globals.css
        gives body a min-height only), so it fell back to auto. The shell then sized
        to its content — 275px — and the sidebar's `flex={1}` nav, which has
        `min-height: 0` so it can scroll, collapsed to a 24px slot that showed the
        top half of "Dashboard" and hid every item below it. */}
    <XStack position="relative" height="100dvh" overflow="hidden" backgroundColor="$background">
      <Sidebar
        currentView={currentView}
        onNavigate={() => {}}
        onProjectSelect={(project: Project) =>
          router.push(builderLink(project.id || project.name))
        }
        onLogoClick={() => router.push('/')}
        onOpenSearch={() => setPaletteOpen(true)}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
  />

      <YStack minWidth={0} flex={1} overflow="hidden">
        {/* Mobile top bar — the ONLY way to reach the nav below md (the sidebar is
            an off-canvas drawer there). Hidden at md+, where the sidebar is
            always visible in-flow. */}
        <XStack height="$8" alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" $md={{ display: "none" }}>
          <Button size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            variant="ghost"
            height={44} width={44} alignItems="center" justifyContent="center" borderRadius="$3"
          >
            <Menu size={20} />
          </Button>
          <HanzoLogo size={20} color="var(--foreground)" />
          <Button size="icon"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            variant="ghost"
            marginLeft="auto" height={44} width={44} alignItems="center" justifyContent="center" borderRadius="$3"
          >
            <Search size={20} />
          </Button>
        </XStack>

        {/* The scroll region. It lives HERE so every page scrolls the same way —
            each one used to open with its own identical `flex={1} overflow=
            "scroll"`, which is one line to forget and /connectors and /profile
            both forgot it (they set `minHeight="100%"` and could not scroll). */}
        <YStack flex={1} backgroundColor="$background" overflow="scroll">
          {title ? (
            <>
              {/* The hairline spans the full width; the padding belongs to the
                  rail INSIDE it, so the title starts at exactly the same x as
                  the content below. Padding on the outer band instead put the
                  two rails 24px out of step — the header's centered inside the
                  padding, the content's inside the rail.

                  Sticky, and therefore glass. The header is a child of the
                  scroll region (it has to be — it scrolls with the rail it
                  measures), so it used to leave with the content: on a long
                  page you lost the page's name the moment you started reading
                  it. Pinning it to the top is what makes the material honest —
                  there is now content passing UNDER it, which is the whole
                  precondition for vibrancy. Unpinned it would be a blur with
                  nothing to blur.

                  `top={0}` against the scroll container, not the viewport, so
                  the mobile bar above stays clear of it. */}
              <YStack
                {...glass(2)}
                position="sticky"
                top={0}
                zIndex={10}
                borderBottomWidth={1}
              >
                <XStack width="100%" maxWidth={RAIL} alignSelf="center" paddingHorizontal="$5" paddingVertical="$4" alignItems="center" justifyContent="space-between" gap="$4">
                  <YStack minWidth={0}>
                    <H1 numberOfLines={1} fontSize="$8" fontWeight="500" letterSpacing={-0.4} color="$color">
                      {title}
                    </H1>
                    {subtitle ? (
                      <Paragraph numberOfLines={1} marginTop="$1" fontSize="$3" color="$color11">
                        {subtitle}
                      </Paragraph>
                    ) : null}
                  </YStack>
                  {actions ? (
                    <XStack flexShrink={0} alignItems="center" gap="$2">{actions}</XStack>
                  ) : null}
                </XStack>
              </YStack>

              {/* `width="100%"` is load-bearing: `maxWidth` + `alignSelf` alone
                  shrink-wraps to the content and centers it, which is the bug
                  the screenshot caught on /profile. */}
              <YStack width="100%" maxWidth={RAIL} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
                {children}
              </YStack>
            </>
          ) : (
            children
          )}
        </YStack>
      </YStack>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </XStack>
    </OrgProvider>
  );
}

export default AppShell;
