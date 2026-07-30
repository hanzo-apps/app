"use client";

// The unauthorized-embed warning — a plain fixed overlay, deliberately OFF the
// @hanzo/ui Dialog. This component mounts from IframeDetector, which the root
// layout renders OUTSIDE <Providers>: there is no Tamagui theme context there,
// and the @hanzo/ui DialogContent it used to render reads the current theme
// during render — on the server that degrades quietly (@hanzogui/web 7.3.3),
// on the client it throws "Missing theme", the app has no boundary above it,
// and global-error replaces EVERY page with "Critical Error". That was the
// v1.42.200 outage. A security interstitial must not depend on the app's theme
// stack — it renders anywhere, with nothing but markup.

import { ExternalLink, AlertTriangle } from "lucide-react";
import { SITE_URL } from "@/lib/site";

interface IframeWarningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IframeWarningModal({ isOpen }: IframeWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="iframe-warning-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-background text-foreground p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 id="iframe-warning-title" className="text-lg font-semibold">
            Unauthorized Embedding
          </h2>
        </div>
        <p className="text-sm text-muted-foreground text-left">
          You&apos;re viewing Hanzo AI through an unauthorized iframe. For the
          best experience and security, please visit the official website
          directly.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Why visit the official site?</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Better performance and security</li>
            <li>• Full functionality access</li>
            <li>• Latest features and updates</li>
            <li>• Proper authentication support</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium px-4 py-2 rounded-md transition-colors w-full sm:w-auto"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Hanzo.App
          </a>
        </div>
      </div>
    </div>
  );
}
