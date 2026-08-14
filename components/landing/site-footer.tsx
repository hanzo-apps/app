// The UNIFIED Hanzo ecosystem footer + the product-specific pre-footer CTA —
// now the SHARED shell components (@hanzogui/shell). Both render from the ONE
// canonical registry inside the shell, so they are byte-identical across every
// Hanzo property; only the current-product highlight (`app`) and the pre-footer
// surface change. This module stays as the app's stable footer entry point
// (`SiteFooter` default + `PreFooterCTA` named) so its call sites are untouched.

import { YStack } from "@hanzo/ui";
import { CHROME, HanzoFooter, HanzoPreFooterCTA } from "@hanzogui/shell";

// PreFooterCTA — the product-specific call to action placed IMMEDIATELY above the
// shared footer. Heading + actions come from the shell's canonical surface data.
export function PreFooterCTA() {
  return <HanzoPreFooterCTA surface="hanzo.app" />;
}

/**
 * The bottom-right 60px square belongs to the "Ask or edit this page" launcher
 * (`public/edit.js`, injected by app/layout.tsx): 44px of button, 16px of
 * inset, `position: fixed`, z-index 2147483000. Anything the page parks there
 * is painted under a control that wins every stacking contest — and the footer
 * parks the LAST thing on the document there, so it is covered permanently
 * rather than for the length of a scroll.
 *
 * Measured at 1024 before this padding: the "Cookies" anchor occupied
 * x 939–1000 / y 852–876 and the launcher x 964–1008 / y 840–884, so
 * `elementFromPoint` at the link's own centre returned the launcher. 48px lifts
 * the legal row 12px clear of the launcher's top edge with the page scrolled to
 * its end. At 1440 the row ends at x=1296 and never reached the corner.
 *
 * The clearance wears the footer's own ground (`CHROME.panel`, true black
 * against the page's #0a0a0a) — read from the shell rather than copied, so it
 * reads as the end of the footer and not as a stripe under it.
 */
export default function SiteFooter() {
  return (
    <YStack paddingBottom={48} backgroundColor={CHROME.panel}>
      <HanzoFooter currentProductId="app" />
    </YStack>
  );
}
