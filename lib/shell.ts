/**
 * The builder's shell: one command, in the project's own sandbox.
 *
 * The sandbox runs each command as its OWN process — `session` on cloud's `/run`
 * is a narration channel (it copies output into a run's log as it is produced),
 * not a PTY. So nothing survives between commands on its own, and a surface that
 * called itself a shell while `cd` silently did nothing would be lying in the
 * most ordinary way a person could discover.
 *
 * The working directory is therefore carried by the CALLER and re-applied here,
 * which is the whole of the state this shell claims to keep. Environment
 * variables and background jobs do not survive, and nothing pretends they do.
 */

/**
 * Marks the working directory on the last line of stdout.
 *
 * A separate `pwd` exec would be a second round trip AND a race — the command
 * that just ran could have changed the directory again — so the report rides
 * out with the command that produced it. The marker is stripped before a single
 * byte reaches the reader.
 */
const CWD = "__hanzo_cwd__:";

/** Where a shell starts, and what it falls back to when a directory goes away. */
export const HOME = ".";

/**
 * How long one typed command may run.
 *
 * Shorter than the agent's budget, deliberately: a person is watching this one,
 * and a shell that appears hung for two minutes reads as broken. Long enough for
 * an install; a build belongs to the agent, which has its own.
 *
 * Declared here because BOTH sides say it — the route enforces it and the prompt
 * names it in the line it prints when a command runs out of time.
 */
export const TIMEOUT = 60;

/**
 * Wrap one typed command so it starts where the last one finished and reports
 * where it left off.
 *
 * `cd || cd HOME` rather than `cd &&`: a directory can be deleted by the very
 * command that was run in it, and refusing to run ANYTHING afterwards would
 * strand the shell with no way to type its way out. Falling back to the project
 * root keeps it usable and the printed prompt shows where it landed.
 *
 * The exit status is captured BEFORE the marker is printed, because `printf`
 * succeeds and would otherwise overwrite the status the reader is waiting for.
 */
export function wrap(command: string, cwd: string): string {
  const start = cwd.trim() || HOME;
  return [
    `cd ${quote(start)} 2>/dev/null || cd ${quote(HOME)}`,
    command,
    `__hz=$?`,
    `printf '\\n%s%s\\n' ${quote(CWD)} "$PWD"`,
    `exit $__hz`,
  ].join("\n");
}

/**
 * Single-quote for `sh`.
 *
 * A path is not ours to trust just because it came back from our own marker: the
 * shell that produced it will accept a directory named `'; rm -rf /`, and this
 * value is spliced into a command line. The one escape a POSIX single-quoted
 * string needs is closing it around each embedded quote.
 */
function quote(s: string): string {
  return `'${s.replaceAll("'", `'\\''`)}'`;
}

/**
 * Split the marker back off the command's own output.
 *
 * Only a marker at the very END counts, and it is searched for with
 * `lastIndexOf`: a command that PRINTS the marker (`cat` of this file, say)
 * would otherwise truncate its own output at the first mention. If the marker
 * is absent — the command killed the shell, or the sandbox timed out — the
 * output is returned whole and the caller keeps the directory it had.
 */
export function unwrap(stdout: string): { out: string; cwd: string } {
  const at = stdout.lastIndexOf(`\n${CWD}`);
  if (at === -1) return { out: stdout, cwd: "" };
  const line = stdout.slice(at + 1 + CWD.length);
  if (line.includes("\n") && line.trimEnd().includes("\n")) {
    // Something followed the marker, so this was the command's own text.
    return { out: stdout, cwd: "" };
  }
  return { out: stdout.slice(0, at), cwd: line.trim() };
}
