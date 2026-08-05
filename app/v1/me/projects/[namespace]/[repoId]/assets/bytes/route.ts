/**
 * Landing the actual pixels for imported images.
 *
 *   POST → { landed, remaining }
 *
 * SEPARATE FROM THE IMPORT, deliberately. Listing a Drive folder is one fast
 * call; downloading sixty full-size photos is not, and doing both in one request
 * means a large folder either times out or loses the import it already made. So
 * the import records WHAT is there and this lands the bytes in batches — a
 * caller keeps calling while `remaining` is non-zero, and every image that
 * succeeds is kept even if its neighbour fails.
 *
 * WHY THE BYTES ARE KEPT AT ALL is the mode (lib/source/mode.ts), and both modes
 * want them:
 *   gallery — the app EMBEDS them, so a link that rots takes the gallery with it
 *             and hotlinking leaks every viewer's request to Drive.
 *   brand   — they are the evidence behind "these colors came from these images",
 *             and Drive's thumbnail URLs expire, so guidelines would end up
 *             pointing at nothing.
 *
 * They land through the SAME store as every other project image (lib/db/images)
 * — one place bytes live, so there is never a second one to migrate.
 */
import { NextRequest, NextResponse } from "next/server";

import { listAssets, upsertAsset } from "@/lib/db/assets";
import { putImage, stored } from "@/lib/db/images";
import * as drive from "@/lib/source/drive";
import * as pinterest from "@/lib/source/pinterest";
import { requireSameOrigin } from "@/lib/org/csrf";
import { scope, type Ctx } from "../../scope";

/** How many images one call downloads. Bounded so a request stays answerable. */
const BATCH = 8;

/** A stored name that cannot collide across sources. */
const name = (kind: string, external: string, from: string) => {
  const ext = /\.(png|jpe?g|gif|webp|avif)$/i.exec(from)?.[0].toLowerCase() ?? ".jpg";
  return `${kind}-${external}`.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80) + ext;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;

  // Anything whose url is not already our own copy has not landed yet —
  // whichever source it came from.
  const pending = (await listAssets(s.user.token, s.user.sub, s.key)).filter(
    (a) => !stored(a.url)
  );
  if (pending.length === 0) {
    return NextResponse.json({ ok: true, landed: 0, remaining: 0 });
  }

  let landed = 0;
  for (const a of pending.slice(0, BATCH)) {
    try {
      // Each kind downloads its own way: Drive with the org's token, Pinterest
      // from its public image host. Both land through the same store below.
      const { data, mime } =
        a.kind === "drive"
          ? await drive.bytes(
              s.user.token,
              `https://www.googleapis.com/drive/v3/files/${a.external}?alt=media`
            )
          : await pinterest.bytes(a.url);

      const url = await putImage(s.user.token, {
        userId: s.user.sub,
        spaceId: s.key,
        origin: req.nextUrl.origin,
        file: new File([new Uint8Array(data)], name(a.kind, a.external, a.name), {
          type: mime,
        }),
      });

      // Point the asset at the stored copy. Only now — a url written before the
      // bytes were kept would name something that is not there.
      await upsertAsset(s.user.token, {
        user_id: a.user_id,
        space_id: a.space_id,
        kind: a.kind,
        external: a.external,
        name: a.name,
        mode: a.mode,
        url,
        origin: a.origin,
      });
      landed++;
    } catch {
      // One unreadable image must not sink the batch — it stays pending and the
      // next call tries again. A folder with one broken file still imports.
    }
  }

  if (landed === 0) {
    return NextResponse.json(
      { ok: false, error: "None of these images could be downloaded from their source." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, landed, remaining: Math.max(0, pending.length - landed) });
}
