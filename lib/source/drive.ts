/**
 * Reading images out of a Google Drive folder.
 *
 * SERVER ONLY. It resolves the org's Google access token from cloud's connectors
 * surface (`GET /v1/connectors/google/token`, which is scoped to the caller's own
 * org+user from their bearer) and calls the Drive API with it. The token is used
 * here and never returned to the browser — a Drive link is an address, and the
 * authority to read it stays on this side.
 *
 * Google is ALREADY a connector (cloud apps/automations connector_google.go:
 * oauth2, per-org KMS-custodied credential), so this needs no new integration and
 * no new consent — an org that has connected Google can import today.
 *
 * WHAT IT RETURNS is metadata, not bytes: id, name, mime, and the two URLs Drive
 * offers. Fetching the bytes is the importer's job (store.ts), because whether
 * bytes are kept at all is a question of MODE, and this module does not know the
 * mode and should not.
 */
import { API_BASE } from "@/lib/platform";

/** One image found in a folder. */
export type DriveImage = {
  id: string;
  name: string;
  mime: string;
  /** Full-size download, authenticated. */
  download: string;
  /** Drive's own thumbnail, when it published one. */
  thumb?: string;
};

export class DriveError extends Error {}

const API = "https://www.googleapis.com/drive/v3";

/** The image types Drive can hand back and a browser can render. */
const IMAGE_MIME = /^image\/(png|jpe?g|gif|webp|avif)$/i;

/**
 * The org's Google token, from cloud. Absent connection is a distinct, actionable
 * failure — "connect Google" is something a person can do; "502" is not.
 */
async function token(bearer: string): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/connectors/google/token`, {
    headers: { Authorization: `Bearer ${bearer}` },
    cache: "no-store",
  });
  if (res.status === 404) {
    throw new DriveError("Connect Google first, then import from Drive.");
  }
  if (!res.ok) {
    throw new DriveError("Google is connected but its token could not be refreshed.");
  }
  const body = (await res.json().catch(() => null)) as
    | { token?: string; access_token?: string; data?: { token?: string } }
    | null;
  const t = body?.token || body?.access_token || body?.data?.token;
  if (!t) throw new DriveError("Google returned no usable token.");
  return t;
}

async function drive(tok: string, path: string, params: Record<string, string>) {
  const u = new URL(API + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${tok}` },
    cache: "no-store",
  });
  if (res.status === 404) throw new DriveError("That Drive folder was not found, or this account cannot see it.");
  if (res.status === 403) throw new DriveError("This Google account does not have access to that Drive folder.");
  if (!res.ok) throw new DriveError(`Drive refused the request (${res.status}).`);
  return res.json();
}

/**
 * Every image in a folder (or the single file a file-link names).
 *
 * `limit` bounds one import. A board or folder can hold thousands, and importing
 * all of them silently is a surprise measured in storage and in someone's Drive
 * quota — the caller states how many it will take and the UI says so.
 */
export async function images(
  bearer: string,
  id: string,
  folder: boolean,
  limit = 60
): Promise<DriveImage[]> {
  const tok = await token(bearer);
  const fields = "id,name,mimeType,thumbnailLink";

  if (!folder) {
    const f = await drive(tok, `/files/${encodeURIComponent(id)}`, { fields });
    return shape([f]).slice(0, limit);
  }

  const out: DriveImage[] = [];
  let page = "";
  // Paged, because Drive caps a listing and a folder of 200 photos would
  // otherwise import the first 100 and look complete.
  do {
    const res = (await drive(tok, "/files", {
      q: `'${id.replace(/'/g, "\\'")}' in parents and trashed = false`,
      fields: `nextPageToken,files(${fields})`,
      pageSize: String(Math.min(100, limit - out.length)),
      ...(page ? { pageToken: page } : {}),
    })) as { files?: unknown[]; nextPageToken?: string };
    out.push(...shape(res.files ?? []));
    page = res.nextPageToken ?? "";
  } while (page && out.length < limit);

  return out.slice(0, limit);
}

function shape(files: unknown[]): DriveImage[] {
  return files.flatMap((raw) => {
    const f = raw as { id?: string; name?: string; mimeType?: string; thumbnailLink?: string };
    if (!f?.id || !IMAGE_MIME.test(f.mimeType ?? "")) return [];
    return [
      {
        id: f.id,
        name: f.name || f.id,
        mime: (f.mimeType as string).toLowerCase(),
        download: `${API}/files/${f.id}?alt=media`,
        ...(f.thumbnailLink ? { thumb: f.thumbnailLink } : {}),
      },
    ];
  });
}

/** Fetch one image's bytes. Separate from listing: keeping bytes is a MODE decision. */
export async function bytes(bearer: string, url: string): Promise<{ data: Buffer; mime: string }> {
  const tok = await token(bearer);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}` }, cache: "no-store" });
  if (!res.ok) throw new DriveError(`Could not download that image (${res.status}).`);
  const mime = res.headers.get("content-type") || "application/octet-stream";
  return { data: Buffer.from(await res.arrayBuffer()), mime };
}
