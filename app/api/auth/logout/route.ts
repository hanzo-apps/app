import { NextRequest, NextResponse } from "next/server";

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://hanzo.id";
const COOKIE_NAME = "hanzo_token";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  // Build IAM SSO logout URL with post-logout redirect
  const logoutUrl = new URL(`${IAM_ENDPOINT}/oauth/logout`);
  logoutUrl.searchParams.set("post_logout_redirect_uri", appUrl);

  const response = NextResponse.redirect(logoutUrl.toString());

  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function POST(req: NextRequest) {
  return GET(req);
}
