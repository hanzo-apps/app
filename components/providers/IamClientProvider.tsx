'use client';

import { useEffect } from 'react';
import { IamProvider, useIamToken, useIam } from '@hanzo/iam/react';
import { iamConfig } from '@/lib/hanzo/iam';

const TOKEN_COOKIE = 'hanzo_token';

function writeCookie(value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Mirrors the SDK access token into the `hanzo_token` cookie — refresh-aware.
 *
 * The @hanzo/iam SDK owns the OAuth2 PKCE token lifecycle. Server route guards
 * (`lib/auth.ts`, `lib/session.ts`), the BFF routes (`/v1/generate`), and the
 * edge middleware read identity from the `hanzo_token` cookie. This bridge
 * reflects the SDK's *valid* token into that cookie so those consumers keep
 * working — one seam, no per-route changes.
 *
 * Why refresh-aware (the bug this fixes): a signed-in user's access token
 * expires after a while. The old bridge only read `token`; on expiry it wrote a
 * stale token (→ gateway 401) or, when the SDK returned null, CLEARED the cookie
 * — either way `/v1/generate` saw no valid identity and showed a logged-in user
 * the "Log In to use Hanzo for free" limit modal. Now: when the token isn't
 * valid we `refresh()` (refresh-token grant) and mirror the NEW token; we only
 * clear the cookie when refresh confirms there's no session (real sign-out),
 * never on a transient expiry. Refresh needs a refresh token — see the
 * `offline_access` scope in `lib/hanzo/iam.ts`.
 */
function IamCookieBridge() {
  const { token, isValid, refresh } = useIamToken();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // A valid token → mirror it (durable 7-day cookie so it survives reloads /
      // navigation; the edge gate + BFF read this cookie).
      if (token && isValid) {
        writeCookie(token, 604_800);
        return;
      }
      // Not valid (expired / not yet hydrated): try a silent refresh before
      // touching the cookie, so a transient expiry never logs the user out.
      try {
        const fresh = await refresh();
        if (cancelled) return;
        if (fresh) {
          writeCookie(fresh, 604_800);
          return;
        }
      } catch {
        // no refresh token / refresh failed → fall through to clear
      }
      // Confirmed no session (real sign-out) → clear.
      if (!cancelled) writeCookie('', 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, isValid, refresh]);

  return null;
}

/**
 * Belt-and-suspenders: proactively refresh the access token on an interval and
 * on tab-focus, so it never lapses mid-session (the modal-on-a-logged-in-user
 * bug). `getValidAccessToken` refreshes iff expired, so this is cheap when the
 * token is still good. Mounted alongside the cookie bridge.
 */
function IamTokenKeepAlive() {
  const iam = useIam();

  useEffect(() => {
    const sdk = (iam as { sdk?: { getValidAccessToken?: () => Promise<string | null> } })?.sdk;
    if (!sdk?.getValidAccessToken) return;
    const tick = () => {
      void sdk.getValidAccessToken?.().catch(() => {});
    };
    const id = window.setInterval(tick, 4 * 60_000); // every 4 min (tokens ~ short-lived)
    const onFocus = () => tick();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [iam]);

  return null;
}

/**
 * Root Hanzo IAM provider. Mounts the @hanzo/iam context so every client
 * component can `useIam()` / `useAuthContext()` / `useUser()`. HIP-0111
 * canonical — the config supplies an explicit SSR-safe storage shim.
 */
export default function IamClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <IamProvider config={iamConfig}>
      <IamCookieBridge />
      <IamTokenKeepAlive />
      {children}
    </IamProvider>
  );
}
