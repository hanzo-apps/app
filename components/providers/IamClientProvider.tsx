'use client';

import { useEffect } from 'react';
import { IamProvider, useIamToken } from '@hanzo/iam/react';
import { iamConfig } from '@/lib/hanzo/iam';

const TOKEN_COOKIE = 'hanzo_token';

/**
 * Mirrors the SDK access token into the `hanzo_token` cookie.
 *
 * The @hanzo/iam SDK is the single owner of the OAuth2 PKCE token (kept in
 * sessionStorage). Server-side route guards (`lib/auth.ts`, `lib/session.ts`)
 * and the edge middleware read identity from the `hanzo_token` cookie or an
 * `Authorization: Bearer` header. This bridge keeps those server consumers
 * working unchanged by reflecting the SDK token into that cookie on login and
 * clearing it on logout — one seam, no per-route changes.
 *
 * The cookie is a plain (JS-readable) session cookie, intentionally: the
 * token already lives in the browser, and the edge gate only needs presence.
 */
function IamCookieBridge() {
  const { token } = useIamToken();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    if (token) {
      // Durable (7-day) cookie, not a session cookie: server route guards +
      // edge middleware read identity from this cookie, so it must outlive a
      // tab close / reload to keep the user signed in after navigation.
      document.cookie = `${TOKEN_COOKIE}=${token}; Path=/; Max-Age=604800; SameSite=Lax${secure}`;
    } else {
      document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    }
  }, [token]);

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
      {children}
    </IamProvider>
  );
}
