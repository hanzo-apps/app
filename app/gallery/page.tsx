"use client";

import { SizableText } from '@hanzo/gui';
import { AppShell } from "@/components/app-shell";
import { TemplateGallery } from "@/components/template-gallery";

// /gallery — the public, deep-linkable templates gallery. Renders the SAME
// `TemplateGallery` as the in-app Templates view (components/views/templates-view),
// both sourced from the SEO catalog SOT (lib/templates-catalog) — no live
// gallery.hanzo.ai fetch. Cards open the detail page /templates/<slug>; the
// "Use template" action forks the real template into the builder.
export default function GalleryPage() {
  return (
    <AppShell currentView="templates">
      <SizableText flex={1} backgroundColor="$background" color="$color" overflow="scroll" display="flex" flexDirection="column">
        <TemplateGallery />
      </SizableText>
    </AppShell>
  );
}
