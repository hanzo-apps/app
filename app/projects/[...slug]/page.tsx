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
  const project = (slug ?? []).map(decodeURIComponent).join("/");
  redirect(`/dev?project=${encodeURIComponent(project)}`);
}
