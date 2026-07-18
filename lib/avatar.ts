/**
 * Avatar helpers — the shared, transport-free vocabulary for turning an org or a
 * user into a real identity mark instead of a bland initial.
 *
 * Two concerns, one place (DRY):
 *  - ORG logo resolution: a server-supplied `logo` (image URL or emoji), a
 *    client-side emoji override (localStorage, until `/v1/orgs` carries `logo`),
 *    and a tiny stopgap defaults map — resolved in one priority order so every
 *    surface (OrgSwitcher, account menu) renders the same mark.
 *  - USER gravatar fallback: a dependency-free MD5 of the email → the Gravatar
 *    URL, so a signed-in user with no IAM `picture` still gets their own face
 *    (falling back to the initial when they have no gravatar, via `d=404`).
 *
 * No dependencies: MD5 is inlined (Gravatar hashes the email with MD5, and Web
 * Crypto has no MD5), and emoji/URL detection is a couple of regexes.
 */

/* ------------------------------------------------------------------ *
 * Emoji / URL detection
 * ------------------------------------------------------------------ */

/**
 * True when `s` reads as an emoji mark (not an initial or a slug): 1–3 code
 * points, at least one Extended_Pictographic, and no ASCII letters/digits.
 * "Good enough" per the spec — covers single glyphs and simple flags/joins.
 */
export function isEmoji(s: string): boolean {
  const t = (s || '').trim();
  if (!t) return false;
  if (/[A-Za-z0-9]/.test(t)) return false; // letters/digits ⇒ initial/slug, not emoji
  const points = [...t]; // spread iterates by code point (Unicode-aware)
  if (points.length < 1 || points.length > 3) return false;
  return /\p{Extended_Pictographic}/u.test(t);
}

/** True when `s` is a renderable image reference (http(s) URL or data:image). */
export function isImageUrl(s: string): boolean {
  const t = (s || '').trim();
  return /^https?:\/\//i.test(t) || /^data:image\//i.test(t);
}

/* ------------------------------------------------------------------ *
 * Org logo resolution — override › server › default › (initial)
 * ------------------------------------------------------------------ */

/**
 * Known org marks — a STOPGAP until IAM's org `logo` flows through `/v1/orgs`.
 * Consulted AFTER a user override and any server logo, BEFORE the initial
 * fallback. Keyed by the org slug (lowercased). Keep this tiny.
 */
export const ORG_LOGO_DEFAULTS: Readonly<Record<string, string>> = {
  maxpower: '⚡',
};

const OVERRIDE_PREFIX = 'orgLogo:';

/** localStorage key for an org's client-side logo override (slug-normalized). */
function overrideKey(name: string): string {
  return OVERRIDE_PREFIX + (name || '').trim().toLowerCase();
}

/**
 * The user's client-side emoji override for org `name`, or '' when unset.
 * A stopgap the OrgSwitcher writes and OrgAvatar reads FIRST, so a user can set
 * "their org emoji" today — retired once `/v1/orgs` carries a real `logo`.
 * `name` may be the slug or the (title-cased) display name — they normalize to
 * the same key (`orgDisplayName` is exactly `titleCase(slug)`).
 */
export function readOrgLogoOverride(name: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(overrideKey(name)) || '';
  } catch {
    return ''; // storage blocked (private mode) — no override
  }
}

/** Persist (or, with an empty value, clear) the emoji override for org `name`. */
export function setOrgLogoOverride(name: string, logo: string): void {
  if (typeof window === 'undefined') return;
  try {
    const v = (logo || '').trim();
    if (v) window.localStorage.setItem(overrideKey(name), v);
    else window.localStorage.removeItem(overrideKey(name));
  } catch {
    // storage blocked — the override simply doesn't persist
  }
}

/**
 * The logo mark to render for org `name`, in priority order:
 *   1. the user's client-side override (localStorage),
 *   2. the server-supplied `logo` from `/v1/orgs` (image URL or emoji),
 *   3. a known stopgap default (e.g. `maxpower` → ⚡),
 *   4. `undefined` — the caller renders the org's initial.
 * Returns an image URL, an emoji, or undefined — the caller inspects which via
 * `isImageUrl` / `isEmoji`.
 */
