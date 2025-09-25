import { NextRequest, NextResponse } from "next/server";
import { validateBody, schemas } from "@/lib/security/input-validation";
import { env } from "@/lib/security/env-validation";

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

    // Use validated environment variables
    const clientId = env.HF_CLIENT_ID;
    const clientSecret = env.HF_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing HF OAuth credentials");
      return NextResponse.json(
        { error: "OAuth configuration missing" },
        { status: 500 }
      );
    }

    const Authorization = `Basic ${Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64")}`;

    const host =
      req.headers.get("host") ?? req.headers.get("origin") ?? "localhost:3000";

    const url = host.includes("/spaces/enzostvs")
      ? "hanzo.ai"
      : host;
    const redirect_uri =
      `${host.includes("localhost") ? "http://" : "https://"}` +
      url +
      "/auth/callback";

    console.log("Auth attempt with redirect_uri:", redirect_uri);

    const request_auth = await fetch("https://huggingface.co/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
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

    const userResponse = await fetch("https://huggingface.co/api/whoami-v2", {
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

    const user = await userResponse.json();
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
