/**
 * @jest-environment node
 *
 * BFF tests for POST /v1/feedback — the content-free reward-signal proxy.
 *
 * The security-critical contract:
 *  - forwards to `${HANZO_AI_BASE_URL}/feedback` with the user's bearer and a
 *    body containing EXACTLY {request_id, signal[, rating]} — any extra/content
 *    field the client tries to smuggle is STRIPPED and never transits
 *  - missing/invalid signal → 400 (nothing forwarded)
 *  - `HANZO_FEEDBACK=0` local kill-switch → 204, nothing forwarded
 *  - an upstream error is swallowed: the route still answers 204, never throws
 *  - a cross-site Origin (CSRF) is refused before the token or gateway is touched
 *
 * The upstream gateway is stubbed with MSW; we capture the outbound request to
 * inspect exactly what the proxy sent.
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "../../../jest.setup";

import { POST as feedback } from "@/app/v1/feedback/route";

const GATEWAY = "https://api.hanzo.ai/v1";

type ReqInit = { body?: unknown; headers?: HeadersInit; token?: string };

function req(init?: ReqInit) {
  const { token, body, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (token) headers.set("cookie", `hanzo_token=${token}`);
  // Default to same-origin so the CSRF guard passes unless a test overrides it.
  if (!headers.has("origin")) headers.set("origin", "http://localhost");
  headers.set("host", "localhost");
  return new NextRequest("http://localhost/v1/feedback", {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("BFF: POST /v1/feedback", () => {
  const OLD_ENV = process.env.HANZO_FEEDBACK;
  afterEach(() => {
    if (OLD_ENV === undefined) delete process.env.HANZO_FEEDBACK;
    else process.env.HANZO_FEEDBACK = OLD_ENV;
  });

  it("forwards ONLY {request_id, signal} with the bearer; strips content fields", async () => {
    let seenAuth: string | null = null;
    let seenBody: any = null;
    server.use(
      http.post(`${GATEWAY}/feedback`, async ({ request }) => {
        seenAuth = request.headers.get("authorization");
        seenBody = await request.json();
        return new HttpResponse(null, { status: 202 });
      })
    );

    const res = await feedback(
      req({
        token: "tok-abc",
        body: {
          request_id: "chatcmpl-xyz",
          signal: "up",
          // hostile extras that must NEVER be forwarded:
          prompt: "build me a landing page",
          html: "<h1>secret</h1>",
          filename: "index.html",
          rating: 3,
        },
      })
    );

    expect(res.status).toBe(204);
    expect(seenAuth).toBe("Bearer tok-abc");
    // Exactly the whitelisted fields — rating dropped because signal !== "rating".
    expect(seenBody).toEqual({ request_id: "chatcmpl-xyz", signal: "up" });
    expect(Object.keys(seenBody)).toEqual(["request_id", "signal"]);
  });

  it("forwards rating ONLY for the rating signal", async () => {
    let seenBody: any = null;
    server.use(
      http.post(`${GATEWAY}/feedback`, async ({ request }) => {
        seenBody = await request.json();
        return new HttpResponse(null, { status: 202 });
      })
    );

    const res = await feedback(
      req({ token: "tok-abc", body: { request_id: "chatcmpl-r", signal: "rating", rating: 2 } })
    );

    expect(res.status).toBe(204);
    expect(seenBody).toEqual({ request_id: "chatcmpl-r", signal: "rating", rating: 2 });
  });

  it("rejects a missing/invalid signal with 400 (nothing forwarded)", async () => {
    let hit = false;
    server.use(
      http.post(`${GATEWAY}/feedback`, () => {
        hit = true;
        return new HttpResponse(null, { status: 202 });
      })
    );

    const missing = await feedback(req({ token: "tok-abc", body: { request_id: "chatcmpl-a" } }));
    expect(missing.status).toBe(400);

    const invalid = await feedback(
      req({ token: "tok-abc", body: { request_id: "chatcmpl-a", signal: "explode" } })
    );
    expect(invalid.status).toBe(400);

    // rating signal without a valid rating is also a 400
    const badRating = await feedback(
      req({ token: "tok-abc", body: { request_id: "chatcmpl-a", signal: "rating", rating: 9 } })
    );
    expect(badRating.status).toBe(400);

    expect(hit).toBe(false);
  });

  it("no-ops (204, no forward) when HANZO_FEEDBACK is off", async () => {
    let hit = false;
    server.use(
      http.post(`${GATEWAY}/feedback`, () => {
        hit = true;
        return new HttpResponse(null, { status: 202 });
      })
    );
    process.env.HANZO_FEEDBACK = "0";

    const res = await feedback(
      req({ token: "tok-abc", body: { request_id: "chatcmpl-off", signal: "accept" } })
    );

    expect(res.status).toBe(204);
    expect(hit).toBe(false);
  });

  it("swallows an upstream error: still 204, never throws", async () => {
    server.use(
      http.post(`${GATEWAY}/feedback`, () => HttpResponse.json({ error: "boom" }, { status: 500 }))
    );

    const res = await feedback(
      req({ token: "tok-abc", body: { request_id: "chatcmpl-err", signal: "regenerate" } })
    );

    expect(res.status).toBe(204);
  });

  it("no-ops (204) with no signed-in user — nothing to attribute", async () => {
    let hit = false;
    server.use(
      http.post(`${GATEWAY}/feedback`, () => {
        hit = true;
        return new HttpResponse(null, { status: 202 });
      })
    );

    const res = await feedback(req({ body: { request_id: "chatcmpl-anon", signal: "up" } }));
    expect(res.status).toBe(204);
    expect(hit).toBe(false);
  });

  it("refuses a cross-site Origin (CSRF) before touching the token or gateway", async () => {
    let hit = false;
    server.use(
      http.post(`${GATEWAY}/feedback`, () => {
        hit = true;
        return new HttpResponse(null, { status: 202 });
      })
    );

    const res = await feedback(
      req({
        token: "tok-abc",
        headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
        body: { request_id: "chatcmpl-x", signal: "up" },
      })
    );

    expect(res.status).toBe(403);
    expect(hit).toBe(false);
  });
});
