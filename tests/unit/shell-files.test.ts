import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "../../app/v1/shell/files/route.ts"),
  "utf8",
);

/**
 * The sandbox-file door, pinned at the properties that make it safe to have.
 *
 * Source-level, like adapter-routes-authed: the route's behaviour is four
 * decisions (who may call, which pod, which paths, which bytes) and each is a
 * line a refactor could drop without breaking a type.
 */
describe("/v1/shell/files", () => {
  it("requires a session before anything else", () => {
    expect(src).toMatch(/session\(request\)/);
    expect(src).toMatch(/status:\s*401/);
  });

  it("never OPENS a sandbox — it only reads one already held", () => {
    // A listing endpoint that get-or-creates pods bills one per curious click.
    // /v1/shell pays for openSandbox on the first command; this surface must
    // not have that power at all.
    expect(src).not.toMatch(/openSandbox/);
    expect(src).toMatch(/Name the sandbox/);
  });

  it("refuses traversal, absolute paths, and option-shaped names", () => {
    // The path is spliced (quoted) into `base64 < <path>`. Quoting stops the
    // SHELL from parsing it; a leading dash would still reach the command as
    // an option, and `..` reaches out of the workspace.
    expect(src).toMatch(/startsWith\("\/"\)/);
    expect(src).toMatch(/startsWith\("-"\)/);
    expect(src).toMatch(/includes\("\.\."\)/);
  });

  it("moves bytes as base64 through exec, never Sandbox.read", () => {
    // `read` returns a string, and a string round-trip is lossy for binary —
    // a .pptx is a zip, and one mangled byte is a file PowerPoint refuses.
    expect(src).toMatch(/base64 </);
    expect(src).not.toMatch(/sandbox\.read\(/);
  });

  it("quotes the path with the shell's own quoter", () => {
    expect(src).toMatch(/quote\(path\)/);
    expect(src).toMatch(/from "@\/lib\/shell"/);
  });

  it("caps the download and says the number in the refusal", () => {
    expect(src).toMatch(/MAX_BYTES = 25 \* 1024 \* 1024/);
    expect(src).toMatch(/status:\s*413/);
  });

  it("serves an attachment, uncached", () => {
    expect(src).toMatch(/Content-Disposition/);
    expect(src).toMatch(/no-store/);
  });
});
