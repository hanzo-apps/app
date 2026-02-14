import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://iam.hanzo.ai";
const IAM_USERINFO_URL = `${IAM_ENDPOINT}/api/userinfo`;

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hanzo-auth-token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(IAM_USERINFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const info = await res.json();

    if (!info || !info.sub) {
      return NextResponse.json(
        { error: "Invalid user info" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: info.sub,
      name: info.preferred_username || info.name || info.sub,
      fullname: info.display_name || info.name || info.sub,
      email: info.email,
      username: info.preferred_username || info.name,
      avatarUrl: info.picture || "",
      isPro: false,
    });
  } catch (error) {
    console.error("Failed to fetch user info from IAM:", error);
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
