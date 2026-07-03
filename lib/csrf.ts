import type { NextRequest } from "next/server";

/**
 * Same-site guard for cookie-authenticated mutations (agent create/run, etc.).
 *
 * A browser sends `Origin` on every cross-origin (and same-origin) POST. If it
 * is present and its host is not our own, the request originates off-site —
 * refuse it. Absence of Origin means a non-browser caller with no ambient
 * cookie to abuse, so it is allowed through.
 */
export function isCrossSite(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
