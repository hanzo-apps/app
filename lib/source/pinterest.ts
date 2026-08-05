/**
 * Reading images out of a public Pinterest pin, board or profile.
 *
 * SERVER ONLY, and credential-free on purpose: a public Pinterest page is
 * public HTML, and the images it shows live on Pinterest's own image host.
 * Reading them needs no developer app and no OAuth — so a pasted board link
 * works today, for every org, with nothing to connect. A PRIVATE board is the
 * one thing this cannot see, and the refusal says exactly that.
 *
 * The fetch is host-pinned both ways: pages are read only from pinterest.com
 * hosts, bytes only from i.pinimg.com — this module never fetches an address a
 * stranger composed.
 *
 * Extraction is a pure function over the page text. Pinterest renders its data
 * into the HTML (markup and embedded JSON both), and every image reference in
 * either form is an i.pinimg.com URL whose path ends in a stable stem shared by
 * all sizes of one image:
 *
 *   https://i.pinimg.com/236x/ab/cd/ef/abcdef1234.jpg
 *   https://i.pinimg.com/originals/ab/cd/ef/abcdef1234.jpg
 *                        ^size^    ^———— the stem: one image ————^
 *
 * So the reader collects every reference, groups by stem, and keeps the largest
 * size seen for each — no DOM, no brittle walk of an app-state blob that
 * reshuffles with every Pinterest deploy.
 */
import type { Source } from "@/lib/source/link";
import { parse } from "@/lib/source/link";

/** One image found on the page. */
export type PinImage = {
  /** The stem — stable across sizes, so re-imports converge on one row. */
  id: string;
  name: string;
  /** The largest rendition the page offered. */
  url: string;
};

export class PinError extends Error {}

/** Every reference to Pinterest's image host, escaped or plain, in page text. */
const IMAGE = /https:(?:\\u002F|\\\/|\/){2}i\.pinimg\.com(?:(?:\\u002F|\\\/|\/)[A-Za-z0-9._-]+)+\.(?:jpe?g|png|gif|webp)/g;

/** The size segment ranks a rendition; originals outranks every pixel count. */
const rank = (size: string): number =>
  size === "originals" ? Number.MAX_SAFE_INTEGER : parseInt(size, 10) || 0;

/**
 * Every distinct image in the page text, largest rendition of each, in the
 * order first seen. Pure, so the whole reader is testable from a saved page.
 */
export function extract(html: string, limit: number): PinImage[] {
  const best = new Map<string, { size: string; url: string }>();
  const order: string[] = [];
  for (const raw of html.match(IMAGE) ?? []) {
    const url = raw.replace(/\\u002F|\\\//g, "/");
    const path = url.slice("https://i.pinimg.com/".length);
    const cut = path.indexOf("/");
    if (cut < 0) continue;
    const size = path.slice(0, cut);
    const stem = path.slice(cut + 1);
    // Profile chrome, not content: avatars ride a user path segment or the
    // fixed square renditions Pinterest reserves for them.
    if (stem.split("/").includes("user") || /^\d+x\d+_RS$/.test(size)) continue;
    const seen = best.get(stem);
    if (!seen) order.push(stem);
    if (!seen || rank(size) > rank(seen.size)) best.set(stem, { size, url });
  }
  return order.slice(0, Math.max(1, limit)).map((stem) => ({
    id: stem,
    name: stem.slice(stem.lastIndexOf("/") + 1),
    url: best.get(stem)!.url,
  }));
}

/** Hosts a Pinterest page may be read from — the parser's list plus redirects. */
const PAGE_HOSTS = /(^|\.)pinterest\.(com|co\.uk|de|fr|es|it|jp|com\.au|ca)$/i;

/**
 * A desktop browser's own header set. Pinterest answers a bare fetch with an
 * empty shell or a refusal; it answers a browser with the page. This reads the
 * same public page a signed-out visitor sees — nothing more.
 */
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en",
};

async function page(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow", cache: "no-store" });
  const host = new URL(res.url).hostname;
  if (!PAGE_HOSTS.test(host) && host !== "pin.it") {
    throw new PinError("That link left Pinterest — paste a pinterest.com board, pin or profile.");
  }
  if (res.status === 404) {
    throw new PinError("Pinterest has no page at that address — check the link.");
  }
  if (!res.ok) {
    throw new PinError(`Pinterest refused this request (${res.status}) — a private board cannot be read; make it public or use a Drive folder.`);
  }
  return res.text();
}

/**
 * Every image a public pin/board/profile page shows, largest rendition of
 * each, bounded by `limit`.
 *
 * One page-load's worth: a board's first page carries its most recent pins,
 * and walking Pinterest's private pagination API from here would be a second,
 * fragile integration. The bound is stated to the caller through `limit`
 * exactly like Drive's.
 */
export async function images(source: Source & { kind: "pinterest" }, limit = 60): Promise<PinImage[]> {
  let target = source;
  if (source.short) {
    // A pin.it code is an address only Pinterest can expand; follow it, then
    // hold the result to the same parser every pasted link goes through.
    const res = await fetch(`https://pin.it/${source.short}`, {
      headers: HEADERS,
      redirect: "follow",
      cache: "no-store",
    });
    const landed = parse(res.url);
    if (landed.kind !== "pinterest") {
      throw new PinError("That pin.it link did not lead to a Pinterest page.");
    }
    target = landed as typeof target;
  }

  const path = target.pin
    ? `pin/${encodeURIComponent(target.pin)}/`
    : `${encodeURIComponent(target.user!)}/${target.board ? encodeURIComponent(target.board) + "/" : ""}`;
  const html = await page(`https://www.pinterest.com/${path}`);

  const found = extract(html, target.pin ? 1 : limit);
  if (found.length === 0) {
    throw new PinError("No images found there — the board may be empty or private. Make it public, or use a Drive folder.");
  }
  return found;
}

/** The image host bytes may be fetched from, and nowhere else. */
const BYTES_HOST = "i.pinimg.com";

/** One image's bytes, host-pinned and size-capped. */
export async function bytes(url: string, cap = 12 << 20): Promise<{ data: Buffer; mime: string }> {
  const u = new URL(url);
  if (u.protocol !== "https:" || u.hostname !== BYTES_HOST) {
    throw new PinError("Refusing to download from outside Pinterest's image host.");
  }
  const res = await fetch(u.toString(), { headers: HEADERS, cache: "no-store" });
  if (!res.ok) throw new PinError(`Could not download that image (${res.status}).`);
  const data = Buffer.from(await res.arrayBuffer());
  if (data.byteLength > cap) throw new PinError("That image is larger than an import will keep.");
  return { data, mime: res.headers.get("content-type") || "image/jpeg" };
}
