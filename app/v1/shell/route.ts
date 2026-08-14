/**
 * /v1/shell — run one typed command in the project's own sandbox.
 *
 * The agent has been able to run commands in these sandboxes all along; this
 * lends the same door to the person, and nothing more. Ownership is not asserted
 * here: the caller's IAM session is forwarded and CLOUD decides which sandbox
 * this identity may open, exactly as `/v1/agents/runs` does. A sandbox id in the
 * body is therefore not a capability — cloud refuses one that is not the
 * caller's.
 *
 * The response carries the sandbox id back so the next command lands in the SAME
 * pod. Without that every line would open a new one, which loses the filesystem
 * the person is standing in and bills a pod per keystroke.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { Sandbox, openSandbox, SandboxError } from "@/lib/agent/sandbox";
import { session } from "@/lib/iam";
import { slugifyProject } from "@/lib/org/policy";
import { HOME, TIMEOUT, unwrap, wrap } from "@/lib/shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || "https://api.hanzo.ai/v1";

/** A command longer than this is not typing, it is a paste of something else. */
const MAX_COMMAND = 4000;

function text(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(request: NextRequest) {
  const id = await session(request);
  if (!id?.token) {
    return NextResponse.json({ error: "Sign in to use the shell." }, { status: 401 });
  }
  const token = id.token;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const command = text(body.command).trim();
  if (!command) {
    return NextResponse.json({ error: "No command." }, { status: 400 });
  }
  if (command.length > MAX_COMMAND) {
    return NextResponse.json(
      { error: `That command is ${command.length} characters; the limit is ${MAX_COMMAND}.` },
      { status: 400 },
    );
  }

  const project = text(body.project).trim();
  const held = text(body.sandbox).trim();
  if (!project && !held) {
    return NextResponse.json(
      { error: "The shell runs inside a project. Open one first." },
      { status: 400 },
    );
  }

  try {
    // A held id is reused as-is. Only the first command of a session pays for
    // `openSandbox`, which gets-or-creates the project's sandbox.
    let box = held;
    if (!box) {
      const slug = slugifyProject(project);
      const opened = await openSandbox({
        baseUrl: HANZO_AI_BASE_URL,
        token,
        project,
        // The same repo the coding agent clones, so a person typing `ls` in the
        // terminal and the agent editing the project are standing in ONE tree.
        ...(id.name && slug ? { repo: { owner: id.name, name: slug } } : {}),
      });
      if ("why" in opened) {
        // Cloud's own sentence — a quota, a cold pull, a refused runtime. It is
        // what the person needs to read, so it travels unchanged.
        return NextResponse.json({ error: opened.why }, { status: 502 });
      }
      box = opened.sandbox.id;
    }

    const sandbox = new Sandbox({ baseUrl: HANZO_AI_BASE_URL, id: box, token });
    const cwd = text(body.cwd).trim() || HOME;
    const r = await sandbox.exec(wrap(command, cwd), TIMEOUT);
    const { out, cwd: landed } = unwrap(r.stdout);

    return NextResponse.json({
      sandbox: box,
      // An unreported directory means the shell never got to print one; keeping
      // the one the caller had is better than silently sending them home.
      cwd: landed || cwd,
      stdout: out,
      stderr: r.stderr,
      exitCode: r.exitCode,
      timedOut: r.timedOut,
    });
  } catch (e) {
    // SandboxError carries what the service SAID. A shell whose sandbox died
    // mid-command needs that sentence, not a status code.
    const why =
      e instanceof SandboxError
        ? e.message
        : "The sandbox did not answer. Try the command again.";
    return NextResponse.json({ error: why }, { status: 502 });
  }
}
