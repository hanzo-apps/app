import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import TanstackProvider from "@/components/providers/tanstack-query-provider";
// @hanzo/brand monochrome design tokens (--hanzo-*, --font-size-*, --z-*) load
// FIRST so they're the baseline layer; the app's own :root tokens in globals.css
// come after and win on any overlap — preserving the tuned palette AND the
// Tamagui `--background !important` fix. One import, at the root, once.
import "@hanzo/brand/styles/variables.css";
import "@/assets/globals.css";
// THE TOKEN LAYER AND THE MATERIAL, in one import. `@hanzo/ui/theme.css` is
// @hanzo/design's whole sheet composed with this package's own remainder and
// glass.css inlined, so the colours, the radius ramp, the type rungs, the
// frosted material, the elevation ladder, the dialog scrim and the row
// separators all arrive together and cannot disagree about which version they
// are. This app used to import only the material half and hand-declare the
// token half in assets/globals.css — twenty semantic names design already
// publishes, drifted: ground #080808 against canon #0a0a0a, a solid #262626
// border against an alpha hairline, an opaque ring, and @hanzo/brand's radius
// ramp a full rung low because nothing ever challenged it.
//
// It sits exactly where the material used to: after the app's own sheet, whose
// remaining tokens are the ones design does NOT ship, and before gui.css, whose
// atomic background it outranks with the !important glass carries for that
// reason.
import "@hanzo/ui/theme.css";
// The full @hanzo/gui atomic sheet as a REAL stylesheet (scripts/gen-gui-css.mjs).
// GuiProvider gets disableInjectCSS so the same 350KB is no longer inlined into
// every HTML document, uncacheable.
import "./gui.css";

// The no-flash half of @hanzo/appearance. Imported from ./state so the panel
// itself (and React) stay out of the root layout's bundle.
import { bootScript as appearanceBoot } from "@hanzo/appearance/state";
import { SITE_URL } from "@/lib/site";
import AppContext from "@/components/contexts/app-context";
import IframeDetector from "@/components/iframe-detector";
import { AccentSync } from "@/components/accent-sync";
import { ChunkReloader } from "@/components/chunk-reloader";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/error-boundary/error-boundary";
import { errorLogger } from "@/lib/error-handling/error-logger";

// Canonical Hanzo typography: Geist Sans (UI/body/display/heading)
// + Geist Mono (code/data). Geist is a variable font with real 100–900
// weights, so headings/bold render truly bold (no faux-weight synthesis).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Same policy as sans: text paints in the fallback immediately and swaps —
  // without it, mono text (code, data) blocks on the woff2 (FOIT).
  display: "swap",
});

const SPECULATION_RULES = JSON.stringify({
  prefetch: [
    {
      urls: ["/templates", "/pricing", "/enterprise", "/community", "/gallery", "/new"],
      eagerness: "moderate",
    },
  ],
  prerender: [
    {
      urls: ["/templates", "/pricing", "/enterprise", "/community"],
      eagerness: "conservative",
    },
  ],
});

