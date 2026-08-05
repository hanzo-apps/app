/**
 * Serving a stored image.
 *
 *   GET /v1/images/<id>/<name> → the bytes
 *
 * NO SESSION, deliberately. These are the pictures a built page is made of, and
 * the people who load that page are strangers — a signed-in-only image is a
 * broken image for everyone the project was published for. The id is
 * unguessable and it IS the permission to read; `<name>` is cosmetic, so that
 * the URL ends in a real extension. That extension is doing work: the app's
 * middleware skips paths that end in one, so a page full of images does not
 * spend a visitor's whole rate-limit budget rendering itself.
 */
import { NextRequest, NextResponse } from "next/server";

import { readImage } from "@/lib/db/images";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bytes = await readImage(id).catch(() => null);

  if (!bytes) {
    return NextResponse.json({ ok: false, error: "No such image." }, { status: 404 });
  }

  return new NextResponse(bytes.body, {
    headers: {
      "Content-Type": bytes.headers.get("content-type") ?? "application/octet-stream",
      // A stored image never changes: a new upload is a new id. So this can be
      // cached for as long as anyone will keep it.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}
