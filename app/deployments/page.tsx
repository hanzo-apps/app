import { redirect } from "next/navigation";

/**
 * Deployments namespace → admin. hanzo.app has no standalone deployments index;
 * the working deployments UI lives under `/admin/deployments` (only the
 * `/deployments/[id]` detail handlers exist here). This makes the bare
 * `/deployments` URL — a bookmark, a nav link, a shared link — resolve to the
 * admin index instead of 404ing.
 */
export default async function DeploymentsRedirect() {
  redirect("/admin/deployments");
}
