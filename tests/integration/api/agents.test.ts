/**
 * @jest-environment node
 *
 * BFF proxy tests for /v1/agents and /v1/agents/:name/run.
 *
 * These assert the security-critical contract of the console→cloud seam:
 *  - no `hanzo_token` cookie → honest 401 with `openLogin` (fail closed)
 *  - the signed-in user's bearer is forwarded to the gateway
 *  - the browser can NOT smuggle an `X-Org-Id`: the proxy never forwards one,
 *    so tenant scoping stays gateway-minted (HIP-0026)
 *  - gateway 401/403 collapses to `openLogin`; the run route passes the
 *    upstream status through so recorded failures surface honestly.
 *
 * The upstream gateway is stubbed with MSW; we capture the outbound request
 * to inspect exactly what the proxy sent.
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "../../../jest.setup";

import { GET as listAgents } from "@/app/v1/agents/route";
import { POST as runAgent } from "@/app/v1/agents/[name]/run/route";

const GATEWAY = "https://api.hanzo.ai/v1";

type ReqInit = {
  method?: string;
  body?: string;
  headers?: HeadersInit;
  token?: string;
};

function req(url: string, init?: ReqInit) {
  const { token, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (token) headers.set("cookie", `hanzo_token=${token}`);
  return new NextRequest(url, { ...rest, headers });
}

describe("BFF: GET /v1/agents", () => {
  it("returns 401 openLogin when no token cookie is present", async () => {
    const res = await listAgents(req("http://localhost/v1/agents"));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body).toMatchObject({ ok: false, openLogin: true });
  });

  it("forwards the user's bearer and NEVER sends X-Org-Id", async () => {
    let seenAuth: string | null = null;
    let seenOrg: string | null = null;
    server.use(
      http.get(`${GATEWAY}/agents`, ({ request }) => {
        seenAuth = request.headers.get("authorization");
        seenOrg = request.headers.get("x-org-id");
        return HttpResponse.json({
          agents: [{ id: "agent_1", name: "helper", model: "gpt-4o-mini", tools: [], status: "ready", runs: 2, createdAt: "", updatedAt: "" }],
        });
      })
    );

    const res = await listAgents(
      req("http://localhost/v1/agents", { token: "tok-abc" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenAuth).toBe("Bearer tok-abc");
    expect(seenOrg).toBeNull(); // tenancy is gateway-minted, not client-supplied
    expect(res.headers.get("cache-control")).toBe("no-store"); // no shared-cache tenant leak
    expect(body.ok).toBe(true);
    expect(body.agents).toHaveLength(1);
    expect(body.agents[0].name).toBe("helper");
  });

  it("collapses gateway 403 to 401 openLogin", async () => {
    server.use(
      http.get(`${GATEWAY}/agents`, () =>
        HttpResponse.json({ error: "forbidden" }, { status: 403 })
      )
    );
    const res = await listAgents(
      req("http://localhost/v1/agents", { token: "tok-abc" })
    );
    expect(res.status).toBe(401);
    expect((await res.json()).openLogin).toBe(true);
  });

  it("returns 502 on an unexpected gateway error", async () => {
    server.use(
      http.get(`${GATEWAY}/agents`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 })
      )
    );
    const res = await listAgents(
      req("http://localhost/v1/agents", { token: "tok-abc" })
    );
    expect(res.status).toBe(502);
    expect((await res.json()).ok).toBe(false);
  });
});

describe("BFF: POST /v1/agents/:name/run", () => {
  const params = (name: string) => ({ params: Promise.resolve({ name }) });

  it("returns 401 openLogin when no token cookie is present", async () => {
    const res = await runAgent(
      req("http://localhost/v1/agents/helper/run", {
        method: "POST",
        body: JSON.stringify({ input: "hi" }),
      }),
      params("helper")
    );
    expect(res.status).toBe(401);
    expect((await res.json()).openLogin).toBe(true);
  });

  it("rejects a path-traversal agent name before hitting the gateway", async () => {
    const res = await runAgent(
      req("http://localhost/v1/agents/..%2Fx/run", {
        method: "POST",
        token: "tok-abc",
        body: JSON.stringify({ input: "hi" }),
      }),
      params("../x")
    );
    expect(res.status).toBe(400);
  });

  it("forwards {input} + bearer and returns the recorded run on success", async () => {
    let seenAuth: string | null = null;
    let seenBody: unknown = null;
    server.use(
      http.post(`${GATEWAY}/agents/helper/run`, async ({ request }) => {
        seenAuth = request.headers.get("authorization");
        seenBody = await request.json();
        return HttpResponse.json({
          id: "run_1", status: "ok", model: "gpt-4o-mini",
          input: "hi", output: "the answer", durationMs: 42, createdAt: "",
        });
      })
    );

    const res = await runAgent(
      req("http://localhost/v1/agents/helper/run", {
        method: "POST",
        token: "tok-abc",
        body: JSON.stringify({ input: "hi" }),
      }),
      params("helper")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenAuth).toBe("Bearer tok-abc");
    expect(seenBody).toEqual({ input: "hi" });
    expect(body.status).toBe("ok");
    expect(body.output).toBe("the answer");
  });

  it("passes the upstream status through for a recorded failure (502)", async () => {
    server.use(
      http.post(`${GATEWAY}/agents/helper/run`, () =>
        HttpResponse.json(
          { id: "run_2", status: "error", model: "m", input: "hi", error: "upstream down", durationMs: 5, createdAt: "" },
          { status: 502 }
        )
      )
    );
    const res = await runAgent(
      req("http://localhost/v1/agents/helper/run", {
        method: "POST",
        token: "tok-abc",
        body: JSON.stringify({ input: "hi" }),
      }),
      params("helper")
    );
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.status).toBe("error");
    expect(body.error).toBe("upstream down");
  });

  it("refuses a cross-site Origin (CSRF) before touching the token or gateway", async () => {
    let hitGateway = false;
    server.use(
      http.post(`${GATEWAY}/agents/helper/run`, () => {
        hitGateway = true;
        return HttpResponse.json({ id: "run_x", status: "ok" });
      })
    );
    const res = await runAgent(
      req("http://localhost/v1/agents/helper/run", {
        method: "POST",
        token: "tok-abc", // valid cookie present — the CSRF guard must still win
        headers: { origin: "https://evil.example", "x-forwarded-host": "localhost" },
        body: JSON.stringify({ input: "hi" }),
      }),
      params("helper")
    );
    expect(res.status).toBe(403);
    expect(hitGateway).toBe(false); // the victim's run was never executed
  });

  it("allows a same-origin Origin and forwards the run", async () => {
    server.use(
      http.post(`${GATEWAY}/agents/helper/run`, () =>
        HttpResponse.json({ id: "run_ok", status: "ok", output: "ran", durationMs: 1, createdAt: "" })
      )
    );
    const res = await runAgent(
      req("http://localhost/v1/agents/helper/run", {
        method: "POST",
        token: "tok-abc",
        headers: { origin: "http://localhost", "x-forwarded-host": "localhost" },
        body: JSON.stringify({ input: "hi" }),
      }),
      params("helper")
    );
    expect(res.status).toBe(200);
    expect((await res.json()).output).toBe("ran");
  });

  it("marks per-user responses no-store (no shared-cache tenant leak)", async () => {
    server.use(
      http.post(`${GATEWAY}/agents/helper/run`, () =>
        HttpResponse.json({ id: "run_ok", status: "ok", output: "ran", durationMs: 1, createdAt: "" })
      )
    );
    const res = await runAgent(
      req("http://localhost/v1/agents/helper/run", {
        method: "POST",
        token: "tok-abc",
        body: JSON.stringify({ input: "hi" }),
      }),
      params("helper")
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
