import { cookies } from 'next/headers';

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://iam.hanzo.ai";
const IAM_USERINFO_URL = `${IAM_ENDPOINT}/api/userinfo`;

/**
 * Get the current user session by verifying the auth token with Hanzo IAM.
 * Returns user info or null if not authenticated.
 */
export async function getUserSession() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('hanzo-auth-token')?.value;

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

    return {
      id: userInfo.sub,
      name: userInfo.preferred_username || userInfo.name || userInfo.sub,
      fullname: userInfo.display_name || userInfo.name || userInfo.sub,
      email: userInfo.email,
      avatarUrl: userInfo.picture || "",
    };
  } catch (error) {
    console.error('Error verifying user session:', error);
    return null;
  }
}
