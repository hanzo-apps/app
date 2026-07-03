/**
 * Post-login redirect destination.
 *
 * `openLoginWindow` stashes the pre-login pathname in `redirectAfterLogin` so a
 * user lands back where they started. But the OAuth entry points (`/`, `/login`,
 * `/signup`) and the callback itself are never sensible destinations — returning
 * there would bounce the user straight back into the auth flow. In those cases
 * (or no stored path) we send them to the workspace dashboard.
 *
 * Pure + framework-free so the redirect contract is unit-tested without a DOM.
 */
const NON_DESTINATIONS = new Set(["/", "/login", "/signup", "/auth/callback"]);

export const DEFAULT_DESTINATION = "/dashboard";

export function loginRedirectDestination(
  stored: string | null | undefined
): string {
  // Same-origin absolute paths only. Reject protocol-relative (`//host`,
  // `/\host`) targets — they start with `/` but navigate off-origin (open
  // redirect). Everything must be a single-slash in-app path.
  if (
    !stored ||
    !stored.startsWith("/") ||
    stored.startsWith("//") ||
    stored.startsWith("/\\") ||
    NON_DESTINATIONS.has(stored)
  ) {
    return DEFAULT_DESTINATION;
  }
  return stored;
}
