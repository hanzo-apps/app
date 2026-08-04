/**
 * What to tell the user about a build, in ONE voice.
 *
 * The dead-link and phone-fitness checks ran only on a fresh generation, so an
 * EDIT that added a nav item pointing nowhere, or a fixed 1200px width, said
 * nothing at all. The guarantee has to hold on every turn or it is not a
 * guarantee — a link is no less dead for having arrived on the second prompt.
 *
 * One message, not two toasts: a build with a broken nav usually carries the
 * layout problem that came with it, and stacking notifications buries the first.
 * Links lead because a control that goes nowhere is the more visible failure.
 *
 * Returns null when there is nothing to say — the caller decides what SUCCESS
 * sounds like, since that differs between a first build and an edit.
 */
import { deadLinks } from "@/lib/pages/links";
import { deadResources } from "@/lib/pages/resources";
import { responsiveIssues } from "@/lib/pages/responsive";
import type { Page } from "@/types";

export function qualityReport(pages: Page[]): string | null {
  const dead = deadLinks(pages);
  if (dead.length) {
    const first = dead[0];
    return dead.length === 1
      ? `${first.href} on ${first.from} goes nowhere — ${first.reason}. Ask for that page, or for the link to be removed.`
      : `${dead.length} links go nowhere (first: ${first.href} on ${first.from}). Ask for those pages, or for the links to be removed.`;
  }

  // A missing local script is worse than a dead link: it does not just go
  // nowhere, it takes the page's JavaScript down with it (the 404'd file was
  // meant to DEFINE something the rest of the page then references).
  const missing = deadResources(pages);
  if (missing.length) {
    const first = missing[0];
    return missing.length === 1
      ? `${first.from} loads ${first.ref}, which does not exist — the ${first.kind} 404s and its code never runs. Inline it, or create the file.`
      : `${missing.length} local files are referenced but missing (first: ${first.ref} on ${first.from}). Inline them, or create them.`;
  }

  const unfit = responsiveIssues(pages);
  if (unfit.length) {
    const first = unfit[0];
    return unfit.length === 1
      ? `${first.from}: ${first.problem}${first.detail ? ` (${first.detail})` : ""}.`
      : `${unfit.length} things will not render on a phone (first: ${first.from} — ${first.problem}).`;
  }
  return null;
}
