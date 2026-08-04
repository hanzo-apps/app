/** The user attributes worth carrying alongside the id, off the same OIDC claims
 *  `useUser` already reshaped to get it. A key is OMITTED rather than sent
 *  undefined, so an absent claim never blanks a trait an earlier identify set.
 *
 *  It lives here, and not in components/providers/analytics.tsx where it is
 *  used, because it is pure data-shaping: no React, no telemetry client, no
 *  environment. Importing the provider to reach it drags in the whole telemetry
 *  runtime — which is also why it could not be tested from there (@hanzogui/
 *  telemetry's env module reads `import.meta`, and Jest's CommonJS runtime
 *  cannot parse that at any transform setting). A pure function should be
 *  reachable without booting a subsystem. */
export function identityTraits(user: {
  email?: string;
  fullname?: string;
  name?: string;
}): Record<string, unknown> {
  const traits: Record<string, unknown> = {};
  if (user.email) traits.email = user.email;
  const name = user.fullname || user.name;
  if (name) traits.name = name;
  return traits;
}
