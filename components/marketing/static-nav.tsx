// The ZERO-JS marketing nav — a pure server component. Same routes and register
// as components/layout/header.tsx, with the client-only affordances replaced by
// their static equivalents:
//
//   - Auth actions are plain links into the ONE canonical funnel: /dev is
//     auth-gated by middleware.ts, so "Get started" → /dev lands a signed-in
//     user in the builder and bounces a signed-out one through
//     /login?redirect=/dev — exactly what openLoginWindow() achieves, minus the
//     shipped JS. "Log in" → /login (the PKCE page).
//   - The mobile menu is a <details> disclosure: open/close is native browser
//     behavior, styled with the existing utility classes (group-open). Client
//     navigation remounts the page, so the panel closes on route change.
//
// Interactivity that genuinely needs auth state (avatar, account menu, ⌘K)
// belongs to app chrome, not to a marketing shell.

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { HanzoLogo } from "@/components/HanzoLogo";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/community", label: "Community" },
  { href: "/pricing", label: "Pricing" },
  { href: "/enterprise", label: "Enterprise" },
  { href: "/docs", label: "Docs" },
] as const;

export default function StaticNav({ current }: { current?: string }) {
  return (
    <nav className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-border">
      <div className="flex items-center gap-6 md:gap-10">
        <Link href="/" className="flex items-center gap-2.5">
          <HanzoLogo className="w-8 md:w-9 h-8 md:h-9 text-foreground" />
          <span className="text-xl md:text-2xl font-medium">Hanzo</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={current === l.href ? "page" : undefined}
              className={
                current === l.href
                  ? "text-foreground font-medium text-sm transition-colors"
                  : "text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              }
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop actions — static links into the canonical auth funnel. */}
      <div className="hidden md:flex items-center gap-4">
        <Link
          href="/login"
          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-accent transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/dev"
          className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Get started
        </Link>
      </div>

      {/* Mobile menu — native <details> disclosure, zero JS. */}
      <details className="group md:hidden">
        <summary
          aria-label="Menu"
          className="list-none [&::-webkit-details-marker]:hidden p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6 group-open:hidden" />
          <X className="w-6 h-6 hidden group-open:block" />
        </summary>
        <div className="fixed inset-x-0 top-[65px] bottom-0 bg-background/95 backdrop-blur-xl z-50 overflow-y-auto py-8 px-4">
          <div className="space-y-6">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  current === l.href
                    ? "block text-2xl font-medium text-foreground transition-colors"
                    : "block text-2xl font-medium text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-6 border-t border-border space-y-6">
              <Link href="/login" className="block text-2xl font-medium text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </Link>
              <Link href="/dev" className="block text-2xl font-medium text-foreground transition-colors">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </details>
    </nav>
  );
}
