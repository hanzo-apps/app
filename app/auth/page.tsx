import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

/**
 * Legacy `/auth` entry. There is ONE login flow — the `@hanzo/iam` OAuth2 PKCE
 * redirect driven by `/login`. This route just forwards there so old links keep
 * working (the confidential server-side OAuth flow has been removed).
 */
export default function Auth() {
  redirect("/login");
}
