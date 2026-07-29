"use client";

import { SizableText } from '@hanzo/gui';
import { AppShell } from "@/components/app-shell";
import { CatalogBrowser } from "@/components/catalog-browser";

// /catalog — cross-org discovery. Named for the surface it renders (/v1/catalog),
// so the page and the API are the same word. /gallery browses the curated starter
// kits you fork; this browses everything that EXISTS across hanzo, lux and zoo,
// plus the caller's own projects when they are signed in.
export default function CatalogPage() {
  return (
    <AppShell currentView="templates">
      <SizableText flex={1} backgroundColor="$background" color="$color" overflow="scroll" display="flex" flexDirection="column">
        <CatalogBrowser />
      </SizableText>
    </AppShell>
  );
}
