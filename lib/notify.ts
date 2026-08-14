/**
 * Build notifications — the browser's own, asked for once, fired only when
 * they can be heard.
 *
 * A build takes long enough that people switch tabs, and a finished build in a
 * background tab is silent: the thread updates where nobody is looking. The
 * Web Notification is the one channel that reaches the other tab, and it costs
 * a permission — so this module owns the WHOLE contract in one place:
 *
 *   ask once      the banner shows only while permission is undecided and the
 *                 person has not dismissed it. Denied is a decision; a banner
 *                 that keeps asking after "no" is nagging, and the browser
 *                 would refuse the re-ask anyway.
 *   fire rarely   a notification while the tab is VISIBLE is noise — the
 *                 thread already shows the result better. Only a hidden tab
 *                 gets one, and clicking it focuses the tab it came from.
 *
 * Everything is guarded for absence: `Notification` does not exist on iOS
 * Safari outside an installed PWA, and none of this runs on the server.
 */

const DISMISSED = "hanzo.notify.dismissed";

/** Whether this browser has the API at all. */
export function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** True while the ask is still worth making: undecided, and not waved away. */
export function canAsk(): boolean {
  if (!supported() || Notification.permission !== "default") return false;
  try {
    return localStorage.getItem(DISMISSED) !== "1";
  } catch {
    return true;
  }
}

/** The ✕ on the banner. Remembered, because re-asking after "go away" is worse
 *  than never asking. */
export function dismiss(): void {
  try {
    localStorage.setItem(DISMISSED, "1");
  } catch {
    // Storage refused (private mode quota) — the banner returns next visit,
    // which is the least-wrong failure available.
  }
}

/** The Enable button. Resolves true when granted. */
export async function enable(): Promise<boolean> {
  if (!supported()) return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/**
 * Say that a build settled — if and only if nobody is looking at the tab.
 *
 * `document.hidden` at FIRE time, not at start time: the person may leave
 * mid-build, which is exactly the case this exists for.
 */
export function notifySettled(ok: boolean, body: string): void {
  if (!supported() || Notification.permission !== "granted") return;
  if (typeof document === "undefined" || !document.hidden) return;
  try {
    const n = new Notification(ok ? "Build finished" : "Build failed", {
      body: body.slice(0, 160),
      icon: "/apple-icon.png",
      tag: "hanzo-build", // one per tab, newest wins — never a pile
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // A refused constructor (some webviews) must never break the turn that
    // triggered it — the thread already carries the result.
  }
}
