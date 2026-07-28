// The cross-org catalog client — ONE fetch against the ONE surface
// (api.hanzo.ai /v1/catalog, clients/catalog). There is no second source: search,
// browse and the facet rail are all the same request, because the API answers a
// query with no `q` as a browse and returns its facet counts either way.
//
// Credentials are sent when the browser holds them (the cookie the first-party
// sign-in mints) so a signed-in visitor ALSO sees their own org's projects
// alongside the public catalog. The org is never a parameter here — cloud takes it
// from the validated principal (HIP-0026), so asking for another tenant's rows is
// not a thing this client could express even if it tried.

import { API_BASE } from "@/lib/platform";

export type CatalogEntry = {
  id: string;
  org: string;
  name: string;
  title?: string;
  kind: string;
  archetype?: string;
  language?: string;
  description?: string;
  /** Live, if it is deployed. */
  url?: string;
  /** Source — the repo this was built from. A demo you cannot read is a screenshot. */
  repo?: string;
  /** Lineage — "<org>/<slug>" of the parent this was forked from. */
  template?: string;
  forkable?: boolean;
  stars?: number;
  updated?: string;
  /**
   * Authorship. `official` is the platform-gated first-party marker — only an
   * admin can raise it, so the card may state it as fact. `upstream`/`license`
   * credit somebody ELSE's work. A card that renders neither is not being
   * neutral: under a page headed with our own org names, silence reads as ours.
   */
  official?: boolean;
  upstream?: string;
  license?: string;
  /** "public" = the cross-org catalog; "org" = visible only to this caller. */
  scope: "public" | "org";
};

export type CatalogFacets = Record<string, Record<string, number>>;

export type CatalogResponse = {
  data: CatalogEntry[];
  total: number;
  facets: CatalogFacets;
};

export type CatalogQuery = {
  q?: string;
  org?: string;
  kind?: string;
  archetype?: string;
  language?: string;
  /** "true" | "false" | "" — the axis has three answers, and "" is unasked. */
  forkable?: string;
  /** Same three answers: "show me only ours" and "show me what is NOT ours". */
  official?: string;
  limit?: number;
  offset?: number;
};

export async function searchCatalog(
  query: CatalogQuery,
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.org) p.set("org", query.org);
  if (query.kind) p.set("kind", query.kind);
  if (query.archetype) p.set("archetype", query.archetype);
  if (query.language) p.set("language", query.language);
  // forkable rides the same "set it or leave it out" rule as every other axis;
  // it is a string BECAUSE "false" is a real question ("what can I not fork?"),
  // and a boolean flag could only ever ask half of it.
  if (query.forkable) p.set("forkable", query.forkable);
  if (query.official) p.set("official", query.official);
  p.set("limit", String(query.limit ?? 60));
  if (query.offset) p.set("offset", String(query.offset));

  const res = await fetch(`${API_BASE}/v1/catalog?${p}`, {
    credentials: "include",
    signal,
  });
  if (!res.ok) throw new Error(`catalog: ${res.status}`);
  return res.json();
}

/** Sorted facet buckets, biggest first — the rail order a person expects. */
export function buckets(facets: CatalogFacets, dim: string): [string, number][] {
  return Object.entries(facets?.[dim] ?? {}).sort((a, b) => b[1] - a[1]);
}
