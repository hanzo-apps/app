import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import TanstackProvider from "@/components/providers/tanstack-query-provider";
// @hanzo/brand monochrome design tokens (--hanzo-*, --font-size-*, --z-*) load
// FIRST so they're the baseline layer; the app's own :root tokens in globals.css
// come after and win on any overlap — preserving the tuned palette AND the
// Tamagui `--background !important` fix. One import, at the root, once.
import "@hanzo/brand/styles/variables.css";
import "@/assets/globals.css";
import { SITE_URL } from "@/lib/site";
import AppContext from "@/components/contexts/app-context";
import IframeDetector from "@/components/iframe-detector";
import { ChunkReloader } from "@/components/chunk-reloader";
import { PointerEventsGuard } from "@/components/pointer-events-guard";
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
});

export const metadata: Metadata = {
  title: "Hanzo AI | Build with AI",
  description:
    "Hanzo AI is a cutting-edge web development platform that helps you build websites with AI, no code required. Create, deploy, and scale your projects with the power of AI.",
  // Absolute base for OG/Twitter/canonical URL resolution; white-label overridable
  // via NEXT_PUBLIC_APP_URL (see lib/site.ts). Without it, relative OG images and
  // the canonical don't resolve and Next warns at build.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hanzo AI | Build with AI",
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
    title: "Hanzo AI | Build with AI",
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
  maximumScale: 1,
  themeColor: "#000000",
};

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-background text-foreground min-h-screen">
        <IframeDetector />
        <ChunkReloader />
        <PointerEventsGuard />
        <ErrorBoundary level="app">
          <Providers>
            <TanstackProvider>
              <AppContext>{children}</AppContext>
            </TanstackProvider>
          </Providers>
        </ErrorBoundary>
        {/* Hanzo Edit — the ever-present "contribute to this page" widget. Reads
            the hanzo:repo/path/branch/provider metas above, then offers Suggest
            (anyone) or a real fork→edit→PR (admin free, credit-holders debited).
            Served by hanzo.app at /edit.js; any Hanzo app drops in the same tag:
            <script async src="https://hanzo.app/edit.js"></script>. */}
        <script async src="/edit.js" />
      </body>
    </html>
  );
}
