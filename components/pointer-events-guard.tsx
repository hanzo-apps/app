"use client";

import { useEffect } from "react";

/**
 * PointerEventsGuard — clears a LEAKED body pointer-events lock.
 *
 * Radix DropdownMenu / Popover / Dialog set `document.body.style.pointerEvents
 * = "none"` while a layer is open (their scroll-lock) and clear it on close. If
 * such a layer unmounts *while still open* — which happens across this editor
 * when a re-render tears down an open menu (the preview double-buffer swap, a
 * Preview/Code tab switch, opening the History overlay, a route change) — the
 * cleanup never runs and the lock LEAKS. The whole page then stops responding
 * to clicks, most visibly the top-left workspace switcher: "I click and nothing
 * happens." (It's not the switcher's code — that's a correct Radix trigger — it
 * is the stale full-document lock sitting on top of everything.)
 *
 * This watches body's inline style; whenever pointer-events becomes "none" it
 * checks on the next frame whether a REAL open Radix layer exists. If one does,
 * the lock is legitimate and left alone (menus keep working). If none does, the
 * lock is stale and gets cleared, restoring clicks. A capture-phase pointerdown
 * sweep is the belt-and-suspenders fallback.
 */
export function PointerEventsGuard() {
  useEffect(() => {
    const body = document.body;

    const hasOpenLayer = () =>
      !!document.querySelector(
        [
          "[data-radix-popper-content-wrapper]",
          '[data-state="open"][role="menu"]',
          '[data-state="open"][role="dialog"]',
          '[data-state="open"][role="listbox"]',
          "[data-radix-focus-guard]",
        ].join(",")
      );

    const clearIfStale = () => {
      if (body.style.pointerEvents === "none" && !hasOpenLayer()) {
        body.style.pointerEvents = "";
      }
    };

    // React to Radix flipping body's style; defer a frame so its layer has
    // finished mounting/unmounting before we decide the lock is stale.
    const obs = new MutationObserver(() =>
      requestAnimationFrame(clearIfStale)
    );
    obs.observe(body, { attributes: true, attributeFilter: ["style"] });

    // Fallback: if a lock ever slips through, the next click sweeps it so the
    // interaction after it lands.
    const onDown = () => clearIfStale();
    window.addEventListener("pointerdown", onDown, true);

    return () => {
      obs.disconnect();
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, []);

  return null;
}
