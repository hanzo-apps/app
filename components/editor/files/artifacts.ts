import type { Page } from '@/types';

/**
 * The sandbox files worth SHOWING — what the pod holds beyond the app itself.
 *
 * The sandbox's listing is the whole checkout, which includes every page the
 * app is made of; the Files pane already lists those as pages, and a second
 * row for each under "Sandbox" would say the same thing twice and bury the one
 * thing this group exists to surface — the deck, the CSV, the zip an agent or
 * a typed command produced.
 *
 * Pure, and separate from the component, because exclusion is exactly the kind
 * of logic that rots invisibly: one normalisation difference (`./index.html`
 * vs `index.html`) and every page quietly reappears as an artifact.
 */
export function artifacts(listing: string[], pages: Page[]): string[] {
  const owned = new Set(pages.map((p) => normalize(p.path)));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of listing) {
    const path = normalize(raw);
    if (!path || owned.has(path) || seen.has(path)) continue;
    seen.add(path);
    out.push(path);
  }
  return out.sort();
}

function normalize(p: string): string {
  return p.trim().replace(/^\.\//, "");
}

/** The download URL for one artifact — the same-origin sandbox-file door. */
export function artifactUrl(sandbox: string, path: string): string {
  return `/v1/shell/files?sandbox=${encodeURIComponent(sandbox)}&file=${encodeURIComponent(path)}`;
}

/** Whether the preview column can SHOW this artifact rather than only offer it. */
export function previewable(path: string): "image" | "text" | null {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["md", "txt", "csv", "json", "log"].includes(ext)) return "text";
  return null;
}
