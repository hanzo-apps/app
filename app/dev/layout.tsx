import type { Metadata } from "next";

/**
 * The Enso launcher is ANCHORED into the console, not floating over the preview.
 *
 * `public/edit.js` is a viewport-corner control: `position: fixed; right: 16px;
 * bottom: 16px`. Measured on this route at 1430x832, that 56px box lands at
 * x 1358-1414, y 760-816 — and the builder owns every pixel of it. The preview
 * card runs x 404-1418, y 62-792 with an 8px corner, and the console dock bar is
 * y 804-832 with its own controls at the right end. So the mark is drawn over the
 * customer's app, cut by the card's rounded corner, and then over the dock's chat
 * toggle and mic. No inset moves it somewhere free: the card fills the entire
 * right side, so nudging it up only pushes it further INTO the preview.
 *
 * Placement is the symptom. The reason it does not belong is that the widget
 * answers "contribute to THIS page" by opening a PR against the page's own
 * source, and what is on screen here is the customer's generated app — which is
 * not in hanzoai/app at all. The builder already has exactly one control for
 * changing what you are looking at, and it is the composer.
 *
 * This route used to turn the widget OFF for that reason — no `hanzo:repo`, no
 * widget. That removed the tool along with the collision: editing hanzo.app
 * itself became unreachable from the builder. `hanzo:anchor` fixes the placement
 * instead, mounting the launcher inside the console's control cluster
 * (`#enso-dock`), where it is out of the canvas and beside the other workspace
 * controls. The repo stays the app's own — that is what this launcher edits.
 *
 * The repo is BLANKED rather than the `other` object replaced. Measured on the
 * live route: an empty `other: {}` changed nothing and `hanzo:repo` still read
 * `hanzoai/app`, because Next merges `other` BY KEY into the parent's — an empty
 * object overrides nothing. Only naming the key overrides it.
 */
export const metadata: Metadata = {
  // ANCHORED, not disabled. The widget was blanked here because its fixed corner
  // landed on the customer's preview; `hanzo:anchor` moves the launcher into the
  // console's control cluster instead, so editing hanzo.app itself is reachable
  // from the builder without drawing over the app being built. The repo stays
  // the app's own — that is the thing this launcher edits.
  other: { "hanzo:anchor": "#enso-dock" },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
