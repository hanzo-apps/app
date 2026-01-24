import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hanzo-auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: "No token found" },
        { status: 401 }
      );
    }

    // Decode the simple token (base64 encoded email:timestamp)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, timestamp] = decoded.split(':');

      if (!email || !timestamp) {
        return NextResponse.json(
          { authenticated: false, message: "Invalid token format" },
          { status: 401 }
        );
      }

      // Check if token is expired (7 days)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

      if (tokenAge > maxAge) {
        return NextResponse.json(
          { authenticated: false, message: "Token expired" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          authenticated: true,
          user: {
            id: 'admin',
            fullname: 'Admin',
            name: 'Admin',
            email: email,
            avatarUrl: '',
            isPro: true,
          },
        },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { authenticated: false, message: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, message: "Authentication check failed" },
      { status: 500 }
    );
  }
}
