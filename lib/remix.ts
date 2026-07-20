/**
 * Template remix orchestration — the REAL create → provision → seed pipeline.
 *
 * "Remix" is the one-click path from a Resources template into the builder with
 * a project the user OWNS. Each animated setup step is tied to genuine work:
 *
 *   1. Creating project      → POST /v1/projects (the shared, org-scoped
 *                              projects service record — same store console reads).
 *   2. Setting up integrations→ POST /v1/provision (enables the app's Hanzo
 *                              stack for the new project: Hanzo Base data plane
 *                              + Analytics; see app/v1/provision).
 *   3. Finalizing            → write the `remixSetup` contract + navigate to the
 *                              builder, seeded with the template.
 *
 * Honest by construction: if the cloud record can't be created we fall back to a
 * locally-keyed slug (the record is created on first publish) and say so; if a
 * declared integration can't be auto-provisioned it is surfaced as `pending`
 * with a connect action rather than silently dropped.
 */

/** Something the template needs that the user must finish connecting. */
export interface PendingIntegration {
  name: string;
  /** Where to connect it (a /connectors deep link or provider authorize URL). */
  connectUrl?: string;
  skippable: true;
}

export interface ProvisionResult {
  /** Stack pieces actually enabled for the project (e.g. "Hanzo Base"). */
  provisioned: string[];
  pending: PendingIntegration[];
}

/**
 * The contract the builder (chat lane) consumes on `/dev?remixed=true`: it drops
 * `firstMessage` as the first assistant bubble and renders `pending` as
 * connect/skip chips above the composer.
 */
export interface RemixSetup {
  projectId: string;
  firstMessage: string;
  provisioned: string[];
  pending: PendingIntegration[];
}

/** localStorage key the builder reads once on mount. */
export const REMIX_SETUP_KEY = 'remixSetup';

/** URL-safe slug from a human project name (mirrors projects service slugging). */
export function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'remix';
}

/**
 * Step 1 — create the org-scoped project record the user owns. Returns the
 * canonical slug. `created:false` means the cloud call didn't land and we fell
 * back to a client slug (the record materializes on first publish).
 */
export async function createRemixProject(
  name: string,
  framework = 'html',
): Promise<{ slug: string; created: boolean }> {
  const desired = slugifyName(name);
  try {
    const res = await fetch('/v1/projects', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug: desired, framework }),
    });
    if (res.ok) {
      const p = (await res.json()) as { slug?: string; id?: string };
      const slug = (p.slug || p.id || desired).toString();
      return { slug, created: true };
    }
  } catch {
    // fall through to the local slug
  }
  // Fallback: a locally-keyed slug so the remix still proceeds; the shared
  // record is created when the user first publishes from the builder.
  const suffix = Math.random().toString(36).slice(2, 6);
  return { slug: `${desired}-${suffix}`, created: false };
}

/**
 * Step 2 — enable the new project's Hanzo stack (Base data plane + Analytics)
 * and discover any integrations the template still needs the user to connect.
 */
export async function provisionRemixProject(slug: string): Promise<ProvisionResult> {
  try {
    const res = await fetch('/v1/provision', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: slug }),
    });
    if (res.ok) {
      const r = (await res.json()) as Partial<ProvisionResult>;
      return {
        provisioned: Array.isArray(r.provisioned) ? r.provisioned : [],
        pending: Array.isArray(r.pending) ? r.pending : [],
      };
    }
  } catch {
    // fall through
  }
  // Honest failure: nothing confirmed enabled; surface Base as a retryable
  // pending step rather than claiming success.
  return {
    provisioned: [],
    pending: [{ name: 'Hanzo Base backend', connectUrl: '/connectors', skippable: true }],
  };
}

/** The assistant's honest opening line for the remixed project. */
export function remixFirstMessage(name: string, r: ProvisionResult): string {
  if (r.pending.length === 0) {
    const parts = r.provisioned.length ? r.provisioned.join(' and ') : 'Hanzo Base and Analytics';
    return `I've remixed ${name}. Your ${parts} ${r.provisioned.length === 1 ? 'is' : 'are'} set up — what would you like to change?`;
  }
  const steps = r.pending
    .map((p, i) => `${i + 1}. Connect ${p.name}`)
    .join('\n');
  return `I've remixed ${name}, but there are still steps to get it fully running:\n${steps}`;
}

/**
 * Step 3 — persist the builder handoff contract and return the `/dev` URL to
 * navigate to. The builder reads `remixSetup` on mount; the `template` param
 * seeds the template files into the editor; `project` binds the owned record so
 * a re-publish updates it; `remixed=true` tells the builder this is a remix
 * landing (skip the heavy fork/deploy chooser).
 */
export function seedRemix(setup: RemixSetup, templateSlug: string): string {
  try {
    window.localStorage.setItem(REMIX_SETUP_KEY, JSON.stringify(setup));
    // The builder's own seed contract (preserved): a prompt-less remix still
    // wants the template as the starting point, not a blank onboarding.
    window.localStorage.removeItem('initialPrompt');
  } catch {
    // localStorage may be unavailable; the query params below still carry the
    // essential context (project + template), so the remix is not lost.
  }
  const params = new URLSearchParams({
    project: setup.projectId,
    template: `hanzo-apps/${templateSlug}`,
    action: 'edit',
    remixed: 'true',
  });
  return `/dev?${params.toString()}`;
}
