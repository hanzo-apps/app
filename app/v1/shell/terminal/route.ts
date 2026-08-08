/**
 * /v1/shell/terminal — a ticket for the REAL terminal, in the project's pod.
 *
 * Cloud SERVES the terminal (emulator, socket, resize, reconnect — one
 * self-contained page at /v1/sandboxes/:id/terminal), so a host that wants a
 * shell frames that page rather than building one. console.hanzo.ai and
 * tabs.hanzo.ai already do; this lends hanzo.app the same door, against the
 * SAME pod the line-shell and the agent hold — one sandbox, one checkout.
 *
 * The browser cannot mint the ticket itself: the mint needs the bearer, and an
 * iframe URL is the one place a bearer must never travel. So the mint happens
 * here with the session lent server-side — exactly /v1/shell's contract — and
 * what returns is the framed URL whose only credential is the single-use,
 * thirty-second ticket it carries.
 *
 *   POST { project?, sandbox? } → { sandbox, src }
 *
 * A held sandbox id is reused as-is (cloud still decides whether this identity
 * may open it — an id is not a capability); otherwise the project's sandbox is
 * get-or-created, the same way the shell's first command does.
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

/** The terminal page's address — console.hanzo.ai's `terminalFor`, verbatim. */
function terminalFor(apiBase: string, id: string, ticket: string, tmux: string): string {
  const base = apiBase.trim().replace(/\/+$/, "");
  return (
    `${base}/sandboxes/${encodeURIComponent(id)}/terminal` +
    `?ticket=${encodeURIComponent(ticket)}&arg=${encodeURIComponent(tmux)}`
  );
}

export async function POST(request: NextRequest) {
  const id = await session(request);
  if (!id?.token) {
    return NextResponse.json({ error: "Sign in to open a terminal." }, { status: 401 });
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
      { error: "The terminal runs inside a project. Open one first." },
      { status: 400 },
    );
  }

  try {
    // A held id is reused as-is; only the first open pays for `openSandbox`,
    // which gets-or-creates the project's sandbox — cloned as a working copy of
    // the project's repo, exactly as /v1/shell's first command does, so the
    // terminal opens standing in the project rather than in an empty directory.
    let box = held;
    if (!box) {
      const slug = slugifyProject(project);
      const opened = await openSandbox({
        baseUrl: HANZO_AI_BASE_URL,
        token,
        project,
        ...(id.name && slug ? { repo: { owner: id.name, name: slug } } : {}),
      });
      if ("why" in opened) {
        return NextResponse.json({ error: opened.why }, { status: 502 });
      }
      box = opened.sandbox.id;
    }

    const mint = await fetch(
      `${HANZO_AI_BASE_URL}/sandboxes/${encodeURIComponent(box)}/terminal/ticket`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!mint.ok) {
      const why = await mint.text().catch(() => "");
      return NextResponse.json(
        { error: why.slice(0, 200) || `The terminal refused a ticket (${mint.status}).` },
        { status: mint.status === 401 || mint.status === 403 ? mint.status : 502 },
      );
    }
    const pass = (await mint.json().catch(() => null)) as { ticket?: string } | null;
    if (!pass?.ticket) {
      return NextResponse.json({ error: "The ticket did not arrive." }, { status: 502 });
    }

    // The tmux session is per PROJECT, so reopening the dock reattaches to the
    // shell it left instead of opening a fresh one over the user's work — the
    // same property console.hanzo.ai's dock has, spelled with this app's name.
    const tmux = `app-${(project || box).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48)}`;
    return NextResponse.json({
      sandbox: box,
      src: terminalFor(HANZO_AI_BASE_URL, box, pass.ticket, tmux),
    });
  } catch (e) {
    const why =
      e instanceof SandboxError ? e.message : "The sandbox did not answer. Try again.";
    return NextResponse.json({ error: why }, { status: 502 });
  }
}
