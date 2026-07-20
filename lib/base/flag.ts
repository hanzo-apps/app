/**
 * Base backend flag — whether the app being built gets a Hanzo Base data plane.
 *
 * ONE value, ONE place: the composer toggle writes it, the builder reads it on
 * every /v1/generate call (`base: true` → the Base wiring rides the system
 * prompt) and provisions the per-app Base on publish. Default ON — a new app
 * ships with real persistence unless the user opts out.
 */

const KEY = 'initialBase';

export function baseEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function setBaseEnabled(on: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // storage unavailable — the default (on) applies
  }
}
