// Template authorship. Every catalog template is a FIRST-PARTY Hanzo example,
// published by a real, permanent IAM account seeded for exactly that purpose
// (hanzo org, tag "hanzo-official-example", properties.official=true /
// seeded=true / exampleApp=<slug>). The account name is a pure function of the
// slug, so the card, the detail page, and the IAM record always agree.
//
// This REPLACES a hash that scattered each template across three plausible-looking
// community handles. Those accounts existed, but the attribution did not: it
// implied independent authorship of work Hanzo published itself, which is the one
// thing a marketplace's authorship line must never do. Seeding examples is normal;
// dressing them up as organic community activity is not.

/** The permanent IAM account a first-party example is published under. */
export function authorOf(slug: string): string {
  return `hanzo-example-${slug}`;
}

/** Human-visible label carried by every first-party example. */
export const OFFICIAL_LABEL = "Hanzo Example";
