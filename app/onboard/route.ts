/**
 * Org onboarding — create the signed-in user's organization, server-side.
 *
 * Same-origin (`/onboard`): the browser sends only its httpOnly `hanzo_token`;
 * this handler resolves the user from that bearer and acts as the confidential
 * IAM client to create a customer/personal org and make the user its admin. An
 * IAM user belongs to exactly ONE org (their `owner`), so a zero-org user is
 * MOVED into the new org; their next JWT then carries the new owner and every
 * scoped call attributes to it.
 *
 * Fail-closed + safe:
 *   - 401 with no session; 501 when the IAM client is unwired (honest, not fake).
 *   - ONLY a zero-org user is MOVED; a user who already has an org may create an
 *     additional named org but is NOT moved (that would orphan their current
 *     org). A `personal:true` request from someone who already has an org → 409.
 *   - reserved names refused (pure policy).
 *
 *   POST /onboard { }                → create + join a personal `<username>` org.
 *   POST /onboard { personal: true } → same (explicit).
 *   POST /onboard { name }           → create org `slugify(name)` (join iff zero-org).
 * Returns { org, displayName, additional }; the client then re-auths so the new
 * JWT carries the new owner.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { resolveOrgIdentity } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';
import {
  createOrganization,
  getOrganization,
  moveUserToOrg,
  onboardConfigured,
} from '@/lib/org/onboard';
import {
  isReservedOrg,
  personalOrgSlug,
  slugifyOrg,
  validateOrgName,
  MAX_ORG_SLUG,
  MIN_ORG_SLUG,
} from '@/lib/org/policy';

export const runtime = 'nodejs';

/** Title-case a username for a personal org's display name. */
function humanize(username: string): string {
  const base = (username.includes('@') ? username.slice(0, username.indexOf('@')) : username)
    .replace(/[._-]+/g, ' ')
    .trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Personal';
}

/** First free slug at/after `base` (`base`, `base-2`, …); null if all taken. */
async function freeSlug(base: string): Promise<string | null> {
  for (let i = 1; i <= 20; i++) {
    const candidate =
      i === 1 ? base : `${base.slice(0, MAX_ORG_SLUG - 3)}-${i}`.replace(/-+/g, '-');
    if (candidate.length < MIN_ORG_SLUG || isReservedOrg(candidate)) continue;
    if (!(await getOrganization(candidate))) return candidate;
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // CSRF: creating/joining an org is state-changing — refuse a cross-origin POST
  // before touching IAM.
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const user = await resolveOrgIdentity(req, { validate: true });
  if (!user) {
    return NextResponse.json({ error: 'Sign in to create an organization.' }, { status: 401 });
  }
  if (!onboardConfigured()) {
    return NextResponse.json(
      { error: 'Organization creation is not configured on this deployment (IAM client unset).' },
      { status: 501 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { name?: string; personal?: boolean };
  // Default (no name) = personal org — the "just let me build" path.
  const personal = body.personal === true || !body.name;

  const additional = Boolean(user.homeOrg);
  if (additional && personal) {
    return NextResponse.json(
      { error: 'You already have an organization. Name the new one explicitly.' },
      { status: 409 },
    );
  }

  let baseSlug: string;
  let displayName: string;
  if (personal) {
    baseSlug = personalOrgSlug(user.name) || slugifyOrg(user.email);
    if (!baseSlug || baseSlug.length < MIN_ORG_SLUG || isReservedOrg(baseSlug)) {
      baseSlug = `org-${slugifyOrg(user.name) || 'workspace'}`;
    }
    displayName = humanize(user.name || user.email);
  } else {
    const v = validateOrgName(body.name ?? '');
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    baseSlug = v.slug;
    displayName = (body.name ?? '').trim();
  }

  let slug = baseSlug;
  if (await getOrganization(slug)) {
    if (!personal) {
      return NextResponse.json(
        { error: `"${slug}" is taken. Choose a different name.` },
        { status: 409 },
      );
    }
    const free = await freeSlug(baseSlug);
    if (!free) {
      return NextResponse.json({ error: 'Could not find an available name.' }, { status: 409 });
    }
    slug = free;
  }

  try {
    await createOrganization({
      name: slug,
      displayName,
      personal,
      sourceOwner: user.homeOrg,
    });
    // First-run only: make the zero-org user this org's admin (owner-move).
    if (!additional) {
      const id = user.homeOrg ? `${user.homeOrg}/${user.name}` : user.name;
      await moveUserToOrg(id, slug);
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Could not create the organization: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ org: slug, displayName, additional });
}
