/**
 * /v1/register — tie an editable Hanzo property back to a hanzo.app project.
 *
 * The Edit widget declares its source via `<meta name="hanzo:repo">`. On load for
 * a SIGNED-IN user it calls this once so the property shows up in the org's
 * projects list (the SAME store console.hanzo.ai reads). Cross-origin BY DESIGN
 * (the widget runs on every Hanzo origin), so — like `/v1/me` and `/v1/edit` — it
 * accepts the caller's IAM bearer via cookie OR `Authorization` header, is
 * CORS-gated to the Hanzo family, and NEVER lets the browser pick a tenant: the
 * cloud gateway derives the org from the bearer's owner claim.
 *
 * IDEMPOTENT + fail-open: `ensureProjectForRepo` only creates when no project
 * already links the repo, and any backend hiccup returns `registered:false`
 * rather than an error — auto-registration is a convenience, not a gate. Anonymous
 * callers get `{ authenticated:false }` and no write is attempted.
 */
import type { NextRequest } from 'next/server';

import { ensureProjectForRepo } from '@/lib/org/server';
import { session } from '@/lib/iam';
import { preflight, withCors } from '@/lib/edit/cors';

export const runtime = 'nodejs';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');

  // Only a validated, signed-in user registers (skip for anon).
  const id = await session(req);
  if (!id) return withCors(origin, { ok: false, authenticated: false });
  if (!id.org) {
    // No home org yet → nothing to scope a project to. Not an error.
    return withCors(origin, { ok: true, authenticated: true, registered: false, needsOnboarding: true });
  }

  const body = (await req.json().catch(() => ({}))) as { repo?: string; name?: string; slug?: string };
  const repo = (body.repo || '').trim();
  if (!repo) return withCors(origin, { ok: false, error: 'repo is required' }, 400);

  const name = (body.name || '').trim() || deriveName(repo);
  const slug = (body.slug || '').trim() || deriveSlug(repo);

  const result = await ensureProjectForRepo(id.token, { repo, name, slug });
  return withCors(origin, { ok: true, authenticated: true, ...result });
}

/** A human project name from `owner/repo` → the repo, de-slugged Title Case. */
function deriveName(repo: string): string {
  const last = repo.split('/').filter(Boolean).pop() || repo;
  const pretty = last.replace(/[-_.]+/g, ' ').replace(/\.git$/i, '').trim();
  return pretty.replace(/\b\w/g, (c) => c.toUpperCase()) || last;
}

/** A DNS/identifier-safe slug from `owner/repo` → the repo id, lowercased. */
function deriveSlug(repo: string): string {
  const last = repo.split('/').filter(Boolean).pop() || repo;
  return (
    last
      .toLowerCase()
      .replace(/\.git$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63) || 'site'
  );
}

export const dynamic = 'force-dynamic';
