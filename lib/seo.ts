import type { ReactNode } from "react";

// Passthrough layout body for client-component marketing pages that need static
// <head> metadata. A "use client" page can't `export const metadata`, so a
// co-located server `layout.tsx` carries the metadata and re-exports this — it
// renders children unchanged (no DOM wrapper), so it's transparent to the page.
export default function MetaLayout({ children }: { children: ReactNode }) {
  return children;
}
