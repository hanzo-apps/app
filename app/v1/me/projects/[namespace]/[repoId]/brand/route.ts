/**
 * A project's branding guidelines — reading them, deriving them, and editing them.
 *
 *   GET    → { brand }              what has been derived so far
 *   POST   → { brand }              (re-)read every `brand` asset and fold the
 *                                   readings together
 *   DELETE ?field=&value= → { brand } remove one colour / theme / concept
 *
 * The DELETE is the reason this surface exists separately from the assets one. A
 * model reading reference photos will name things that are not the project, so
 * every derived entry has to be removable on its own — without deleting the
 * image that suggested it, which may well have been right about everything else.
 */
import { NextRequest, NextResponse } from "next/server";

import { session } from "@/lib/iam";
import { getProject, spaceId } from "@/lib/db/projects";
import { getBrand, listAssets, putBrand } from "@/lib/db/assets";
import { drop, empty, fold, isField, read, READ_PROMPT } from "@/lib/source/brand";
import { requireSameOrigin } from "@/lib/org/csrf";

type Ctx = { params: Promise<{ namespace: string; repoId: string }> };

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";
const VISION_MODEL = process.env.HANZO_VISION_MODEL || "enso";

async function scope(req: NextRequest, ctx: Ctx) {
  const user = await session(req);
  if (user instanceof NextResponse || !user) {
    return { fail: NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 }) };
  }
  const { namespace, repoId } = await ctx.params;
  const key = spaceId(namespace, repoId);
  if (!(await getProject(user.token, user.sub, key))) {
    return { fail: NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 }) };
  }
  return { user, key };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;
  return NextResponse.json({ ok: true, brand: await getBrand(s.user.token, s.user.sub, s.key) });
}

/** Read one image and return the model's reply, or "" when it could not look. */
async function look(token: string, url: string): Promise<string> {
  const res = await fetch(`${HANZO_AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: READ_PROMPT },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return "";
  const body = (await res.json().catch(() => null)) as
    | { choices?: { message?: { content?: string } }[] }
    | null;
  return body?.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;

  const assets = (await listAssets(s.user.token, s.user.sub, s.key)).filter(
    (a) => a.mode === "brand" && a.url
  );
  if (assets.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No reference images yet. Import a Drive folder with \"use as inspiration\" first.",
      },
      { status: 409 }
    );
  }

  // Derived FRESH from the current asset set, not folded onto what is stored:
  // a re-read after removing images must not keep the departed images' colours.
  // Entries a person deleted by hand are re-proposed, which is honest — the
  // evidence is still in the gallery, and dropping it again is one click.
  let brand = empty();
  let looked = 0;
  for (const a of assets) {
    const reply = await look(s.user.token, a.url);
    if (!reply) continue; // this image taught us nothing; the rest still count
    brand = fold(brand, a.id, read(reply));
    looked++;
  }

  if (looked === 0) {
    return NextResponse.json(
      { ok: false, error: "The model could not read any of these images. Try again, or a different model." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    brand: await putBrand(s.user.token, s.user.sub, s.key, brand),
    read: looked,
    of: assets.length,
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;

  const q = new URL(req.url).searchParams;
  const field = q.get("field");
  const value = q.get("value") ?? "";
  if (!isField(field) || !value) {
    return NextResponse.json(
      { ok: false, error: "field must be colors | themes | concepts, with a value" },
      { status: 400 }
    );
  }

  const brand = drop(await getBrand(s.user.token, s.user.sub, s.key), field, value);
  return NextResponse.json({ ok: true, brand: await putBrand(s.user.token, s.user.sub, s.key, brand) });
}
