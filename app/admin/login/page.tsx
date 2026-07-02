import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

/**
 * Admin sign-in. HIP-0111: Hanzo IAM owns every credential interaction — there
 * is no local password form. This forwards to the ONE OAuth2 PKCE login
 * (`/login`, driven by `@hanzo/iam`); the admin area authorizes on the signed-in
 * IAM identity. The previous password POST hit the now-removed confidential
 * OAuth route and no longer had a backend.
 */
export default function AdminLogin() {
  redirect("/login");
}
