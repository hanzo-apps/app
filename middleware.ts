import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders, applyRateLimiting, getClientIP } from "@/lib/security/middleware";

const TOKEN_COOKIE = "hanzo_token";

// Routes that require authentication (prefix match).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/profile",
  "/billing",
  "/chat",
  "/dev",
  "/gallery",
];

// Routes that are always accessible without a token (exact or prefix match).
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/callback",
  "/api/auth/logout",
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
  const headers = new Headers(request.headers);
  headers.set("x-current-host", request.nextUrl.host);
  headers.set("x-client-ip", getClientIP(request));

  const path = request.nextUrl.pathname;

  // --- Rate limiting (unchanged) ---
  let rateLimitType: "auth" | "api" | "public" | "ai" | "payment" = "public";

  if (path.startsWith("/api/auth")) {
    rateLimitType = "auth";
  } else if (path.startsWith("/api/stripe")) {
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