export const metadata: Metadata = {
  // The brand is appended HERE and nowhere else. Every page used to carry its
  // own suffix, which meant twelve chances to write it and three spellings in
  // use — "— Hanzo", "| Hanzo", "— Built on Hanzo" — plus `/store`, which said
  // only "Store" and named nobody. A `template` is Next's own mechanism for
  // exactly this: a page states what IT is, the root says who WE are.
  title: { default: "Hanzo AI | Build with AI", template: "%s — Hanzo AI" },
  description:
    "Hanzo AI is a cutting-edge web development platform that helps you build websites with AI, no code required. Create, deploy, and scale your projects with the power of AI.",
  // Absolute base for OG/Twitter/canonical URL resolution; white-label overridable
  // via NEXT_PUBLIC_APP_URL (see lib/site.ts). Without it, relative OG images and
  // the canonical don't resolve and Next warns at build.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  // NO `title` here, and that omission is the whole mechanism. Metadata is
  // inherited segment by segment, so a `title` declared on this object is
  // inherited by every child — and og:title on /pricing read "Hanzo AI | Build
  // with AI" while its tab correctly read "Pricing". Left absent, Next falls
  // og:title back to the page's own resolved title, template and all. Twelve
  // pages fixed by deleting one line; the same for `twitter` below.
  openGraph: {
    description:
      "Hanzo AI is a cutting-edge web development platform that helps you build websites with AI, no code required. Create, deploy, and scale your projects with the power of AI.",
    url: SITE_URL,
    siteName: "Hanzo AI",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Hanzo AI Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Hanzo AI is a cutting-edge web development platform that helps you build websites with AI, no code required. Create, deploy, and scale your projects with the power of AI.",
    images: ["/banner.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Hanzo AI",
    statusBarStyle: "black-translucent",
  },
  // Icons come from the Next file-convention: app/favicon.ico, app/icon.svg
  // (adaptive monochrome Hanzo H, transparent bg), app/apple-icon.png.
  //
  // Hanzo Edit convention — every Hanzo page self-declares its source repo so the
  // ever-present "contribute to this page" widget (public/edit.js) knows where to
  // open a PR. Repo-wide default here; a route that maps to a specific source
  // file adds `hanzo:path` in its own `metadata.other`. See HANZO_EDIT.md.
  other: {
    "hanzo:repo": "hanzoai/app",
    "hanzo:branch": "main",
    "hanzo:provider": "github",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#000000",
};

// The accent is the one axis the package's head script leaves for React, which
// validates the colour on mount. Mirror an already-stored pick before first
// paint too, so a non-default accent never flashes white on the way to it: the
// design ramp reads --primary/--accent, the app's monochrome chrome (links, the
// focus ring, ::selection, the product menu) reads --hanzo-accent. AccentSync
// keeps --hanzo-accent in step after mount; an unset accent stays white.
const ACCENT_BOOT =
  "(function(){try{var a=(JSON.parse(localStorage.getItem('hanzo.appearance')||'{}')||{}).accent;" +
  "if(typeof a==='string'&&a){var s=document.documentElement.style;" +
  "s.setProperty('--primary',a);s.setProperty('--accent',a);s.setProperty('--hanzo-accent',a);}}catch(e){}})()";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Error reporting is wired by AnalyticsRoot (the authed @hanzo/event client);
  // errorLogger just queues until then. initialize() stays for API compatibility.
  if (typeof window !== 'undefined') {
    errorLogger.initialize();
  }

  return (
    // next/font's generated variables live on <html>, not <body>: they ARE design
    // tokens, so they have to be readable from `:root` where every other token is
    // declared. On <body> they were invisible to `:root { --font-sans: … }` and to
    // Tailwind's `--default-font-family`, which left <html> itself on the OS stack.
    //
    // `dark` is a literal, server-rendered class — the ONE theme authority.
    // hanzo.app is dark-only, so the theme is a fact of the document, not state to
    // resolve at runtime. It used to be next-themes with `enableSystem`, which made
    // TWO authorities that disagreed: next-themes dropped `.dark` when the OS
    // preferred light while @hanzo/gui's root class stayed `t_dark`, and /catalog
    // and /gallery painted WHITE (measured). A client controller cannot be the
    // authority for a constant anyway — it resolves after first paint, so the
    // correct ground has to be in the markup or the page flashes on the way to it.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* A person's own type size and density, applied BEFORE first paint.
            Same reasoning as the `dark` class above: a client controller
            resolves after the page has painted, so a preference read in an
            effect means every load renders at the default and then jumps. The
            script is tiny and inert (a try/catch around two setProperty calls)
            and @hanzo/appearance re-applies — and validates the accent — the
            moment React mounts. */}
        <script dangerouslySetInnerHTML={{ __html: appearanceBoot() + ";" + ACCENT_BOOT }} />
      </head>
      <body>
        {/* Providers is OUTERMOST. It owns createGui(), which registers the
            token and media tables in module-global state; anything rendered
            above it reaches `useMedia()` before that state exists and the first
            responsive prop ($sm/$md/$lg) throws on `new Proxy(undefined)`. */}
        <Providers>
          <AccentSync />
          <IframeDetector />
          <ChunkReloader />
          <ErrorBoundary level="app">
            <TanstackProvider>
              <AppContext>{children}</AppContext>
            </TanstackProvider>
          </ErrorBoundary>
        </Providers>
        {/* Hanzo Edit — the ever-present "contribute to this page" widget. Reads
            the hanzo:repo/path/branch/provider metas above, then offers Suggest
            (anyone) or a real fork→edit→PR (admin free, credit-holders debited).
            Served by hanzo.app at /edit.js; any Hanzo app drops in the same tag:
            <script async src="https://hanzo.app/edit.js"></script>. */}
        <script async src="/edit.js" />
        {/* Speculation Rules — progressive: browsers that don't know the script
            type ignore it entirely. Top nav routes prefetch on hover/pointerdown
            (moderate); the static marketing pages additionally prerender on
            pointerdown (conservative) so the click lands on an already-rendered
            document. All targets are public, side-effect-free GET routes. */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }}
        />
      </body>
    </html>
  );
}
