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

  const unfit = responsiveIssues(pages);
  if (unfit.length) {
    const first = unfit[0];
    return unfit.length === 1
      ? `${first.from}: ${first.problem}${first.detail ? ` (${first.detail})` : ""}.`
      : `${unfit.length} things will not render on a phone (first: ${first.from} — ${first.problem}).`;
  }
  return null;
}
