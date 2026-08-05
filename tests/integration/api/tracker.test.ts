/**
 * @jest-environment node
 *
 * /v1/tracker[/...] — the work-item BFF.
 *
 * This route is a catch-all, which is the whole reason it needs its own suite:
 * the thing it forwards is caller-supplied, so the guard that keeps it under
 * `/v1/tracker` IS the trust boundary. Without it, `/v1/tracker/../iam/users`
 * reaches IAM with the caller's bearer attached.
 *
 * The contract asserted here:
 *  - no verified IAM session → 401, before any upstream call
 *  - a bearer IAM did not sign is not a session
 *  - a traversal never leaves the prefix, and never reaches the network
 *  - the user's bearer is forwarded; `X-Org-Id` is NOT, so tenancy stays
 *    gateway-minted (cloud strips and re-mints it from the token anyway, and a
 *    proxy that sends one is a proxy asking to be trusted about tenancy)
 *  - filters survive the hop, since a dropped `?status=` silently shows the
 *    wrong board
 *  - an upstream refusal passes through with its own status and body
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { clearJwksCache } from "@hanzo/iam/auth";

import { server } from "../../../jest.setup";
import { IAM, CLIENT_ID, iamHandlers, mint, forge } from "../../iam-fixture";

import { GET, POST, PATCH } from "@/app/v1/tracker/[[...path]]/route";

const CLOUD = "https://api.hanzo.ai/v1/tracker";

let AUTH: string;

beforeEach(async () => {
  process.env.IAM_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  delete process.env.CLOUD_API_URL;
  delete process.env.HANZO_API_URL;
  clearJwksCache();
  server.use(...(await iamHandlers()));
  AUTH = await mint({ owner: "acme" });
});

/** A request at the app's own origin — same-site, so the CSRF gate is a no-op. */
function req(
  path: string,
  init: { token?: string; body?: unknown; origin?: string } = {},
) {
  const headers = new Headers({ host: "hanzo.app" });
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  if (init.body !== undefined) headers.set("content-type", "application/json");
  headers.set("origin", init.origin ?? "https://hanzo.app");
  return new NextRequest(`https://hanzo.app${path}`, {
    method: init.body === undefined ? "GET" : "POST",
    headers,
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
}

/** The route's params, which Next hands over as a promise. */
const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });

describe("/v1/tracker — identity", () => {
  it("refuses a caller with no session", async () => {
    const res = await GET(req("/v1/tracker/projects"), ctx("projects"));
    expect(res.status).toBe(401);
  });

  it("refuses a bearer IAM did not sign", async () => {
    const res = await GET(
      req("/v1/tracker/projects", { token: forge(AUTH) }),
      ctx("projects"),
    );
    expect(res.status).toBe(401);
  });
});

describe("/v1/tracker — the prefix is the boundary", () => {
  it("refuses a traversal without touching the network", async () => {
    let reached = false;
    server.use(
      http.get("https://api.hanzo.ai/v1/iam/users", () => {
        reached = true;
        return HttpResponse.json({ users: [] });
      }),
    );

    const res = await GET(
      req("/v1/tracker/../iam/users", { token: AUTH }),
      ctx("..", "iam", "users"),
    );

    expect(res.status).toBe(400);
    expect(reached).toBe(false);
  });

  it("refuses an encoded traversal too", async () => {
    for (const seg of ["%2e%2e", "%2Fiam", "a;b"]) {
      const res = await GET(req("/v1/tracker/x", { token: AUTH }), ctx(seg));
      expect(res.status).toBe(400);
    }
  });
});

describe("/v1/tracker — the forward", () => {
  it("carries the bearer, sends no X-Org-Id, and does not cache", async () => {
    let seenAuth: string | null = null;
    let seenOrg: string | null = null;
    server.use(
      http.get(`${CLOUD}/projects`, ({ request }) => {
        seenAuth = request.headers.get("authorization");
        seenOrg = request.headers.get("x-org-id");
        return HttpResponse.json([{ id: "p1", org: "acme", key: "ENG", name: "platform" }]);
      }),
    );

    const res = await GET(req("/v1/tracker/projects", { token: AUTH }), ctx("projects"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenAuth).toBe(`Bearer ${AUTH}`);
    expect(seenOrg).toBeNull();
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(body[0].key).toBe("ENG");
  });

  it("keeps the filters — a dropped one shows the wrong board", async () => {
    let seen = "";
    server.use(
      http.get(`${CLOUD}/projects/ENG/issues`, ({ request }) => {
        seen = new URL(request.url).search;
        return HttpResponse.json([]);
      }),
    );

    const res = await GET(
      req("/v1/tracker/projects/ENG/issues?status=todo&source=agent", { token: AUTH }),
      ctx("projects", "ENG", "issues"),
    );

    expect(res.status).toBe(200);
    expect(seen).toContain("status=todo");
    expect(seen).toContain("source=agent");
  });

  it("passes a create through with its body and its 201", async () => {
    let sent: unknown = null;
    server.use(
      http.post(`${CLOUD}/projects/ENG/issues`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ id: "i1", identifier: "ENG-1" }, { status: 201 });
      }),
    );

    const res = await POST(
      req("/v1/tracker/projects/ENG/issues", {
        token: AUTH,
        body: { title: "ship the board", source: "agent", extRef: "session:s1" },
      }),
      ctx("projects", "ENG", "issues"),
    );

    expect(res.status).toBe(201);
    expect(sent).toMatchObject({ title: "ship the board", extRef: "session:s1" });
  });

  it("passes an upstream refusal through instead of calling it an outage", async () => {
    server.use(
      http.patch(`${CLOUD}/projects/ENG/issues/1`, () =>
        HttpResponse.json({ status: 400, code: "bad_request", error: "unknown status" }, { status: 400 }),
      ),
    );

    const res = await PATCH(
      req("/v1/tracker/projects/ENG/issues/1", { token: AUTH, body: { status: "nope" } }),
      ctx("projects", "ENG", "issues", "1"),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "unknown status" });
  });
});

describe("/v1/tracker — cross-origin", () => {
  it("refuses a cross-site write before any identity work", async () => {
    const res = await POST(
      req("/v1/tracker/projects", {
        token: AUTH,
        body: { name: "x" },
        origin: "https://evil.example",
      }),
      ctx("projects"),
    );
    expect(res.status).toBe(403);
  });
});
