/**
 * /v1/me/profile — read and write the SIGNED-IN user's own profile.
 *
 * `me` is not a parameter. The target row is composed here from the verified
 * session (`<org>/<name>`, exactly as `app/onboard/route.ts` binds it), so no
 * value from the browser can name a different user. That is the whole
 * authorization story: `lib/profile` writes with the app's confidential IAM
 * client, which can address ANY row, and this route is the thing that decides
 * which one.
 *
 * The profile page previously "saved" by calling `toast.success('Profile
 * updated successfully')` and nothing else — no request, no persistence, a
 * green confirmation for work that never happened. This route is what that
 * message is now allowed to mean.
 *
 * GET  → { ok, profile }
 * POST → { ok, profile } on success; 400 with a message the user can act on
 *        when the patch is invalid; 501 when the confidential client is unwired
 *        (honest, never a fabricated success).
 */
import { type NextRequest, NextResponse } from 'next/server';

import { session } from '@/lib/iam';
import { requireSameOrigin } from '@/lib/org/csrf';
import {
  InvalidProfile,
  type ProfilePatch,
  profileConfigured,
  readProfile,
  writeProfile,
} from '@/lib/profile';

export const runtime = 'nodejs';

const unauthorized = () =>
  NextResponse.json({ ok: false, openLogin: true, message: 'Sign in to edit your profile' }, { status: 401 });

/** The IAM row id for a session. A user with no org has no addressable row. */
function rowId(user: { org: string; name: string }): string | null {
  if (!user.name) return null;
  return user.org ? `${user.org}/${user.name}` : user.name;
}

export async function GET(request: NextRequest) {
  const user = await session(request);
  if (!user) return unauthorized();
  if (!profileConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'Profile editing is not configured on this deployment.' },
      { status: 501 },
    );
  }
  const id = rowId(user);
  if (!id) return unauthorized();

  try {
    const profile = await readProfile(id);
    if (!profile) {
      return NextResponse.json({ ok: false, message: 'No profile found for this account.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Could not read your profile.' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Cookie-authenticated and it MUTATES the account — refuse a cross-origin
  // POST before doing any work.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const user = await session(request);
  if (!user) return unauthorized();
  if (!profileConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'Profile editing is not configured on this deployment.' },
      { status: 501 },
    );
  }
  const id = rowId(user);
  if (!id) return unauthorized();

  const body = (await request.json().catch(() => null)) as ProfilePatch | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, message: 'Expected a JSON profile patch.' }, { status: 400 });
  }

  try {
    const profile = await writeProfile(id, body);
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    // A patch the person can fix reads as 400 with the reason they need; anything
    // else is ours, not theirs, and must not be phrased as their mistake.
    if (e instanceof InvalidProfile) {
      return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Could not save your profile.' },
      { status: 502 },
    );
  }
}
