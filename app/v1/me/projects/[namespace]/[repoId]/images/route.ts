/**
 * A project's uploaded images.
 *
 *   POST → { ok, uploadedFiles }   the durable URLs the builder embeds
 *
 * The bytes go to Hanzo Base (lib/db/images) and are served back by
 * `/v1/images/<id>/<name>`. They used to be committed into the project's
 * published Hugging Face space, which is why this needed a published project
 * at all — and which could not have worked anyway, because the credential this
 * app holds is a hanzo.id IAM token and it was being offered to huggingface.co.
 *
 * Every file is judged on its own: a folder with one thing in it that is not an
 * image still uploads the rest, and says which one it left behind.
 */
import { NextRequest, NextResponse } from "next/server";

import { putImage, refuse } from "@/lib/db/images";
import { requireSameOrigin } from "@/lib/org/csrf";
import { scope, type Ctx } from "../scope";

export async function POST(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const s = await scope(req, ctx);
  if ("fail" in s) return s.fail;

  // `FormData` resolves to react-native-web's declaration here — the app aliases
  // react-native-web app-wide — and its `getAll` answers `string | {uri}` rather
  // than the DOM's `FormDataEntryValue`. The runtime IS the DOM's, so the honest
  // move is to widen and let `instanceof` say what each value actually is.
  const form = await req.formData().catch(() => null);
  const entries = (form?.getAll("images") ?? []) as unknown as unknown[];
  const files = entries.filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "At least one image file is required under the 'images' key." },
      { status: 400 }
    );
  }

  const uploadedFiles: string[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    const why = refuse(file);
    if (why) {
      rejected.push(why);
      continue;
    }
    try {
      uploadedFiles.push(
        await putImage(s.user.token, {
          userId: s.user.sub,
          spaceId: s.key,
          origin: req.nextUrl.origin,
          file,
        })
      );
    } catch {
      rejected.push(`${file.name} could not be stored.`);
    }
  }

  // Nothing landed: the caller gets the reasons rather than an empty success it
  // would have to interpret as a failure.
  if (uploadedFiles.length === 0) {
    return NextResponse.json({ ok: false, error: rejected.join(" ") }, { status: 400 });
  }

  return NextResponse.json({ ok: true, uploadedFiles, rejected });
}
