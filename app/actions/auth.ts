"use server";

import { headers, cookies } from "next/headers";

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://hanzo.id";
const OAUTH_STATE_COOKIE = "hanzo_oauth_state";

export async function getAuth() {
  const authList = await headers();
  const host = authList.get("host") ?? "localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    `${host.includes("localhost") ? "http://" : "https://"}${host}`;
  const redirect_uri = `${appUrl}/api/auth/callback`;

  const clientId = process.env.NEXT_PUBLIC_IAM_CLIENT_ID || process.env.IAM_CLIENT_ID;

  if (!clientId) {
    console.error('OAuth client ID not found in environment variables');
    throw new Error('OAuth configuration missing');
  }

  // Generate cryptographically random state to prevent CSRF
  const state = crypto.randomUUID();

  // Store state in a short-lived httpOnly cookie for validation on callback
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes — enough time to complete login
  });

  const loginRedirectUrl = `${IAM_ENDPOINT}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect_uri}&response_type=code&scope=openid%20profile%20email&state=${state}`;

  return loginRedirectUrl;
}
