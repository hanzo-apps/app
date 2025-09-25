import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { applySecurityHeaders, applyRateLimiting, getClientIP } from "@/lib/security/middleware";

export async function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-current-host", request.nextUrl.host);
  headers.set("x-client-ip", getClientIP(request));

  // Apply rate limiting based on path
  const path = request.nextUrl.pathname;
  let rateLimitType: 'auth' | 'api' | 'public' | 'ai' | 'payment' = 'public';

  if (path.startsWith('/api/auth')) {
    rateLimitType = 'auth';
  } else if (path.startsWith('/api/stripe')) {
    rateLimitType = 'payment';
  } else if (path.startsWith('/api/ai') || path.startsWith('/api/ask-ai')) {
    rateLimitType = 'ai';
  } else if (path.startsWith('/api')) {
    rateLimitType = 'api';
  }

  const rateLimitResponse = await applyRateLimiting(request, rateLimitType);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // For local development, automatically set the token cookie
  if (process.env.HF_TOKEN === "local_dev_token") {
    const token = request.cookies.get(MY_TOKEN_KEY());
    if (!token || token.value !== "local_dev_token") {
      const response = NextResponse.next({ headers });
      response.cookies.set({
        name: MY_TOKEN_KEY(),
        value: "local_dev_token",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return applySecurityHeaders(response);
    }
  }

  const response = NextResponse.next({ headers });
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
