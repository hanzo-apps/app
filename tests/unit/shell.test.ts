import { HOME, unwrap, wrap } from "@/lib/shell";

/**
 * The shell's whole claim is that `cd` means something. Cloud runs each command
 * as its own process, so that claim rests entirely on wrap/unwrap — which makes
 * this the one part of the feature that can silently lie.
 */
describe("carrying the working directory", () => {
  it("starts where the last command finished", () => {
    expect(wrap("ls", "/work/site")).toContain("cd '/work/site'");
  });

  it("falls back HOME rather than refusing to run", () => {
    // A command can delete the directory it ran in. `&&` would strand the shell
    // with no way to type its way out, so the fallback is part of the contract.
    const w = wrap("ls", "/gone");
    expect(w).toContain(`|| cd '${HOME}'`);
    expect(w).not.toContain("&& ls");
  });

  it("reports the status of the COMMAND, not of the marker", () => {
    const w = wrap("false", HOME);
    // printf succeeds; capturing $? before it is what keeps `exit 1` truthful.
    expect(w.indexOf("__hz=$?")).toBeLessThan(w.indexOf("printf"));
    expect(w.trimEnd().endsWith("exit $__hz")).toBe(true);
  });

  it("quotes a directory that would otherwise end the command", () => {
    // The path comes back from the sandbox, and a directory may legally be
    // named `'; rm -rf /`. It is spliced into a command line either way.
    const w = wrap("ls", `/tmp/'; rm -rf /`);
    expect(w).toContain(`cd '/tmp/'\\''; rm -rf /'`);
    expect(w.split("\n")[0]).not.toMatch(/rm -rf \/$/);
  });

  it("round-trips: what wrap sends, unwrap reads back", () => {
    // The marker is an implementation detail of the pair — assert the PAIR,
    // never the literal, so the two cannot drift apart.
    const printed = wrap("pwd", "/work").split("\n")[3];
    // The marker is the quoted token the printf prepends to $PWD — the only
    // single-quoted argument ending in a colon.
    const marker = printed.match(/'([^']*:)'/)![1];
    expect(unwrap(`hello\n${marker}/work/site\n`)).toEqual({
      out: "hello",
      cwd: "/work/site",
    });
  });
});

describe("splitting the marker off the output", () => {
  const mark = (cwd: string) => `\n__hanzo_cwd__:${cwd}\n`;

  it("keeps the command's own output intact", () => {
    expect(unwrap(`a\nb${mark("/x")}`)).toEqual({ out: "a\nb", cwd: "/x" });
  });

  it("does not truncate a command that PRINTS the marker", () => {
    // `cat lib/shell.ts` echoes the marker mid-stream. Anchoring on the first
    // occurrence would swallow everything after it.
    const out = `__hanzo_cwd__:decoy\nstill here`;
    expect(unwrap(`\n${out}${mark("/real")}`).cwd).toBe("/real");
    expect(unwrap(`\n${out}${mark("/real")}`).out).toContain("still here");
  });

  it("returns everything when the marker never arrived", () => {
    // A killed shell or a timed-out sandbox never printed one; the caller keeps
    // the directory it had rather than being sent home silently.
    expect(unwrap("partial output")).toEqual({ out: "partial output", cwd: "" });
  });

  it("survives an empty command output", () => {
    expect(unwrap(mark("/only"))).toEqual({ out: "", cwd: "/only" });
  });
});
