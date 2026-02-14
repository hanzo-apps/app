"use server";

import { headers } from "next/headers";

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://iam.hanzo.ai";

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

  const loginRedirectUrl = `${IAM_ENDPOINT}/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect_uri}&response_type=code&scope=openid%20profile%20email&state=1234567890`;

  console.log('Auth URL generated:', loginRedirectUrl);
  return loginRedirectUrl;
}
