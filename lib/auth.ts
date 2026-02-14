import { User } from "@/types";
import { cookies, headers } from "next/headers";
import MY_TOKEN_KEY from "./get-cookie-name";

// Hanzo IAM OIDC configuration
const IAM_ENDPOINT = process.env.IAM_ENDPOINT || "https://iam.hanzo.ai";
const IAM_USERINFO_URL = `${IAM_ENDPOINT}/api/userinfo`;
const IAM_INTROSPECT_URL = `${IAM_ENDPOINT}/api/login/oauth/introspect`;
const IAM_CLIENT_ID = process.env.IAM_CLIENT_ID || "";
const IAM_CLIENT_SECRET = process.env.IAM_CLIENT_SECRET || "";

// IAM userinfo response shape (OIDC standard + IAM extensions)
interface IamUserInfo {
  sub: string;            // unique user id
  name: string;           // username / login name
  preferred_username?: string;
  display_name?: string;  // IAM extension
  email?: string;
  picture?: string;       // avatar URL
  phone?: string;
  address?: string;
}

// UserResponse = type User & { token: string };
type UserResponse = User & { token: string };

/**
 * Validate a token against Hanzo IAM OIDC userinfo endpoint.
 * Returns the user profile or undefined on failure.
 */
async function fetchIamUser(accessToken: string): Promise<IamUserInfo | undefined> {
  try {
    const response = await fetch(IAM_USERINFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // Revalidate every 5 minutes to avoid stale sessions
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.log("IAM userinfo response not OK:", response.status);
      return undefined;
    }

    const userInfo: IamUserInfo = await response.json();

    if (!userInfo || !userInfo.sub) {
      console.log("Invalid userinfo received from IAM:", userInfo);
      return undefined;
    }

    return userInfo;
  } catch (error) {
    console.error("IAM userinfo fetch error:", error);
    return undefined;
  }
}

/**
 * Optionally introspect a token for active/inactive status.
 * Useful when you need to check token validity without fetching full profile.
 */
async function introspectToken(token: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({
      token,
      token_type_hint: "access_token",
      client_id: IAM_CLIENT_ID,
      client_secret: IAM_CLIENT_SECRET,
    });

    const response = await fetch(IAM_INTROSPECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.active === true;
  } catch {
    return false;
  }
}

/**
 * Map IAM user fields to our User type.
 */
function mapIamUser(info: IamUserInfo, token: string): UserResponse {
  return {
    id: info.sub,
    name: info.preferred_username || info.name || info.sub,
    fullname: info.display_name || info.name || info.sub,
    email: info.email,
    username: info.preferred_username || info.name,
    avatarUrl: info.picture || "",
    isPro: false, // Determine from IAM roles/groups if needed
    token,
  };
}

export const isAuthenticated = async (): Promise<UserResponse | undefined> => {
  const authHeaders = await headers();
  const cookieStore = await cookies();

  // Check if request is from localhost - allow without auth for operational simplicity
  const host = authHeaders.get("host") || "";
  const origin = authHeaders.get("origin") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") ||
                      origin.includes("localhost") || origin.includes("127.0.0.1");

  if (isLocalhost && process.env.NODE_ENV === "development") {
    console.log("Local access detected - bypassing authentication");
    // Return a mock local user for development
    return {
      id: "local-dev-user",
      name: "Local Developer",
      fullname: "Local Development User",
      avatarUrl: "",
      isPro: true,
      isLocalUse: true,
      token: "local-dev-token",
    };
  }

  // For production or non-localhost, check for API key or IAM token
  const cookieToken = cookieStore.get(MY_TOKEN_KEY())?.value;
  const headerToken = authHeaders.get("Authorization");
  const localApiKey = authHeaders.get("X-Local-API-Key") || process.env.LOCAL_API_KEY;

  // Allow access with local API key for hanzod
  if (localApiKey && localApiKey === process.env.LOCAL_API_KEY) {
    console.log("Local API key authentication successful");
    return {
      id: "api-user",
      name: "API User",
      fullname: "Hanzo API User",
      avatarUrl: "",
      isPro: true,
      isLocalUse: true,
      token: localApiKey,
    };
  }

  // Extract raw access token from either cookie or Authorization header
  let rawToken: string | undefined;

  if (cookieToken) {
    rawToken = cookieToken;
  } else if (headerToken) {
    // Strip "Bearer " prefix if present
    rawToken = headerToken.startsWith("Bearer ")
      ? headerToken.slice(7)
      : headerToken;
  }

  if (!rawToken) {
    console.log("Auth failed: No token found and not localhost");
    return undefined;
  }

  console.log("Verifying token with Hanzo IAM (iam.hanzo.ai)...");

  // Validate via OIDC userinfo endpoint
  const userInfo = await fetchIamUser(rawToken);
  if (!userInfo) {
    return undefined;
  }

  console.log("Auth successful for user:", userInfo.name || userInfo.sub);
  return mapIamUser(userInfo, rawToken);
};

export { introspectToken, fetchIamUser };
