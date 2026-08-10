"use client";

import { useEffect } from "react";
import { read, write, apply, type Preference } from "@hanzo/appearance/state";

/**
 * Carries a person's appearance preference between their ACCOUNT and this device.
 *
 * @hanzo/appearance keeps the choice in localStorage (per browser) and the head
 * boot script paints it before first paint. This makes the ACCOUNT the source of
 * truth, so the same reading follows a person across devices and is editable from
 * the account page on hanzo.id and each white-label id host.
 *
 * On mount it reads the account preference. If one is stored it applies over this
 * device's cache; if the account has none but this device does, it seeds the
 * account from the device — so a look already chosen becomes the account look the
 * first time you sign in. After that every local change writes through, debounced.
 *
 * A guest, or a deployment with no confidential client, gets a benign 401/501 and
 * this does nothing: appearance stays pure-localStorage, exactly as before. There
 * is no onChange to subscribe to, so the write-through watches the one signal the
 * package emits — @hanzo/appearance mutates `<html>`'s inline style on every
 * change (accent, type and density all land there). This is the same signal
 * AccentSync observes.
 */
const ENDPOINT = "/v1/me/appearance";
const DEBOUNCE_MS = 800;

export function AppearanceSync() {
  useEffect(() => {
    let live = true;
    let account = false; // is there an account to sync to?
    let synced = ""; // JSON of the preference last known equal to the account
    let timer: ReturnType<typeof setTimeout> | undefined;

    const push = (p: Preference) => {
      synced = JSON.stringify(p);
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: synced,
      }).catch(() => {});
    };

    // 1. Adopt the account's stored preference, or seed it from this device.
    fetch(ENDPOINT, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live || !data?.ok) return; // guest / unconfigured → localStorage only
        account = true;
        const remote = (data.appearance ?? {}) as Preference;
        const local = read();
        if (Object.keys(remote).length > 0) {
          synced = JSON.stringify(remote);
          if (JSON.stringify(local) !== synced) {
            // Account wins on load. write() first so the boot script and read()
            // agree on the next reload; apply() lands it on this paint.
            write(remote);
            apply(remote);
          }
        } else if (Object.keys(local).length > 0) {
          push(local); // account empty, this device chose → seed it
        } else {
          synced = JSON.stringify({});
        }
      })
      .catch(() => {});

    // 2. Write local changes through to the account, debounced. @hanzo/appearance
    //    applies to <html> and then writes localStorage synchronously, so by the
    //    time the debounce fires, read() sees the new value. Applying the account
    //    value above also trips this observer, but read() then equals `synced`, so
    //    it does not echo back.
    const root = document.documentElement;
    const onMutate = () => {
      if (!account) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const local = read();
        if (JSON.stringify(local) === synced) return;
        push(local);
      }, DEBOUNCE_MS);
    };
    const observer = new MutationObserver(onMutate);
    observer.observe(root, { attributes: true, attributeFilter: ["style"] });

    return () => {
      live = false;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
