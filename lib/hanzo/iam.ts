import type { IAM, IAMConfig } from '@hanzo/iam/browser';

/**
 * Canonical Hanzo IAM config (HIP-0111).
 *
 * One way: the `@hanzo/iam` SDK against the canonical OIDC endpoints via
 * discovery. hanzo brand → serverUrl `hanzo.id` (the per-brand OIDC issuer —
 * hanzo.id/lux.id/zoo.id/pars.id each self-issue; hanzo.id serves
 * `/.well-known` + `/v1/iam/*`); client_id `<org>-<app>` = `hanzo-app`. PKCE
 * S256, public client (no secret). No legacy `/oauth/*`, no `/api/`, no
 * hand-rolled OAuth. (Token `iss` becomes `hanzo.id` once IAM discovery is
 * flipped host-relative — empty `originFrontend`, HIP-0111 — do those together.)
 *
 * Mirrors hanzo.ai's `lib/hanzo/iam.ts` — the same composition every Hanzo
 * surface (chat, console, hanzo.ai) now ships.
 */
const SERVER_URL = process.env.NEXT_PUBLIC_HANZO_IAM_URL || 'https://hanzo.id';
const CLIENT_ID = process.env.NEXT_PUBLIC_HANZO_CLIENT_ID || 'hanzo-app';
const REDIRECT_URI =
  process.env.NEXT_PUBLIC_HANZO_REDIRECT_URI ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'https://hanzo.app/auth/callback');

/**
 * In-memory Storage shim. The SDK constructor falls back to bare
 * `sessionStorage` when none is provided — a ReferenceError during SSR /
 * prerender (no DOM). Passing an explicit storage keeps the SDK from ever
 * touching a global that doesn't exist on the server.
 */
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, String(v));
    },
  };
}

export const iamConfig: IAMConfig = {
  serverUrl: SERVER_URL,
  clientId: CLIENT_ID,
  appName: 'hanzo-app',
  redirectUri: REDIRECT_URI,
  // `offline_access` requests a REFRESH token so the SDK can silently renew the
  // access token when it expires — without it a long session lapses and a
  // logged-in user gets bounced to the "Log In to use Hanzo for free" modal.
  scope: 'openid profile email offline_access',
  // localStorage (not sessionStorage): the PKCE verifier/state and the
  // resulting tokens must survive the cross-site round-trip to hanzo.id and
  // any reload / new tab, so the session persists after "Go to Dashboard".
  // sessionStorage is per-tab and is the reason the app dropped back to
  // "Sign In" after the OAuth redirect.
  storage: typeof window !== 'undefined' ? window.localStorage : memoryStorage(),
};

/* -------------------------------------------------------------------------- */
/* Social provider linking — popup + postMessage (HIP-0111, one way)          */
/* -------------------------------------------------------------------------- */

/** A social provider we can OAuth-link to the signed-in hanzo.id account. */
export type LinkableProvider = 'github' | 'gitlab';

/** postMessage `type` our `/auth/callback` posts to the opener when a link popup returns. */
export const IAM_LINK_MESSAGE = 'hanzo-iam-link';

/**
 * Sentinel (shared same-origin localStorage) marking an in-flight link popup.
 * The popup's `/auth/callback` load reads this (plus `window.opener`) to know it
 * must signal + close instead of running the normal top-level login redirect.
 */
const LINK_SENTINEL_KEY = 'hanzo:link-popup';

/** IAM origin, for validating IAM's own `loginSuccess`/`windowClosed` popup messages. */
function iamOrigin(): string {
  try {
    return new URL(SERVER_URL).origin;
  } catch {
    return 'https://hanzo.id';
  }
}

