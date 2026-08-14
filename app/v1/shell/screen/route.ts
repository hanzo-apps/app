/**
 * /v1/shell/screen — a ticket for the sandbox's DISPLAY, beside the one
 * /v1/shell/terminal already mints for its shell.
 *
 * Cloud serves the whole screen — noVNC, the RFB socket, the reconnect — as one
 * self-contained page at /v1/sandboxes/:id/screen, exactly as it serves the
 * terminal. So this builds none of that and frames what cloud serves. The pixels
 * come out of the pod through the same Kubernetes exec channel every other call
 * into a sandbox uses; there is no second port, no second stream, and nothing
 * here that a viewer could point at a display directly.
 *
 * The browser cannot mint the ticket itself: the mint needs the bearer, and an
 * iframe URL is the one place a bearer must never travel. So the mint happens
 * here with the session lent server-side — /v1/shell/terminal's contract,
 * unchanged — and what returns is a URL whose only credential is the single-use,
 * thirty-second ticket it carries.
 *
 *   POST { project?, sandbox? } → { sandbox, src }
 *
 * TWO THINGS DIFFER FROM THE TERMINAL, and both are about the pod rather than
 * about the door.
 *
 * The first is the CLASS. Every sandbox has a shell; only a `desktop` one has an
 * X server. So this asks for `desktop` where the terminal is happy with `dev` —
 * and then checks what it got, which the terminal has no reason to do. A project
 * holding a live `dev` sandbox gets that one back from `openSandbox`'s 409 path
 * regardless of the class asked for (cloud allows ONE live sandbox per project
 * and the lookup matches on project alone), so without the check below the
 * happy-looking outcome is a framed page dialling 127.0.0.1:5900 in a pod where
 * nothing listens — "connection failed", and no way to tell that from an outage.
 * Naming it here costs one comparison and saves that whole investigation.
 *
 * The second is that the ticket response already carries the PATH to embed, so
 * this joins it to the API's origin rather than spelling the URL a second time.
 * The terminal hand-builds its address because it appends `?arg=` to name a tmux
 * session; a screen takes no argument, so the server's own answer is the address
 * and there is nothing here that has to stay in step with it.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { openSandbox, SandboxError } from "@/lib/agent/sandbox";
import { session } from "@/lib/iam";
import { slugifyProject } from "@/lib/org/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

function text(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * The page to frame, from the path cloud minted the ticket for.
 *
 * A leading-slash path resolves against the ORIGIN, so the `/v1` on the base is
 * correctly ignored rather than doubled — `/v1/sandboxes/x/screen` against
 * `https://api.hanzo.ai/v1` is `https://api.hanzo.ai/v1/sandboxes/x/screen`.
 */
function pageAt(apiBase: string, path: string): string {
  return new URL(path, apiBase).toString();
}

export async function POST(request: NextRequest) {
  const id = await session(request);
  if (!id?.token) {
    return NextResponse.json({ error: "Sign in to open a screen." }, { status: 401 });
  }
  const token = id.token;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const project = text(body.project).trim();
  const held = text(body.sandbox).trim();
  if (!project && !held) {
    return NextResponse.json(
      { error: "A screen belongs to a project. Open one first." },
      { status: 400 },
    );
  }

  try {
    let box = held;
    if (!box) {
      const slug = slugifyProject(project);
      const opened = await openSandbox({
        baseUrl: HANZO_AI_BASE_URL,
        token,
        project,
        class: "desktop",
        ...(id.name && slug ? { repo: { owner: id.name, name: slug } } : {}),
      });
      if ("why" in opened) {
        return NextResponse.json({ error: opened.why }, { status: 502 });
      }
      // What we GOT, not what we asked for. `class` is absent on older rows, and
      // an absent fact is not a wrong one — only a stated, different class is
      // grounds to refuse.
      const got = opened.sandbox.class;
      if (got && got !== "desktop") {
        return NextResponse.json(
          {
            error:
              `${project} is running a ${got} sandbox, which has no display. ` +
              `Close it to open a screen — a project holds one sandbox at a time.`,
            sandbox: opened.sandbox.id,
            class: got,
          },
          { status: 409 },
        );
      }
      box = opened.sandbox.id;
    }

    const mint = await fetch(
      `${HANZO_AI_BASE_URL}/sandboxes/${encodeURIComponent(box)}/screen/ticket`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    // A 404 here is the ROUTE, not the sandbox: `find` refuses an unknown
    // sandbox with 403 (an id is not a capability, so a miss must not confirm
    // one exists), which leaves 404 meaning this cloud does not register the
    // screen doors at all. Said plainly, because "the screen refused a ticket
    // (404)" reads as a broken sandbox and sends the reader into the pod.
    if (mint.status === 404) {
      return NextResponse.json(
        { error: "This cloud does not serve screens yet." },
        { status: 501 },
      );
    }
    if (!mint.ok) {
      const why = await mint.text().catch(() => "");
      return NextResponse.json(
        { error: why.slice(0, 200) || `The screen refused a ticket (${mint.status}).` },
        { status: mint.status === 401 || mint.status === 403 ? mint.status : 502 },
      );
    }
    const pass = (await mint.json().catch(() => null)) as { url?: string } | null;
    if (!pass?.url) {
      return NextResponse.json({ error: "The ticket did not arrive." }, { status: 502 });
    }

    return NextResponse.json({ sandbox: box, src: pageAt(HANZO_AI_BASE_URL, pass.url) });
  } catch (e) {
    const why =
      e instanceof SandboxError ? e.message : "The sandbox did not answer. Try again.";
    return NextResponse.json({ error: why }, { status: 502 });
  }
}
