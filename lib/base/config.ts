/**
 * Hanzo Base configuration.
 *
 * Base is the persistent, IAM-native data layer for apps built on Hanzo.
 * A builder-generated app provisions collections in Base and reads/writes
 * records through it, authenticated by the same Hanzo IAM (hanzo.id) JWT the
 * user signs in with.
 *
 * Server-side calls hit the in-cluster service (BASE_URL, e.g.
 * http://hanzo-app-base:8090/v1). The browser never talks to Base directly —
 * it goes through the /v1-style proxy at /api/base/* so the user's session
 * token stays server-side. NEXT_PUBLIC_BASE_URL is exposed only so generated
 * code can reference the public base path it should call.
 */

// In-cluster REST endpoint, including the /v1 API prefix. Server-only.
const RAW_BASE_URL = process.env.BASE_URL || '';

/** Server-side Base REST endpoint (…/v1), or '' when unconfigured. */
export function baseUrl(): string {
  return RAW_BASE_URL.replace(/\/+$/, '');
}

/** True when a Base backend is wired up for generated apps. */
export function isBaseConfigured(): boolean {
  return baseUrl().length > 0;
}

/**
 * Public path a generated app calls to reach its Base backend. Defaults to the
 * builder-origin proxy so generated apps work without extra configuration.
 */
export function publicBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || '/api/base').replace(/\/+$/, '');
}
