import type { Metadata } from "next";

/**
 * The builder declares no source repo, so the contribute widget never mounts here.
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
 * Turning it off needs no flag and no env var, because the widget already has a
 * declarative contract: with no `hanzo:repo` it does nothing (edit.js:52).
 *
 * The repo is BLANKED rather than the `other` object replaced. Measured on the
 * live route: an empty `other: {}` changed nothing and `hanzo:repo` still read
 * `hanzoai/app`, because Next merges `other` BY KEY into the parent's — an empty
 * object overrides nothing. Only naming the key overrides it.
 */
export const metadata: Metadata = {
  other: { "hanzo:repo": "" },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
