"use client";

/**
 * Commit a finished turn to git.hanzo.ai — the project's version history.
 *
 * Every turn becomes a commit, so the history panel has real revisions to show,
 * to bookmark and to FORK from. Before this a project had no repo, so "version
 * history" meant browser checkpoints that died with the tab, and forking had
 * nothing durable to fork.
 *
 * FIRE-AND-FORGET, DELIBERATELY. The build is already done and on screen; a slow
 * or unreachable forge must not make the builder feel broken, and it must never
 * block the next prompt. What it must not do is fail SILENTLY — the caller gets
 * the outcome so the UI can say when history is not being written, rather than
 * implying a safety that is not there. That distinction is the whole lesson of
 * the status bar that read "Auto-saved" while nothing saved.
 *
 * Serialised per project: two turns committing at once would race the forge's
 * create-vs-update decision (it reads the tree, then writes), and the loser
 * fails the whole commit on a path the winner just created.
 */

export type CommitOutcome =
  | { ok: true; repo: string; commit: string | null }
  | { ok: false; reason: string; unconfigured?: boolean };

const inFlight = new Map<string, Promise<CommitOutcome>>();

export async function commitTurn(
  name: string,
  pages: { path: string; html: string }[],
  message: string,
  token?: string | null,
): Promise<CommitOutcome> {
  if (!pages.length) return { ok: false, reason: "nothing to commit" };

  const key = name || "untitled";
  const prior = inFlight.get(key);
  // Chain rather than drop: the LAST state of a project is the one worth having,
  // and dropping a turn would leave a gap in the history it exists to record.
  const run = (prior ? prior.catch(() => undefined) : Promise.resolve()).then(async () => {
    try {
      const res = await fetch("/v1/git/native", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, pages, message }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; repo?: string; commit?: string | null; message?: string }
        | null;
      if (res.status === 501) {
        // The forge is not wired on this deployment. Not an error the user did.
        return { ok: false as const, reason: body?.message || "git is not configured", unconfigured: true };
      }
      if (!res.ok || !body?.ok) {
        return { ok: false as const, reason: body?.message || `git returned ${res.status}` };
      }
      return { ok: true as const, repo: body.repo ?? key, commit: body.commit ?? null };
    } catch (e) {
      return { ok: false as const, reason: e instanceof Error ? e.message : "git unreachable" };
    }
  });

  inFlight.set(key, run);
  try {
    return await run;
  } finally {
    if (inFlight.get(key) === run) inFlight.delete(key);
  }
}
