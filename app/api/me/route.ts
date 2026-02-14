import { headers } from "next/headers";
import { NextResponse } from "next/server";

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://iam.hanzo.ai";
const IAM_USERINFO_URL = `${IAM_ENDPOINT}/api/userinfo`;

export async function GET() {
  const authHeaders = await headers();
  const token = authHeaders.get("Authorization");
  if (!token) {
    return NextResponse.json({ user: null, errCode: 401 }, { status: 401 });
  }

  // Handle local development mode
  const host = authHeaders.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  if (isLocalhost && process.env.NODE_ENV === "development") {
    const localUser = {
      id: "local-user",
      name: "local-user",
      fullname: "Local Development User",
      avatarUrl: "/logo.svg",
      isPro: true,
      isLocalUse: true
    };
    return NextResponse.json({ user: localUser, errCode: null }, { status: 200 });
  }

  const rawToken = token.startsWith("Bearer ") ? token.slice(7) : token;

  const userResponse = await fetch(IAM_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${rawToken}`,
    },
  });

  if (!userResponse.ok) {
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
    isPro: false,
  };
  return NextResponse.json({ user, errCode: null }, { status: 200 });
}
