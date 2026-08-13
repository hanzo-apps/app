/**
 * @jest-environment node
 */

/**
 * /v1/shell/screen — the two answers a screen has to get right that a terminal
 * never has to think about.
 *
 * Every sandbox has a shell, so /v1/shell/terminal can open whatever the project
 * is already running and be correct. Only a `desktop` sandbox has an X server,
 * and the two ways that goes wrong both LOOK like a working screen:
 *
 *   1. The project already holds a `dev` sandbox. Cloud allows one live sandbox
 *      per project and matches it on the project alone, so asking for `desktop`
 *      hands back the `dev` box through the 409 path with no complaint. Frame it
 *      and the page dials a port nothing listens on: "connection failed", from a
 *      pod that is perfectly healthy.
 *
 *   2. This cloud does not register the screen doors. The code is merged and the
 *      deployed binary predates it — measured 2026-08-13, `GET /v1/sandboxes/
 *      m_probe/terminal` is 200 while `/screen` is 404 — so the mint 404s. Cloud
 *      answers an unknown sandbox with 403 (an id is not a capability, so a miss
 *      must not confirm one exists), which is what makes 404 unambiguous: it is
 *      the route missing, not the box.
 *
 * Both are pinned here because both are silent, and a silent wrong answer is the
 * one a test has to hold.
 */

jest.mock("@/lib/iam", () => ({
  session: async () => ({ token: "a-verified-iam-token", sub: "u_1", name: "z" }),
}));

const opened = jest.fn();
jest.mock("@/lib/agent/sandbox", () => ({
  openSandbox: (...a: unknown[]) => opened(...a),
  SandboxError: class SandboxError extends Error {},
}));

import { NextRequest } from "next/server";

import { POST } from "@/app/v1/shell/screen/route";

const ask = (body: unknown) =>
  POST(
    new NextRequest("https://hanzo.app/v1/shell/screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  opened.mockReset();
  global.fetch = jest.fn();
});

describe("the class it got, not the class it asked for", () => {
  it("asks for a desktop, because only a desktop has a display", async () => {
    opened.mockResolvedValue({ sandbox: { id: "m_1", class: "desktop" } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ url: "/v1/sandboxes/m_1/screen?ticket=t0k3n" }),
    });
    await ask({ project: "site" });
    expect(opened.mock.calls[0][0]).toMatchObject({ class: "desktop", project: "site" });
  });

  it("refuses a dev sandbox by name instead of framing a dead port", async () => {
    opened.mockResolvedValue({ sandbox: { id: "m_1", class: "dev" } });
    const res = await ask({ project: "site" });
    expect(res.status).toBe(409);
    const body = await res.json();
    // The sentence has to carry the class and the way out, or the reader is left
    // with a refusal and no next move.
    expect(body.error).toContain("dev");
    expect(body.error).toMatch(/no display/i);
    expect(body.class).toBe("dev");
    // And it must not have spent a ticket on a box it was about to refuse.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("accepts a row that does not state its class — absent is not wrong", async () => {
    opened.mockResolvedValue({ sandbox: { id: "m_1" } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ url: "/v1/sandboxes/m_1/screen?ticket=t0k3n" }),
    });
    expect((await ask({ project: "site" })).status).toBe(200);
  });
});

describe("what the mint's answer means", () => {
  it("calls a 404 what it is: this cloud has no screen doors", async () => {
    opened.mockResolvedValue({ sandbox: { id: "m_1", class: "desktop" } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "",
    });
    const res = await ask({ project: "site" });
    expect(res.status).toBe(501);
    expect((await res.json()).error).toMatch(/does not serve screens yet/i);
  });

  it("passes a refusal through as a refusal", async () => {
    opened.mockResolvedValue({ sandbox: { id: "m_1", class: "desktop" } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => "sandbox is pending",
    });
    const res = await ask({ project: "site" });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("sandbox is pending");
  });

  it("frames the path cloud minted, joined to the API origin", async () => {
    opened.mockResolvedValue({ sandbox: { id: "m_1", class: "desktop" } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ url: "/v1/sandboxes/m_1/screen?ticket=t0k3n" }),
    });
    const body = await (await ask({ project: "site" })).json();
    // The /v1 on the base must not double: a leading-slash path resolves against
    // the origin, which is the whole reason this is a URL join and not a concat.
    expect(body.src).toBe("https://api.hanzo.ai/v1/sandboxes/m_1/screen?ticket=t0k3n");
    expect(body.sandbox).toBe("m_1");
  });

  it("reuses a held sandbox without opening a second one", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ url: "/v1/sandboxes/m_held/screen?ticket=t" }),
    });
    const res = await ask({ sandbox: "m_held" });
    expect(res.status).toBe(200);
    expect(opened).not.toHaveBeenCalled();
  });
});

describe("the door is shut without a project", () => {
  it("says a screen belongs to a project", async () => {
    const res = await ask({});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/project/i);
  });
});
