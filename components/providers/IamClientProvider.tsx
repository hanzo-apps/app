'use client';

import { useEffect } from 'react';
import { decodeJwt } from 'jose';
import { IamProvider, useIamToken, useIam } from '@hanzo/iam/react';
import { SESSION_COOKIE } from '@hanzo/iam/server';
import { iamConfig } from '@/lib/hanzo/iam';

/**
 * Project the SDK's token onto the cookie the server reads.
 *
 * A top-level document navigation carries cookies and nothing else, so a
 * navigation can only be authenticated by one. This writes the SDK's canonical
 * cookie ({@link SESSION_COOKIE}) and gives it the TOKEN'S OWN remaining
 * lifetime — the cookie cannot outlive what it carries, and it holds nothing the
 * token does not already say. It is a pipe, not a session: the server verifies
 * every read against IAM's JWKS (`lib/iam.ts`), so a stale or edited cookie
 * grants exactly nothing.
 *
 * The predecessor was a session: an app-named `hanzo_token` pinned to a flat
 * 7 days regardless of the token inside it, trusted server-side on an unverified
 * decode, and resurrected by this effect every time a logout route cleared it.
 */
function writeCookie(token: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  let maxAge = 0;
  if (token) {
    try {
      const exp = decodeJwt(token).exp ?? 0;
      maxAge = Math.max(0, Math.floor(exp - Date.now() / 1000));
    } catch {
      maxAge = 0; // not a JWT we can date ⇒ do not persist it
    }
  }
  const value = maxAge > 0 ? token : '';
  document.cookie = `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Keep that projection current — refresh-aware.
 *
 * A signed-in user's access token expires. Writing a stale token (→ 401) or
 * clearing on a transient expiry both read to the user as being logged out mid-
 * session. So: when the SDK's token isn't valid, `refresh()` first and project
 * the NEW token; clear only when refresh confirms there is no session at all.
 * Refresh needs a refresh token — see the `offline_access` scope in
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
