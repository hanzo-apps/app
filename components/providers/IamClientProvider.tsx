'use client';

import { useEffect } from 'react';
import { decodeJwt } from 'jose';
import { IamProvider, useIamToken, useIam } from '@hanzo/iam/react';
import { SESSION_COOKIE } from '@hanzo/iam/server';
import { iamConfig } from '@/lib/hanzo/iam';

/**
 * Project the SDK's token onto the cookie the server reads.
 *
 * A top-level document navigation carries cookies and nothing else, so that is
 * the only thing a navigation can be authenticated by. This writes the SDK's
 * canonical cookie ({@link SESSION_COOKIE}) and gives it the TOKEN'S OWN
 * remaining lifetime: the cookie cannot outlive what it carries, and it holds
 * nothing the token does not already say. A pipe, not a session — the server
 * verifies every read against IAM's JWKS (`lib/iam.ts`), so a stale or edited
 * cookie grants exactly nothing.
 *
 * Its predecessor WAS a session: an app-named cookie pinned to a flat 7 days
 * regardless of the token inside it, trusted server-side on an unverified
 * decode, and written straight back by this effect every time the app's own
 * logout route cleared it.
 */
export function cookieMaxAge(token: string): number {
  if (!token) return 0;
  try {
    const exp = decodeJwt(token).exp ?? 0;
    return Math.max(0, Math.floor(exp - Date.now() / 1000));
  } catch {
    return 0; // not a JWT we can date ⇒ do not persist it
  }
}

function writeCookie(token: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = cookieMaxAge(token);
  document.cookie = `${SESSION_COOKIE}=${maxAge > 0 ? token : ''}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Keep that projection current — refresh-aware.
 *
 * A signed-in user's access token expires. Writing a stale token (→ 401) and
 * clearing on a transient expiry both read to the user as being logged out
 * mid-session. So: when the SDK's token isn't valid, `refresh()` first and
 * project the NEW one; clear only when refresh confirms there is no session at
 * all. Refresh needs a refresh token — see `offline_access` in
 * `lib/hanzo/iam.ts`.
 */
function IamCookieBridge() {
  const { token, isValid, refresh } = useIamToken();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (token && isValid) {
        writeCookie(token);
        return;
      }
      try {
        const fresh = await refresh();
        if (cancelled) return;
        if (fresh) {
          writeCookie(fresh);
          return;
        }
      } catch {
        // no refresh token / refresh failed → fall through to clear
      }
      if (!cancelled) writeCookie('');
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
 * component can `useIam()` / `useUser()`. HIP-0111
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
