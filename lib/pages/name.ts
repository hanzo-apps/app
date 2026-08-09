/**
 * A page's NAME — what a person calls it, derived from what the file is called.
 *
 * The header's page pill said `index.html`, which is the file's name in the
 * builder's own terms and nobody else's: a person calls that page the
 * Homepage. The mapping is derivation, not storage — a rename keeps working,
 * nothing can drift — and the page browser underneath still shows real paths
 * for anyone who needs them.
 */
export function pageName(path: string): string {
  const file = (path ?? "").split("/").pop() ?? "";
  const stem = file.replace(/\.[a-z0-9]+$/i, "");
  if (!stem) return path || "";
  if (stem.toLowerCase() === "index") return "Homepage";
  return stem
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