/**
 * Link a social provider to the signed-in hanzo.id account in a popup.
 *
 * The canonical, SDK-built flow (HIP-0111: no hand-rolled OAuth URL). The
 * authorize URL — PKCE, OIDC discovery, and the app's REGISTERED `/auth/callback`
 * redirect_uri — is built entirely by the SDK engine (`getSigninUrl`); we only
 * add the `provider` hint (IAM auto-hops straight to the provider's chooser) and
 * `method=link` (Casdoor's account-link method, encoded into the OAuth state).
 * The redirect_uri is the app's own `/auth/callback` (registered for `hanzo-app`)
 * — NEVER IAM's own `/callback`, which the app can't register and which is the
 * source of the "Redirect URI … doesn't exist in the allowed list" error.
 *
 * IAM runs the provider OAuth hop, links the identity to the current session
 * user (storing `oauth_<Provider>_accessToken`), then the popup returns to
 * `/auth/callback`, which posts {@link IAM_LINK_MESSAGE} and closes. We also
 * accept IAM's native `loginSuccess` popup message and a manual popup-close as
 * terminal signals, so the caller can always re-check state afterward.
 *
 * Resolves `true` on a signalled success, `false` if the popup was blocked or
 * closed without a success signal. The caller should re-fetch its connected
 * accounts either way — a manual close can still follow a server-side link.
 */
export async function linkProvider(sdk: IAM, provider: LinkableProvider): Promise<boolean> {
  // Canonical authorize URL. `provider` makes IAM hop straight to the provider;
  // `method=link` selects the account-link flow (linked to the session user).
  const url = await sdk.getSigninUrl({ additionalParams: { provider, method: 'link' } });

  const width = 980;
  const height = 760;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const popup = window.open(
    url,
    `hanzo_link_${provider}`,
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`,
  );

  if (!popup) {
    // Popup blocked — open a foreground tab so the user is never dead-ended. The
    // caller's focus/visibility refetch picks up the link on return.
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }

  // Mark the in-flight link so the popup's `/auth/callback` signals + closes
  // instead of running the login redirect. Set only now that a real popup owns
  // it — a blocked fallback tab has no opener and must NOT carry the sentinel.
  try {
    window.localStorage.setItem(LINK_SENTINEL_KEY, provider);
  } catch {
    /* storage unavailable — the `window.opener` guard still gates the callback */
  }

  const selfOrigin = window.location.origin;
  const idp = iamOrigin();

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      window.clearInterval(poll);
      try {
        window.localStorage.removeItem(LINK_SENTINEL_KEY);
      } catch {
        /* ignore */
      }
      try {
        if (!popup.closed) popup.close();
      } catch {
        /* cross-origin / already closed */
      }
      resolve(ok);
    };

    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: unknown; ok?: unknown } | null;
      if (!data || typeof data.type !== 'string') return;
      // Our own `/auth/callback` link signal (same-origin).
      if (e.origin === selfOrigin && data.type === IAM_LINK_MESSAGE) {
        finish(data.ok !== false);
        return;
      }
      // IAM's native popup signals (from the IAM origin).
      if (e.origin === idp) {
        if (data.type === 'loginSuccess') finish(true);
        else if (data.type === 'windowClosed') finish(false);
      }
    };
    window.addEventListener('message', onMessage);

    // Fallback: the user closed the popup manually (IAM's link branch can stay
    // inside IAM after linking). Resolve so the caller re-checks; the message
    // path wins if it already fired (`finish` is idempotent).
    const poll = window.setInterval(() => {
      if (popup.closed) finish(false);
    }, 400);
  });
}

/**
 * True when the current `/auth/callback` load is the return leg of a link popup
 * opened by {@link linkProvider}: it runs inside a child window (`window.opener`
 * present) with our sentinel set. A normal login is a top-level redirect with no
 * opener, so this cleanly distinguishes the two — the callback must signal+close
 * for a link, and redirect for a login.
 */
export function isLinkPopupReturn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      Boolean(window.opener) &&
      window.opener !== window &&
      window.localStorage.getItem(LINK_SENTINEL_KEY) !== null
    );
  } catch {
    return false;
  }
}

/**
 * Finish a link popup: tell the opener whether the link succeeded, clear the
 * sentinel, and close the window. Called by `/auth/callback` on the return leg.
 * `ok` is false only when IAM handed back an explicit `error`.
 */
export function finishLinkPopup(ok: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LINK_SENTINEL_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.opener?.postMessage({ type: IAM_LINK_MESSAGE, ok }, window.location.origin);
  } catch {
    /* opener gone */
  }
  // Give the message a beat to be delivered before closing the window.
  window.setTimeout(() => {
    try {
      window.close();
    } catch {
      /* ignore */
    }
  }, 150);
}
