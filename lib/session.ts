import { cookies } from 'next/headers';
import { OIDC_PATHS } from "@hanzo/iam/paths";

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://hanzo.id";
const IAM_USERINFO_URL = `${IAM_ENDPOINT}${OIDC_PATHS.userinfo}`;

/**
 * Get the current user session by verifying the auth token with Hanzo IAM.
 * Returns user info or null if not authenticated.
 */
export async function getUserSession() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('hanzo_token')?.value;

  if (!authToken) {
    return null;
  }

  try {
    const response = await fetch(IAM_USERINFO_URL, {
      headers: {
        Authorization: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const userInfo = await response.json();
    if (!userInfo || !userInfo.sub) {
      return null;
    }

    // Bare bearer (no "Bearer " prefix) so user-scoped backends — Commerce in
    // particular — can be called AS this user. Identity is forwarded, never a
    // shared service key. See lib/commerce.ts.
    const token = authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;

    return {
      id: userInfo.sub,
      name: userInfo.preferred_username || userInfo.name || userInfo.sub,
      fullname: userInfo.display_name || userInfo.name || userInfo.sub,
      email: userInfo.email,
      avatarUrl: userInfo.picture || "",
      token,
    };
  } catch (error) {
    console.error('Error verifying user session:', error);
    return null;
  }
}
