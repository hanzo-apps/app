import { NextRequest, NextResponse } from "next/server";

const IAM_TOKEN_URL = "https://iam.hanzo.ai/api/login/oauth/access_token";
const COOKIE_NAME = "hanzo_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  const clientId = process.env.IAM_CLIENT_ID;
  const clientSecret = process.env.IAM_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    console.error("Missing IAM OAuth configuration:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasAppUrl: !!appUrl,
    });
    return NextResponse.json(
      { error: "OAuth configuration missing" },
      { status: 500 }
    );
  }

  const redirectUri = `${appUrl}/api/auth/callback`;

  try {
    const tokenResponse = await fetch(IAM_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("IAM token exchange failed:", tokenResponse.status, errorText);
      return NextResponse.json(
        { error: "Token exchange failed" },
        { status: 502 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("No access_token in IAM response:", tokenData);
      return NextResponse.json(
        { error: "Failed to retrieve access token" },
        { status: 502 }
      );
    }

    const response = NextResponse.redirect(new URL("/dashboard", appUrl));

    response.cookies.set({
      name: COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("IAM OAuth callback error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
