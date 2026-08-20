/**
 * The cloud shell's contract — the same terminal console.hanzo.ai frames, in
 * this app's dock. These pin the properties that would fail silently:
 *
 * - The bearer stays server-side. The BFF mints the single-use ticket and the
 *   framed URL's only credential is `ticket=` — an Authorization header in the
 *   client, or a token query param in the URL, would ship the session to
 *   anything that can read an iframe src.
 * - The frame's readiness handshake only listens to the frame we opened, from
 *   the origin that serves it.
 * - The pod is SHARED with the line-prompt (currentSandbox in, holdSandbox
 *   out) — two sandboxes would mean `ls` answers differently in two shells.
 * - The dock swaps its BODY, never its bar: the prompt hides while the real
 *   terminal (which brings its own) is up.
 */


import { read } from "../source";



describe("/v1/shell/terminal — the ticket stays a ticket", () => {
  const route = read("app/v1/shell/terminal/route.ts");

  it("mints the ticket server-side, with the lent session", () => {
    expect(route).toContain("/terminal/ticket`");
    expect(route).toContain("Authorization: `Bearer ${token}`");
  });

  it("the framed URL carries the ticket and never the bearer", () => {
    expect(route).toContain("?ticket=${encodeURIComponent(ticket)}");
    expect(route).not.toMatch(/token=\$\{/);
  });

  it("reuses the held sandbox and clones the project repo on first open", () => {
    expect(route).toContain("text(body.sandbox)");
    expect(route).toContain("openSandbox({");
    expect(route).toContain("repo: { owner: id.name, name: slug }");
  });

  it("names the tmux session per project, so reopening reattaches", () => {
    expect(route).toMatch(/`app-\$\{/);
  });
});

describe("the dock's terminal face", () => {
  const client = read("components/editor/console/terminal.tsx");
  const dock = read("components/editor/console/index.tsx");

  it("asks the BFF, never the API host directly", () => {
    expect(client).toContain('fetch("/v1/shell/terminal"');
    expect(client).not.toContain("api.hanzo.ai");
  });

  it("shares the pod with the line-prompt", () => {
    expect(client).toContain("currentSandbox()");
    expect(client).toContain("holdSandbox(body.sandbox)");
  });

  it("only the opened frame, from its own origin, may say ready", () => {
    expect(client).toContain("e.source !== frame.current?.contentWindow");
    expect(client).toContain("new URL(at).origin !== e.origin");
    expect(client).toContain('"hanzo-term"');
  });

  it("the dock swaps its body: prompt and log hide while the terminal is up", () => {
    expect(dock).toContain("{open && term && (");
    expect(dock).toContain("{open && !term && (");
    // The prompt renders only on the log face — a real terminal brings its own.
    const promptFace = dock.split("<Prompt />")[0];
    expect(promptFace.lastIndexOf("{open && !term && (")).toBeGreaterThan(
      promptFace.lastIndexOf("{open && term && ("),
    );
  });

  it("the toggle states what it is, in console.hanzo.ai's words", () => {
    expect(dock).toContain("Open a cloud shell — a real terminal in your sandbox");
  });
});
