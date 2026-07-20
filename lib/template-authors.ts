// Template authorship — every catalog template is published under a real Hanzo
// community user. Until user-published sites (git.hanzo.ai → S3) land, the
// gallery + /community attribute each template to one of the seed maintainers,
// deterministically by slug (stable, SSR-safe — same card always same author).

export const SEED_AUTHORS = ["hanzo-dev", "zeekay", "zooqueen"] as const;
export type Author = (typeof SEED_AUTHORS)[number];

// FNV-1a → stable uint32, so authorship is a pure function of the slug.
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The community user a template is published under. */
export function authorOf(slug: string): Author {
  return SEED_AUTHORS[seedOf(slug) % SEED_AUTHORS.length];
}
