/**
 * The attribution trailer on commits hanzo.app writes, and who may remove it.
 *
 * A commit pushed by the builder is authored by the USER — it goes out on their
 * own linked provider token, so it lands under their GitHub identity, which is
 * correct: it is their code and their repo. The trailer records the other
 * participant. Git's own `Co-authored-by:` is the right mechanism because every
 * forge already understands it, so nothing has to be taught to display this.
 *
 * Removing it is a paid capability, and the rule lives here rather than at the
 * call site for one reason: a paywall checked in two places is a paywall with
 * two answers. The route asks this function; nothing else decides.
 *
 * THE CLIENT MAY ASK, THE SERVER DECIDES. `omitAttribution` is a preference and
 * arrives from the browser; `tier` comes from `/v1/entitlements`, resolved
 * server-side from the caller's own bearer. Trusting the browser for the second
 * would make the paywall a suggestion.
 */

/** The one trailer. Exported so tests and callers cannot spell it differently. */
export const HANZO_COAUTHOR = "Co-authored-by: Hanzo Dev <dev@hanzo.ai>";

/**
 * True when this caller is allowed to publish commits without the trailer.
 *
 * `tier` is the org's resolved subscription slug from commerce; the empty string
 * is that authority saying "no plan". Anything else is a plan, so the check is
 * "did commerce name one", not a hardcoded list of slug spellings that would
 * silently deny a plan someone renames.
 */
export function mayOmitAttribution(tier: string | null | undefined): boolean {
  return typeof tier === "string" && tier.trim() !== "";
}

/**
 * The final commit message.
 *
 * Idempotent: a message that already carries the trailer does not get a second
 * one. The builder writes a commit per turn, and a re-sync of the same pages
 * would otherwise stack duplicates down the message.
 */
export function commitMessage(
  base: string,
  opts: { omitAttribution?: boolean; tier?: string | null } = {},
): string {
  const message = (base || "").trimEnd();
  const omit = Boolean(opts.omitAttribution) && mayOmitAttribution(opts.tier);
  if (omit) return message;
  if (message.includes(HANZO_COAUTHOR)) return message;
  // A blank line before trailers is what makes git parse them AS trailers
  // rather than as the last line of the body.
  return `${message}\n\n${HANZO_COAUTHOR}`;
}
