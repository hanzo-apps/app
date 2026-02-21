import { NextRequest, NextResponse } from "next/server";
import { validateBody, schemas } from "@/lib/security/input-validation";

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://iam.hanzo.ai";
const IAM_TOKEN_URL = `${IAM_ENDPOINT}/api/login/oauth/access_token`;
const IAM_USERINFO_URL = `${IAM_ENDPOINT}/api/userinfo`;

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(req, schemas.login);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.errors },
        { status: 400 }
      );
    }

    const { code } = validation.data;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const clientId = process.env.IAM_CLIENT_ID;
    const clientSecret = process.env.IAM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing IAM OAuth credentials");
      return NextResponse.json(
        { error: "OAuth configuration missing" },
        { status: 500 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const redirect_uri = `${appUrl}/api/auth/callback`;

    console.log("Auth attempt with redirect_uri:", redirect_uri);

    const request_auth = await fetch(IAM_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri,
      }),
    });

    const response = await request_auth.json();

    if (!response.access_token) {
      console.error("Failed to get access token:", response);
      return NextResponse.json(
        { error: response.error || "Failed to retrieve access token" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userResponse = await fetch(IAM_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${response.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to get user info:", userResponse.status);
      return NextResponse.json(
        { user: null, errCode: userResponse.status },
        { status: userResponse.status }
      );
    }

    const userInfo = await userResponse.json();
    const user = {
      id: userInfo.sub,
      name: userInfo.preferred_username || userInfo.name || userInfo.sub,
      fullname: userInfo.display_name || userInfo.name || userInfo.sub,
      email: userInfo.email,
      avatarUrl: userInfo.picture || "",
    };
    console.log("Login successful for user:", user.name);

    return NextResponse.json(
      {
        access_token: response.access_token,
        expires_in: response.expires_in,
        user,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
