import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders, applyRateLimiting, getClientIP } from "@/lib/security/middleware";

const TOKEN_COOKIE = "hanzo_token";

// Routes that require authentication (prefix match).
// Login is gated only at the *build / save / deploy* step. The public catalog
// (/gallery, /templates/*, /new, /pricing) is a showcase and must browse
// without a token — auth is prompted when a visitor enters the builder (/dev).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/profile",
  "/billing",
  "/chat",
  "/dev",
];

// Routes that are always accessible without a token (exact or prefix match).
// The catalog/showcase surfaces live here so logged-out visitors can browse
// templates and previews; clicking "Launch/Build" sends them to /dev, which is
// protected, so the login prompt appears at build time — not before.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/callback",
  "/api/auth/logout",
  "/pricing",
  "/gallery",
  "/templates",
  "/new",
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
  const headers = new Headers(request.headers);
  headers.set("x-current-host", request.nextUrl.host);
  headers.set("x-client-ip", getClientIP(request));

  const path = request.nextUrl.pathname;

  // --- Rate limiting (unchanged) ---
  let rateLimitType: "auth" | "api" | "public" | "ai" | "payment" = "public";

  if (path.startsWith("/api/auth")) {
    rateLimitType = "auth";
  } else if (path.startsWith("/api/commerce")) {
    rateLimitType = "payment";
  } else if (path.startsWith("/api/ai") || path.startsWith("/api/ask-ai")) {
    rateLimitType = "ai";
  } else if (path.startsWith("/api")) {
    rateLimitType = "api";
  }

  const rateLimitResponse = await applyRateLimiting(request, rateLimitType);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // --- IAM token-based auth gate ---
  // Only enforce on protected routes; public routes and assets pass through.
  if (isProtectedRoute(path)) {
    const token = request.cookies.get(TOKEN_COOKIE);
    if (!token?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists – allow through. Server-side validation happens in lib/auth.ts.
  }

  const response = NextResponse.next({ headers });
  return applySecurityHeaders(response);
}

export const config = {
  // Match all routes except static assets, images, and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
