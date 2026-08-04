/**
 * The signed-in user's own profile — read and write, server-side.
 *
 * IAM is the record's home, but a regular user may only READ its own row there
 * (`internal/authz/authz.go`: "Regular user — self-service only: reading its own
 * user record"). Writes go through the app's confidential client, which CAN
 * address any row — so the safety of this module rests on two things and they
 * are both here rather than spread across callers:
 *
 *   1. `id` is bound by the ROUTE to the resolved session. Nothing a browser
 *      sends ever names the target.
 *   2. Only {@link WRITABLE} fields survive the merge. IAM's update-user takes a
 *      WHOLE user object and overwrites the column set, so a pass-through would
 *      let a caller set `isAdmin`, move `owner`, or overwrite `passwordHash` —
 *      privilege escalation through a profile form. The merge below starts from
 *      the stored row and copies in only these keys; a field absent from the
 *      list cannot be written no matter what arrives.
 *
 * The avatar is stored as a bounded data URI on `user.avatar` rather than a URL
 * into object storage. That is a deliberate bound, not a shortcut: `avatar`
 * surfaces on the `picture` claim in the USERINFO response only
 * (`internal/oidc/userinfo.go`), never in the ID token, so a small image costs
 * one fetch a few KB and costs every JWT nothing. {@link AVATAR_LIMIT} is what
 * keeps that true — the caller downscales, and this refuses anything larger.
 */
import 'server-only';

import { ABSENT, IamError, adminConfigured, iam } from '@/lib/iam-admin';

export { adminConfigured as profileConfigured };

/**
 * The ONLY user fields this app will write. Adding a key here grants the
 * profile form authority over it — `isAdmin`, `owner`, `name`, `passwordHash`
 * and `permissions` are absent on purpose and must stay absent.
 */
const WRITABLE = ['displayName', 'avatar', 'bio', 'homepage', 'twitter', 'github'] as const;

type Writable = (typeof WRITABLE)[number];

/** A profile patch: every key optional, no key outside {@link WRITABLE}. */
export type ProfilePatch = Partial<Record<Writable, string>>;

/**
 * Largest avatar we will store, in bytes of data URI. 96 KB holds a 256×256
 * WebP comfortably while keeping the userinfo response small. Beyond this the
 * answer is "too large", never a silent truncation — a truncated data URI is a
 * broken image that looks like a successful save.
 */
export const AVATAR_LIMIT = 96 * 1024;

/** An image we are willing to persist: a data URI of a real raster type. */
const AVATAR_SHAPE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

/** What the profile form shows. A view of the stored row, never the whole row. */
export interface Profile {
  displayName: string;
  avatar: string;
  bio: string;
  homepage: string;
  twitter: string;
  github: string;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function view(row: Record<string, unknown>): Profile {
  return {
    displayName: str(row.displayName),
    avatar: str(row.avatar),
    bio: str(row.bio),
    homepage: str(row.homepage),
    twitter: str(row.twitter),
    github: str(row.github),
  };
}

/** Read the user's stored profile. `null` only when IAM says the row is absent. */
export async function readProfile(id: string): Promise<Profile | null> {
  try {
    const row = await iam<Record<string, unknown> | null>('/v1/iam/get-user', { id });
    return row ? view(row) : null;
  } catch (e) {
    if (e instanceof IamError && e.absent) return null;
    throw e;
  }
}

/** Why a patch was refused. The message is shown to the person who typed it. */
export class InvalidProfile extends Error {}

/**
 * Validate a patch, or throw {@link InvalidProfile} naming the offending field.
 *
 * Length caps exist because the row is a JSON document with no per-column
 * limit — nothing downstream would refuse a megabyte of "bio" on our behalf.
 */
export function checkPatch(patch: ProfilePatch): void {
  const avatar = patch.avatar;
  if (avatar !== undefined && avatar !== '') {
    if (!AVATAR_SHAPE.test(avatar)) {
      throw new InvalidProfile('That photo is not an image we can store (PNG, JPEG, WebP or GIF).');
    }
    if (avatar.length > AVATAR_LIMIT) {
      throw new InvalidProfile(
        `That photo is ${Math.round(avatar.length / 1024)} KB after encoding; the limit is ${AVATAR_LIMIT / 1024} KB.`,
      );
    }
  }
  if ((patch.displayName?.length ?? 0) > 120) throw new InvalidProfile('Name is too long (120 characters max).');
  if ((patch.bio?.length ?? 0) > 1000) throw new InvalidProfile('Bio is too long (1000 characters max).');
  for (const k of ['homepage', 'twitter', 'github'] as const) {
    if ((patch[k]?.length ?? 0) > 200) throw new InvalidProfile(`${k} is too long (200 characters max).`);
  }
  if (patch.homepage) {
    // A link the page will render as an href. Anything but http(s) — `javascript:`
    // above all — must not reach an attribute.
    if (!/^https?:\/\/\S+$/i.test(patch.homepage)) {
      throw new InvalidProfile('Website must be a full http(s) URL.');
    }
  }
}

/**
 * Apply `patch` to the user's own row and return the stored result.
 *
 * Reads the FULL current row first and writes it back with only the writable
 * keys changed: IAM's update-user overwrites the default column set, so sending
 * a partial object blanks every field it omits — the same trap `moveUserToOrg`
 * documents. A row that reads back empty is refused rather than written, because
 * writing a partial would erase the account's columns.
 */
export async function writeProfile(id: string, patch: ProfilePatch): Promise<Profile> {
  checkPatch(patch);

  const current = await iam<Record<string, unknown> | null>('/v1/iam/get-user', { id });
  if (!current) throw new IamError(`IAM returned no user for ${id}`, false);

  const next: Record<string, unknown> = { ...current };
  for (const key of WRITABLE) {
    const value = patch[key];
    if (value !== undefined) next[key] = value;
  }

  await iam('/v1/iam/update-user', { id }, next);
  return view(next);
}

export { ABSENT };
