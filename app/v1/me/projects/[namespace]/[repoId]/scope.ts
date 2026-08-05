/**
 * The signed-in caller and the project they are addressing — the one question
 * every per-project route below this folder has to answer before it can act.
 *
 * There used to be three copies of it, and each answered a missing row with a
 * 404. That was the wrong answer: the row is not evidence the project exists,
 * it is just where this app keeps its own notes about it, and nothing on the
 * drafting or publishing path ever wrote one. So the 404 is now a create — see
 * `ensureProject`. Signing in is still required, and it is the only thing that is.
 */
import { NextRequest, NextResponse } from "next/server";

import { session, type Session } from "@/lib/iam";
import { ensureProject, spaceId } from "@/lib/db/projects";

export type Ctx = { params: Promise<{ namespace: string; repoId: string }> };

export type Scope = { fail: NextResponse } | { user: Session; key: string };

export async function scope(req: NextRequest, ctx: Ctx): Promise<Scope> {
  const user = await session(req);
  if (!user) {
    return { fail: NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 }) };
  }

  const { namespace, repoId } = await ctx.params;
  const key = spaceId(namespace, repoId);

  // The store is the only thing that can refuse now, and when it does it is
  // unavailable rather than empty — so say that, instead of "not found".
  if (!(await ensureProject(user.token, user.sub, key))) {
    return {
      fail: NextResponse.json(
        { ok: false, error: "Could not open that project. Please try again." },
        { status: 502 }
      ),
    };
  }

  return { user, key };
}
