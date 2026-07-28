"use client";

import { AppShell } from "@/components/app-shell";
import { CatalogBrowser } from "@/components/catalog-browser";

// /catalog — cross-org discovery. Named for the surface it renders (/v1/catalog),
// so the page and the API are the same word. /gallery browses the curated starter
// kits you fork; this browses everything that EXISTS across hanzo, lux and zoo,
// plus the caller's own projects when they are signed in.
export default function CatalogPage() {
  return (
    <AppShell currentView="templates">
      <div className="flex-1 overflow-y-auto bg-background text-foreground">
        <CatalogBrowser />
      </div>
    </AppShell>
  );
}
