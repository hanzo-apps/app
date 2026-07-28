// The one reader of the public build API.
//
// /v1/agents/builds is anonymous by design — the only rows it can return are
// ones an author published — so these pages fetch the cloud DIRECTLY from the
// server, with no BFF route and no token. A proxy would exist only to attach a
// credential that is not needed, and would then need its own cache policy for
// data that is already public.
//
// This is the single place that knows the build endpoints; the pages compose it.

import type { Build } from "@/components/builds/build-transcript";

const BASE = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

// Public data with a real editorial lifetime: a build story changes only when
// its author republishes, so a minute of revalidation keeps pages fast without
// serving anything meaningfully stale.
const REVALIDATE = 60;

export type BuildSummary = {
  org: string;
  project: string;
  session: string;
  title?: string;
  agent: string;
  status: string;
  repo?: string;
  turns: number;
  startedAt: string;
  endedAt?: string;
};

/** getBuild returns one published build, or null when there is none. */
export async function getBuild(org: string, project: string): Promise<Build | null> {
  try {
    const r = await fetch(
      `${BASE}/agents/builds/${encodeURIComponent(org)}/${encodeURIComponent(project)}`,
      { next: { revalidate: REVALIDATE } }
    );
    if (!r.ok) return null;
    return (await r.json()) as Build;
  } catch {
    // A build page that cannot reach the API is a missing story, not a crashed
    // product page — the caller renders notFound() rather than a 500.
    return null;
  }
}

/** listBuilds returns every published build, newest first ([] on failure). */
export async function listBuilds(): Promise<BuildSummary[]> {
  try {
    const r = await fetch(`${BASE}/agents/builds`, { next: { revalidate: REVALIDATE } });
    if (!r.ok) return [];
    const body = (await r.json()) as { builds?: BuildSummary[] };
    return body.builds ?? [];
  } catch {
    return [];
  }
}

/**
 * findBuildFor locates the published build for a project slug, or null.
 *
 * A product page links to its build ONLY when one exists — no guessed org, no
 * link that 404s. The org is read off the index rather than assumed, because
 * assuming "hanzo" would be right for first-party templates and wrong for every
 * community app the same page will eventually render.
 */
export async function findBuildFor(project: string): Promise<BuildSummary | null> {
  const builds = await listBuilds();
  return builds.find((b) => b.project === project) ?? null;
}
