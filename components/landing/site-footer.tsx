// The UNIFIED Hanzo ecosystem footer + the product-specific pre-footer CTA —
// now the SHARED shell components (@hanzogui/shell). Both render from the ONE
// canonical registry inside the shell, so they are byte-identical across every
// Hanzo property; only the current-product highlight (`app`) and the pre-footer
// surface change. This module stays as the app's stable footer entry point
// (`SiteFooter` default + `PreFooterCTA` named) so its call sites are untouched.

import { HanzoFooter, HanzoPreFooterCTA } from "@hanzogui/shell";

// PreFooterCTA — the product-specific call to action placed IMMEDIATELY above the
// shared footer. Heading + actions come from the shell's canonical surface data.
export function PreFooterCTA() {
  return <HanzoPreFooterCTA surface="hanzo.app" />;
}

export default function SiteFooter() {
  return <HanzoFooter currentProductId="app" />;
}
