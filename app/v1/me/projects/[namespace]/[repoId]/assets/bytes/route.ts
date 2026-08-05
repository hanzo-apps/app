/**
 * Landing the actual pixels for imported images.
 *
 *   POST → { landed, remaining }
 *
 * SEPARATE FROM THE IMPORT, deliberately. Listing a Drive folder is one fast
 * call; downloading sixty full-size photos is not, and doing both in one request
 * means a large folder either times out or loses the import it already made. So
 * the import records WHAT is there and this lands the bytes in batches — a
 * caller keeps calling while `remaining` is non-zero, and every batch that
 * succeeds is kept even if a later one fails.
 *
 * WHY THE BYTES ARE KEPT AT ALL is the mode (lib/source/mode.ts), and both modes
 * want them:
 *   gallery — the app EMBEDS them, so a link that rots takes the gallery with it
 *             and hotlinking leaks every viewer's request to Drive.
 *   brand   — they are the evidence behind "these colors came from these images",
 *             and Drive's thumbnail URLs expire, so guidelines would end up
 *             pointing at nothing.
 *
 * They land in the project's own `images/` folder through the SAME upload the
 * rest of the builder uses for project images — not a second store that would
 * have to be migrated separately when that one moves.
 */
import { NextRequest, NextResponse } from "next/server";
// TODO(storage): follows the project-images path; migrates with it to Hanzo storage.
import { RepoDesignation, uploadFiles } from "@huggingface/hub";

import { session } from "@/lib/iam";
import { getProject, spaceId } from "@/lib/db/projects";
import { listAssets, upsertAsset } from "@/lib/db/assets";
import * as drive from "@/lib/source/drive";
import * as pinterest from "@/lib/source/pinterest";
import { requireSameOrigin } from "@/lib/org/csrf";

type Ctx = { params: Promise<{ namespace: string; repoId: string }> };

/** How many images one call downloads. Bounded so a request stays answerable. */
const BATCH = 8;

/** A stored name that cannot escape images/ or collide across sources. */
const safeName = (kind: string, external: string, name: string) => {
  const ext = /\.(png|jpe?g|gif|webp|avif)$/i.exec(name)?.[0] ?? ".jpg";
  const stem = `${kind}-${external}`.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80);
  return `images/${stem}${ext.toLowerCase()}`;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const user = await session(req);
  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  }
  const { namespace, repoId } = await ctx.params;
  const key = spaceId(namespace, repoId);
  if (!(await getProject(user.token, user.sub, key))) {
    return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
  }

  // Anything whose stored url is not the project's own copy has not landed
  // yet — whichever source it came from.
  const pending = (await listAssets(user.token, user.sub, key)).filter(
    (a) => !a.url.startsWith("https://huggingface.co/")
  );
  if (pending.length === 0) {
    return NextResponse.json({ ok: true, landed: 0, remaining: 0 });
  }

  const batch = pending.slice(0, BATCH);
  const files: File[] = [];
  const named: { asset: (typeof batch)[number]; path: string }[] = [];

  for (const a of batch) {
    try {
      // Each kind downloads its own way: Drive with the org's token, Pinterest
      // from its public image host. Both land through the same upload below.
      const { data, mime } =
        a.kind === "drive"
          ? await drive.bytes(
              user.token,
              `https://www.googleapis.com/drive/v3/files/${a.external}?alt=media`
            )
          : await pinterest.bytes(a.url);
      const path = safeName(a.kind, a.external, a.name);
      files.push(new File([new Uint8Array(data)], path, { type: mime }));
      named.push({ asset: a, path });
    } catch {
      // One unreadable image must not sink the batch — it stays pending and the
      // next call tries again. A folder with one broken file still imports.
    }
  }

  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "None of these images could be downloaded from their source." },
      { status: 502 }
    );
  }

  const repo: RepoDesignation = { type: "space", name: `${namespace}/${repoId}` };
  try {
    await uploadFiles({
      repo,
      files,
      accessToken: user.token as string,
      commitTitle: `Add ${files.length} reference image(s)`,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Downloaded, but the project would not accept them." },
      { status: 502 }
    );
  }

  // Point each asset at the stored copy. Only now — a url written before the
  // upload succeeded would name bytes that are not there.
  for (const { asset, path } of named) {
    await upsertAsset(user.token, {
      user_id: asset.user_id,
      space_id: asset.space_id,
      kind: asset.kind,
      external: asset.external,
      name: asset.name,
      mode: asset.mode,
      url: `https://huggingface.co/spaces/${namespace}/${repoId}/resolve/main/${path}`,
      origin: asset.origin,
    });
  }

  return NextResponse.json({
    ok: true,
    landed: named.length,
    remaining: Math.max(0, pending.length - named.length),
  });
}
