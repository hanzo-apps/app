/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import TanstackProvider from "@/components/providers/tanstack-query-provider";
import "@/assets/globals.css";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { apiServer } from "@/lib/api";
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
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

async function getMe() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MY_TOKEN_KEY())?.value;
  if (!token) return { user: null, errCode: null };
  try {
    const res = await apiServer.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { user: res.data.user, errCode: null };
  } catch (err: any) {
    return { user: null, errCode: err.status };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getMe();

  // Error reporting is wired by AnalyticsRoot (the authed @hanzo/event client);
  // errorLogger just queues until then. initialize() stays for API compatibility.
  if (typeof window !== 'undefined') {
    errorLogger.initialize();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <IframeDetector />
        <ChunkReloader />
        <PointerEventsGuard />
        <ErrorBoundary level="app">
          <Providers>
            <TanstackProvider>
              <AppContext me={data}>{children}</AppContext>
            </TanstackProvider>
          </Providers>
        </ErrorBoundary>
        {/* Hanzo Analytics — the ONE canonical hz.js tag → analytics.hanzo.ai,
            the dashboard hanzo.ai / hanzo.app / hanzo.chat all feed. Raw
            <script async> so it ships in the served HTML <head> (React hoists
            it) and captures anonymous landing pageviews the authed @hanzo/event
            client does not. GA4 / Meta Pixel opt in via data-ga / data-fb. */}
        <script
          async
          src="https://analytics.hanzo.ai/hz.js"
          data-site="hanzo.app"
        />
      </body>
    </html>
  );
}
