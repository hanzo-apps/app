// The UNIFIED Hanzo ecosystem footer + the product-specific pre-footer CTA —
// now the SHARED shell components (@hanzogui/shell). Both render from the ONE
// canonical registry inside the shell, so they are byte-identical across every
// Hanzo property; only the current-product highlight (`app`) and the pre-footer
// surface change. This module stays as the app's stable footer entry point
// (`SiteFooter` default + `PreFooterCTA` named) so its call sites are untouched.

// CLIENT-ONLY. @hanzogui/shell renders a Tamagui Dialog internally, and
// DialogSheetController -> useAdaptIsActive -> useMedia throws during prerender
// ("Cannot create proxy with a non-object as target or handler"). This module is
// a SERVER component, so it is the last Tamagui surface reaching the prerenderer
// after the root-layout dialog was gated — and it is why /templates/[slug] was
// the only route still failing.
//
// Cost: the footer's cross-property links leave the prerendered HTML, so a
// crawler that does not run JS will not see them. Revisit if @hanzogui/shell
// stops rendering a Dialog unconditionally, which is the real fix.
'use client';

import dynamic from 'next/dynamic';

const HanzoFooter = dynamic(() => import('@hanzogui/shell').then((m) => m.HanzoFooter), {
  ssr: false,
});
const HanzoPreFooterCTA = dynamic(
  () => import('@hanzogui/shell').then((m) => m.HanzoPreFooterCTA),
  { ssr: false },
);

// PreFooterCTA — the product-specific call to action placed IMMEDIATELY above the
// shared footer. Heading + actions come from the shell's canonical surface data.
export function PreFooterCTA() {
  return <HanzoPreFooterCTA surface="hanzo.app" />;
}

export default function SiteFooter() {
  return <HanzoFooter currentProductId="app" />;
}
