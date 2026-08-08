"use client";

import { useEffect } from "react";

/**
 * The bridge between the shared accent and this app's monochrome chrome.
 *
 * @hanzo/appearance writes a chosen accent to --primary/--accent inline on
 * <html>, and the design ramp reads those. The app's own chrome — links, the
 * focus ring, ::selection, the product menu — reads --hanzo-accent instead, so
 * a pick would move the components and leave the chrome white. This copies the
 * one onto the other whenever it changes, inline on <html> where it outranks
 * the html.dark default. An unset accent removes the mirror, so the white-label
 * monochrome default stands — the pick is the only thing that overrides it.
 */
export function AccentSync() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const accent = root.style.getPropertyValue("--accent").trim();
      if (accent) root.style.setProperty("--hanzo-accent", accent);
      else root.style.removeProperty("--hanzo-accent");
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
