/**
 * Where imported images come from, and how a pasted link is understood.
 *
 * Two kinds, because they authenticate differently and that difference is not
 * cosmetic:
 *
 *   drive     — a Google Drive folder or file link. Google is ALREADY a
 *               connector (cloud apps/automations connector_google.go: oauth2,
 *               per-org KMS-custodied access token), so a Drive import rides the
 *               connection the org already has. A link is an ADDRESS, never a
 *               credential: pasting one grants nothing, and the fetch still runs
 *               as the org's own Google connection.
 *
 *   pinterest — a board or profile link. Pinterest has no connector yet, and it
 *               needs a registered developer app (client id/secret) before OAuth
 *               can happen at all. Parsing is implemented so the surface is whole
 *               and testable; `ready` reports honestly that a connection cannot
 *               be made yet, so the UI can say WHY instead of failing at import.
 *
 * Parsing is deliberately strict. A link that is not recognizably one of these is
 * refused with the reason rather than fetched hopefully — an arbitrary URL handed
 * to an image fetcher is a request this server makes on a stranger's behalf.
 */

export type Kind = "drive" | "pinterest";

export type Source =
  | { kind: "drive"; id: string; folder: boolean; url: string }
  | { kind: "pinterest"; user: string; board?: string; url: string };

/** Why a link was refused, in words a person can act on. */
export class LinkError extends Error {}

const DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);
const PIN_HOSTS = new Set([
  "pinterest.com",
  "www.pinterest.com",
  "pin.it",
  "uk.pinterest.com",
]);

/** A Drive id is the opaque key in /folders/<id>, /d/<id>, or ?id=<id>. */
const driveId = (u: URL): { id: string; folder: boolean } | null => {
  const parts = u.pathname.split("/").filter(Boolean);
  const at = (k: string) => {
    const i = parts.indexOf(k);
    return i >= 0 && parts[i + 1] ? parts[i + 1] : null;
  };
  const folder = at("folders");
  if (folder) return { id: folder, folder: true };
  const file = at("d");
  if (file) return { id: file, folder: false };
  const q = u.searchParams.get("id");
  return q ? { id: q, folder: false } : null;
};

/**
 * Parse a pasted link into a source, or throw LinkError saying why not.
 *
 * The host decides the kind — never the path, and never a substring match on the
 * raw string, which is how "https://evil.example/?x=pinterest.com" gets treated
 * as Pinterest.
 */
export function parse(raw: string): Source {
  const text = (raw ?? "").trim();
  if (!text) throw new LinkError("Paste a Pinterest or Google Drive link.");

  let u: URL;
  try {
    u = new URL(text);
  } catch {
    throw new LinkError(`"${text}" is not a link.`);
  }
  if (u.protocol !== "https:") {
    throw new LinkError("Only https links are accepted.");
  }

  const host = u.hostname.toLowerCase();

  if (DRIVE_HOSTS.has(host)) {
    const d = driveId(u);
    if (!d) {
      throw new LinkError(
        "That Google Drive link has no folder or file id — open the folder and copy the link from the address bar."
      );
    }
    return { kind: "drive", id: d.id, folder: d.folder, url: text };
  }

  if (PIN_HOSTS.has(host)) {
    // pin.it short links resolve server-side; there is nothing to parse here and
    // guessing a username from an opaque code would be a fiction.
    if (host === "pin.it") {
      throw new LinkError(
        "Open the pin.it link and paste the full pinterest.com board address."
      );
    }
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      throw new LinkError("That Pinterest link names no board — open the board and copy its address.");
    }
    return { kind: "pinterest", user: parts[0], board: parts[1], url: text };
  }

  throw new LinkError(
    "Only Pinterest and Google Drive links are supported right now."
  );
}

/**
 * Whether a kind can actually be imported on this deployment.
 *
 * Pinterest parses but cannot connect until a developer app exists and its
 * credentials are sealed in KMS. Saying so HERE — rather than discovering it as
 * a failed OAuth redirect — is what lets the UI explain the gap instead of
 * looking broken.
 */
export const ready = (kind: Kind): { ok: boolean; because?: string } =>
  kind === "drive"
    ? { ok: true }
    : {
        ok: false,
        because:
          "Pinterest needs a registered developer app before it can be connected. Google Drive works today.",
      };
