import { redirect } from "next/navigation";

/**
 * Projects namespace → builder. hanzo.app has no standalone project-detail page;
 * a project opens IN the builder (`/dev?project=<slug>`), exactly like the
 * dashboard and landing deep-links. This catch-all makes ANY `/projects/<…>`
 * URL — a bookmark, an API redirect, a shared link — resolve to the builder
 * instead of 404ing (the bug where clicking a project hit a dead route). The
 * slug segments rejoin into the project id the builder resolves via
 * `/v1/projects/<slug>`.
 */
export default async function ProjectRedirect({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const parts = (slug ?? []).map(decodeURIComponent).filter(Boolean);
  // /projects/<org>/<slug> → the canonical nice URL; /projects/<slug> → the
  // legacy query form (which canonicalizes once the record resolves).
  if (parts.length === 2) {
    redirect(`/dev/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`);
  }
  redirect(`/dev?project=${encodeURIComponent(parts.join("/"))}`);
}
