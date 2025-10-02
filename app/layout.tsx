/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata, Viewport } from "next";
import { Inter, PT_Sans } from "next/font/google";
import { cookies } from "next/headers";

import TanstackProvider from "@/components/providers/tanstack-query-provider";
import "@/assets/globals.css";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { apiServer } from "@/lib/api";
import AppContext from "@/components/contexts/app-context";
import Script from "next/script";
import IframeDetector from "@/components/iframe-detector";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/error-boundary/error-boundary";
import { errorLogger } from "@/lib/error-handling/error-logger";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const ptSans = PT_Sans({
  variable: "--font-ptSans-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Hanzo AI | Build with AI",
  description:
    "Hanzo AI is a cutting-edge web development platform that helps you build websites with AI, no code required. Create, deploy, and scale your projects with the power of AI.",
  openGraph: {
    title: "Hanzo AI | Build with AI",
    description:
      "Hanzo AI is a cutting-edge web development platform that helps you build websites with AI, no code required. Create, deploy, and scale your projects with the power of AI.",
    url: "https://hanzo.build",
    siteName: "Hanzo AI",
    images: [
      {
        url: "https://hanzo.build/banner.png",
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
    images: ["https://hanzo.build/banner.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Hanzo AI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
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

  // Initialize error logger
  if (typeof window !== 'undefined') {
    errorLogger.initialize(process.env.NEXT_PUBLIC_SENTRY_DSN);
  }

  return (
    <html lang="en">
      <Script
        defer
        data-domain="hanzo.build"
        src="https://plausible.io/js/script.js"
      ></Script>
      <body
        className={`${inter.variable} ${ptSans.variable} antialiased bg-black dark min-h-screen`}
      >
        <IframeDetector />
        <ErrorBoundary level="app">
          <Providers>
            <TanstackProvider>
              <AppContext me={data}>{children}</AppContext>
            </TanstackProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
