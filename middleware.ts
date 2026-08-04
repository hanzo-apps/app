import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@hanzo/iam/server";
import { applySecurityHeaders, applyRateLimiting } from "@/lib/security/middleware";

// Routes that require authentication (prefix match).
//
// THE RULE IS "IT DRAWS THE SIGNED-IN APP". Every route below mounts `AppShell`
// — the sidebar with Dashboard, Projects, Connectors, Settings — and that chrome
// is meaningless to someone who cannot open any of it. A signed-out visitor was
// shown the whole navigation wrapped around an empty page, because this list had
// seven entries while seventeen routes mounted the shell.
//
// A hand-kept list that has to track something else drifts, so it no longer has
// to be kept by hand: `tests/unit/protected-routes.test.ts` derives the set from
// the pages that import AppShell and fails when the two disagree. Add a shelled
// page and the test names the prefix to add — or says the page should not be
// wearing the shell, which is the other honest answer.
const PROTECTED_PREFIXES = [
  "/agents",
  "/billing",
  "/chat",
  "/connectors",
  "/dashboard",
  "/dev",
  "/profile",
  "/projects",
  "/settings",
  "/skills",
  "/usage",
  "/work",
];

// Routes that are always accessible without a token (exact or prefix match).
// `/auth/callback` is the ONE OAuth return (the `@hanzo/iam` PKCE callback);
// the legacy `/api/auth/*` login BFF has been removed.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/auth/callback",
  "/pricing",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // --- Rate limiting (unchanged) ---
  let rateLimitType: "auth" | "api" | "public" | "ai" | "payment" = "public";

  if (path.startsWith("/api/auth") || path.startsWith("/v1/auth")) {
    rateLimitType = "auth";
  } else if (path.startsWith("/api/commerce")) {
    rateLimitType = "payment";
  } else if (
    path.startsWith("/api/ai") ||
    path.startsWith("/v1/generate") ||
    path.startsWith("/v1/images")
  ) {
    rateLimitType = "ai";
  } else if (path.startsWith("/api")) {
    rateLimitType = "api";
  }

  const rateLimitResponse = await applyRateLimiting(request, rateLimitType);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // --- IAM token gate ---
  // A navigation carries cookies and nothing else, so this is the only signal
  // available at the edge. It is a LIVENESS check, not an authorization one: the
  // cookie is written with the token's own remaining lifetime
  // (IamClientProvider), so its presence means a live IAM token exists and an
  // expired session bounces to login instead of landing on a page whose every
  // call then 401s. Authorization is decided per request by `lib/iam.ts`, which
  // verifies the token against IAM's JWKS. Nothing here is ever trusted.
  if (isProtectedRoute(path)) {
    const token = request.cookies.get(SESSION_COOKIE);
    if (!token?.value) {
      const loginUrl = new URL("/login", request.url);
      // Preserve the full path AND query so a cross-surface deep link
      // (e.g. /dev?project=<slug>) survives the login bounce — the project scope
      // is otherwise lost for a logged-out user. loginRedirectDestination allows
      // a same-origin path with a query; only protocol-relative targets are rejected.
      loginUrl.searchParams.set("redirect", path + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    // A live token exists — verification happens per request in lib/iam.ts.
  }

  // `NextResponse.next({ headers })` sets RESPONSE headers — it does NOT forward
  // request headers to the route handler (that needs `{ request: { headers } }`).
  // So a cloned request-header set was echoed back on every response in the app:
  // `origin`, `host`, `user-agent`, `accept`, `x-forwarded-for`, `x-real-ip` and
  // — on a widget preflight — `access-control-request-method`, which reads like a
  // seventh CORS header while meaning nothing. The two headers it existed to add
  // (x-current-host, x-client-ip) never reached a handler and have no reader
  // anywhere in the repo, so the clone is deleted rather than corrected.
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  // Match all routes except static assets: _next internals AND public/ files
  // (template .webp thumbnails, logos, fonts, esbuild.wasm, edit.js …). Without
  // the extension guard every public/ asset burned the per-IP rate-limit budget —
  // one gallery page view ≈ dozens of "requests", so browsing (or the nightly
  // e2e) tripped 429s on pages that had loaded fine moments before.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|wasm|txt|xml|webmanifest|mp[34]|webm)$).*)",
  ],
};
