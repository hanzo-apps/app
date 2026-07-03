import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

/**
 * `/auth` — legacy login entry. There is ONE login path: the `@hanzo/iam` PKCE
 * SDK started from `/login` (registered `redirect_uri` = `/auth/callback`).
 * The old server flow here minted an authorize URL against the UNregistered
 * `/api/auth/callback` redirect_uri, which IAM rejects — bouncing the user back
 * unauthenticated. Funnel everything to the active path instead.
 */
export default function Auth() {
  redirect("/login");
}