export function resolveOrgLogo(name: string, serverLogo?: string): string | undefined {
  const override = readOrgLogoOverride(name);
  if (override) return override;
  const server = (serverLogo || '').trim();
  if (server) return server;
  const fallback = ORG_LOGO_DEFAULTS[(name || '').trim().toLowerCase()];
  if (fallback) return fallback;
  return undefined;
}

/* ------------------------------------------------------------------ *
 * Gravatar (user fallback) — MD5(email) → URL
 * ------------------------------------------------------------------ */

/**
 * The Gravatar URL for `email`. `d=404` means "no gravatar for this email → 404"
 * so the caller's `<img onError>` / Radix `AvatarFallback` swaps to the initial.
 */
export function gravatarUrl(email: string, size = 64): string {
  const hash = md5((email || '').trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=404&s=${size}`;
}

/* ------------------------------------------------------------------ *
 * MD5 (RFC 1321) — dependency-free, for Gravatar hashing ONLY (not security).
 * Ported from the public-domain Paul Johnston / Joseph Myers reference
 * implementation; verified against known vectors in lib/avatar.test.ts.
 * ------------------------------------------------------------------ */

function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xffff);
}

function bitRol(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
  return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}
function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & c) | (~b & d), a, b, x, s, t);
}
function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
}
function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

function binlMd5(x: number[], len: number): number[] {
  x[len >> 5] |= 0x80 << len % 32;
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }
  return [a, b, c, d];
}

/** Raw (byte-string) → array of little-endian 32-bit words. */
function rstr2binl(input: string): number[] {
  const output: number[] = [];
  for (let i = 0; i < input.length * 8; i += 8) {
    output[i >> 5] = (output[i >> 5] || 0) | ((input.charCodeAt(i / 8) & 0xff) << i % 32);
  }
  return output;
}

/** Array of little-endian 32-bit words → raw (byte-string). */
function binl2rstr(input: number[]): string {
  let output = '';
  for (let i = 0; i < input.length * 32; i += 8) {
    output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff);
  }
  return output;
}

/** UTF-16 string → UTF-8 byte-string (so multibyte emails hash correctly). */
function str2rstrUtf8(input: string): string {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    let x = input.charCodeAt(i);
    const y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if (x >= 0xd800 && x <= 0xdbff && y >= 0xdc00 && y <= 0xdfff) {
      x = 0x10000 + ((x & 0x03ff) << 10) + (y & 0x03ff);
      i++;
    }
    if (x <= 0x7f) {
      output += String.fromCharCode(x);
    } else if (x <= 0x7ff) {
      output += String.fromCharCode(0xc0 | ((x >>> 6) & 0x1f), 0x80 | (x & 0x3f));
    } else if (x <= 0xffff) {
      output += String.fromCharCode(
        0xe0 | ((x >>> 12) & 0x0f),
        0x80 | ((x >>> 6) & 0x3f),
        0x80 | (x & 0x3f),
      );
    } else {
      output += String.fromCharCode(
        0xf0 | ((x >>> 18) & 0x07),
        0x80 | ((x >>> 12) & 0x3f),
        0x80 | ((x >>> 6) & 0x3f),
        0x80 | (x & 0x3f),
      );
    }
  }
  return output;
}

/** Byte-string → lowercase hex. */
function rstr2hex(input: string): string {
  const hex = '0123456789abcdef';
  let output = '';
  for (let i = 0; i < input.length; i++) {
    const x = input.charCodeAt(i);
    output += hex.charAt((x >>> 4) & 0x0f) + hex.charAt(x & 0x0f);
  }
  return output;
}

/** MD5 hex digest of a (UTF-8) string. Dependency-free; Gravatar use only. */
export function md5(input: string): string {
  const utf8 = str2rstrUtf8(input);
  return rstr2hex(binl2rstr(binlMd5(rstr2binl(utf8), utf8.length * 8)));
}
