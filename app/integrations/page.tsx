import { redirect } from "next/navigation";

/**
 * `/integrations` → `/connectors`.
 *
 * There is ONE connectors surface: `/connectors` (org-scoped, backed by cloud
 * `/v1/integrations`, shared with console.hanzo.ai). "Connectors" is the canonical
 * product name. This path is kept only so existing links — marketing footers
 * (`app/features`, `app/chat`), older bookmarks — funnel to the one real surface
 * instead of a second, divergent page. (Temporary 307 so the alias stays
 * reversible if a distinct public catalog is ever wanted here.)
 */
export default function IntegrationsRedirect(): never {
  redirect("/connectors");
}
