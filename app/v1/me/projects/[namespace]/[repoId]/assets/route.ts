/**
 * A project's imported reference images.
 *
 *   GET    ?  → { assets, brand }   the gallery: what was imported, and what was
 *                                   derived from it
 *   POST   ?  → { imported, brand } import a Pinterest/Drive link in one MODE
 *   DELETE ?id=  → { removed, brand } remove one image, and forget what only it
 *                                   supported
 *
 * The MODE is required on import and is never guessed (lib/source/mode.ts): it
 * decides whether the bytes become the app's content or only reference for its
 * branding, and those are different things to do with someone else's picture.
 */
import { NextRequest, NextResponse } from "next/server";

import type { Asset } from "@/lib/db/assets";
import {
  getBrand,
  listAssets,
  putBrand,
  removeAsset,
  upsertAsset,
} from "@/lib/db/assets";
import { LinkError, parse, ready } from "@/lib/source/link";
import { requireMode, policy } from "@/lib/source/mode";
import { forget } from "@/lib/source/brand";
import * as drive from "@/lib/source/drive";
import * as pinterest from "@/lib/source/pinterest";
import { requireSameOrigin } from "@/lib/org/csrf";
import { scope, type Ctx } from "../scope";

export async function GET(req: NextRequest, ctx: Ctx) {
  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;
  const [assets, brand] = await Promise.all([
    listAssets(s.user.token, s.user.sub, s.key),
    getBrand(s.user.token, s.user.sub, s.key),
  ]);
  return NextResponse.json({ ok: true, assets, brand });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;

  const body = (await req.json().catch(() => ({}))) as { url?: string; mode?: unknown; limit?: number };

  let mode, source;
  try {
    mode = requireMode(body.mode);
    source = parse(body.url ?? "");
  } catch (e) {
    // A bad link or an absent mode is the caller's to fix, and the message says
    // which — never a 500, and never a silent default.
    const msg = e instanceof LinkError || e instanceof Error ? e.message : "Bad request";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const can = ready(source.kind);
  if (!can.ok) {
    // 501, not 400: the caller's link is fine, this deployment cannot serve it
    // yet. Saying so is what lets the UI explain instead of looking broken.
    return NextResponse.json({ ok: false, error: can.because }, { status: 501 });
  }

  const limit = Math.min(Math.max(Number(body.limit) || 60, 1), 200);

  // Each kind reads its own way — Drive as the org's Google connection,
  // Pinterest as the public page — and both land in the same found shape:
  // a stable external id, a name, and the url the tile shows now.
  let found: { id: string; name: string; url: string }[];
  try {
    found =
      source.kind === "drive"
        ? (await drive.images(s.user.token, source.id, source.folder, limit)).map((f) => ({
            id: f.id,
            name: f.name,
            url: f.thumb ?? "",
          }))
        : await pinterest.images(source, limit);
  } catch (e) {
    const msg =
      e instanceof drive.DriveError || e instanceof pinterest.PinError || e instanceof LinkError
        ? e.message
        : "Could not read that link.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  if (found.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No images there — nothing png, jpeg, gif, webp or avif was found." },
      { status: 404 }
    );
  }

  // Record every image against the mode it was imported under. The bytes are
  // landed separately (see the `bytes` route) so a large folder answers quickly
  // and a slow download cannot lose the import.
  const imported: Asset[] = [];
  for (const img of found) {
    imported.push(
      await upsertAsset(s.user.token, {
        user_id: s.user.sub,
        space_id: s.key,
        kind: source.kind,
        external: img.id,
        name: img.name,
        mode,
        url: img.url,
        origin: source.url,
      })
    );
  }

  const brand = await getBrand(s.user.token, s.user.sub, s.key);
  return NextResponse.json({
    ok: true,
    imported,
    brand,
    // Echo what this mode means, so the UI states it rather than restating it.
    mode,
    summary: policy(mode).summary,
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  const removed = await removeAsset(s.user.token, s.user.sub, s.key, id);
  if (!removed) return NextResponse.json({ ok: false, error: "No such image." }, { status: 404 });

  // Removing a reference image must take with it anything only that image
  // vouched for — otherwise a guideline stays asserted with its evidence gone.
  let brand = await getBrand(s.user.token, s.user.sub, s.key);
  if (removed.mode === "brand") {
    brand = await putBrand(s.user.token, s.user.sub, s.key, forget(brand, removed.id));
  }
  return NextResponse.json({ ok: true, removed, brand });
}
