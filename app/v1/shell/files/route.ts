/**
 * /v1/shell/files — what the sandbox holds, and one file out of it.
 *
 * The builder's pages are HTML the app itself stores; everything ELSE an agent
 * or a typed command produces — a .pptx deck, a CSV, a zip — lives only in the
 * sandbox, and until this door existed there was no way to get such a file OUT.
 * The agent could make a deck; nobody could download it.
 *
 *   GET ?sandbox=<id>                 → { sandbox, files: string[] }
 *   GET ?sandbox=<id>&file=<path>     → the bytes, as an attachment
 *
 * Session-lent exactly like /v1/shell: the caller's IAM session is forwarded
 * and CLOUD decides which sandbox this identity may open, so a sandbox id here
 * is not a capability. It also never OPENS a sandbox — `sandbox` is required,
 * because this surface reads a pod the shell or an agent run already holds; a
 * listing endpoint that silently created pods would bill one per curious click.
 *
 * The bytes travel as base64 THROUGH EXEC, not through `Sandbox.read`. `read`
 * returns a string, and a string round-trip is lossy for binary — a .pptx is a
 * zip, and one mangled byte is a file PowerPoint refuses. `base64` in the
 * sandbox and a decode here is byte-exact by construction.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { Sandbox, SandboxError } from "@/lib/agent/sandbox";
import { session } from "@/lib/iam";
import { quote } from "@/lib/shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

/**
 * The ceiling on a download, after decoding.
 *
 * A cap because the bytes ride an exec's stdout: an unbounded `base64` of a
 * stray core dump would hold the route open for minutes and then fail at the
 * body-size layer anyway, with a worse sentence than this one.
 */
const MAX_BYTES = 25 * 1024 * 1024;

/** How a browser should label the bytes. Extension is all the sandbox knows. */
const TYPES: Record<string, string> = {
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  md: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  zip: "application/zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
};

/**
 * A path a caller may name.
 *
 * Relative, inside the workspace, no traversal, and no leading `-` — the path
 * is spliced (quoted) into `base64 < <path>`, and while the quoting stops the
 * shell from parsing it, a leading dash would still reach a COMMAND as an
 * option. Refusing the shape is simpler than reasoning about every consumer.
 */
function cleanPath(p: string): string | null {
  const path = p.trim();
  if (!path || path.length > 512) return null;
  if (path.startsWith("/") || path.startsWith("-") || path.includes("..")) return null;
  // Control characters have no business in a filename and break header values.
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(path)) return null;
  return path;
}

export async function GET(request: NextRequest) {
  const token = (await session(request))?.token;
  if (!token) {
    return NextResponse.json({ error: "Sign in to browse sandbox files." }, { status: 401 });
  }

  const id = (request.nextUrl.searchParams.get("sandbox") ?? "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "Name the sandbox — this surface reads one the shell or an agent already holds." },
      { status: 400 },
    );
  }

  const sandbox = new Sandbox({ baseUrl: HANZO_AI_BASE_URL, id, token });
  const file = request.nextUrl.searchParams.get("file");

  try {
    if (file === null) {
      const files = await sandbox.list();
      return NextResponse.json({ sandbox: id, files });
    }

    const path = cleanPath(file);
    if (!path) {
      return NextResponse.json({ error: "That path cannot be read." }, { status: 400 });
    }

    // `base64 <` and not `base64 --wrap`: BusyBox and GNU disagree about the
    // flags, and every one of them folds output at some width — folding is
    // whitespace, and the decoder below strips whitespace, so the lowest
    // common denominator is also sufficient.
    const r = await sandbox.exec(`base64 < ${quote(path)}`, 60);
    if (r.exitCode !== 0) {
      return NextResponse.json(
        { error: r.stderr.trim() || `No readable file at ${path}.` },
        { status: 404 },
      );
    }

    const bytes = Buffer.from(r.stdout.replace(/\s+/g, ""), "base64");
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json(
        { error: `${path} is ${(bytes.length / 1024 / 1024).toFixed(1)} MB; the limit is 25 MB.` },
        { status: 413 },
      );
    }

    const name = path.split("/").pop() || "file";
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        // The filename is already control-character-free (cleanPath); quote it
        // so a space survives the header.
        "Content-Disposition": `attachment; filename="${name.replaceAll('"', "")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const why =
      e instanceof SandboxError
        ? e.message
        : "The sandbox did not answer. Try again.";
    return NextResponse.json({ error: why }, { status: 502 });
  }
}
