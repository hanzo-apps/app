/**
 * What hanzo.app stores in Hanzo Base, named in one place.
 *
 * THE APP DOES NOT CREATE THESE, and cannot: Base's collections API is behind
 * `RequireSuperuserAuth`, which means a record in Base's own `_superusers`
 * collection. hanzo.app authenticates people through hanzo.id, and an IAM
 * identity is never a Base superuser — so a create attempted from here is
 * refused every time, forever. Code that tried anyway used to sit in
 * `lib/db/history.ts`, tolerating the refusal in a `catch`, which read exactly
 * like provisioning while provisioning nothing.
 *
 * They are declared state instead, as Base migrations mounted into the
 * deployment (`--migrationsDir=/migrations --automigrate`, the
 * `hanzo-app-base-migrations` ConfigMap in the universe repo). Adding a
 * collection is a migration; this file only says which ones the app expects to
 * find, so a name is written once rather than spelled out at each call.
 */

export const PROJECTS = 'projects';
export const ASSETS = 'assets';
export const BRAND = 'brand';
export const IMAGES = 'images';
export const BOOKMARKS = 'app_bookmarks';
export const REVISIONS = 'app_revisions';

/** The biggest single image accepted — matches the migration's field maxSize. */
export const MAX_IMAGE_BYTES = 5 << 20;

/** What the builder will store bytes for. Anything else is not an image. */
export const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];
