/**
 * @jest-environment node
 *
 * /v1/store/config — the "become a store" switch.
 *
 * This route writes the binding that decides WHICH ORG's Square account a
 * checkout is taken through, so the security contract is the point:
 *  - unauthenticated callers cannot bind anything;
 *  - `org` is the CALLER's org, never free-form body input — a body naming a
 *    different tenant is refused, or any user could point their project at
 *    someone else's store and collect payment through it;
 *  - space_id is required, because a binding with no project is unreachable.
 *
 * IAM userinfo is stubbed with MSW so the bearer can be made live or dead.
 */
// `jose` ships ESM that jest doesn't transform inside node_modules; org/server
// only needs `decodeJwt` (unverified claim decode), which is a base64url unwrap
// of the payload — mock it so the route chain loads under jest. Same shape as
// tests/integration/hanzo-edit-routes.test.ts.
jest.mock("jose", () => ({
  decodeJwt: (t: string) =>
    JSON.parse(
      Buffer.from(String(t).split(".")[1] || "", "base64url").toString("utf8") || "{}",
    ),
}));

// @hanzo/base@0.2.1 is installed but its ESM exports map does not resolve under
// jest's resolver (same class of problem as `jose` above, not a missing dep).
// Every case here is refused BEFORE any Base call, so a bare stub is enough to
// let the route chain load — and if a case ever did reach Base, this throws
// rather than silently passing.
jest.mock(
  "@hanzo/base",
  () => ({
    BaseClient: class {
      constructor() {
        throw new Error("BaseClient must not be constructed in these authz tests");
      }
    },
  }),
  { virtual: true },
);

import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "../../../jest.setup";

import { GET, POST } from "@/app/v1/store/config/route";

const USERINFO = "https://hanzo.id/v1/iam/oauth/userinfo";

/** An unsigned JWT whose `owner` claim (the org) is `org`. decodeJwt reads it. */
function tokenFor(org: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none", typ: "JWT" })}.${b64({
    owner: org,
    name: "someone",
    email: "someone@example.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.`;
}

/** A non-localhost request, so the localhost dev affordance can never apply. */
function req(url: string, token?: string, body?: unknown): NextRequest {
  const headers = new Headers({ host: "hanzo.app" });
  if (token) headers.set("cookie", `hanzo_token=${token}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(`https://hanzo.app${url}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** userinfo answers 200 ⇒ the bearer is live. */
function iamLive() {
  return http.get(USERINFO, () =>
    HttpResponse.json({ sub: "someone", email: "someone@example.com" }),
  );
}

describe("/v1/store/config", () => {
  it("refuses an unauthenticated write — nobody binds a store anonymously", async () => {
    const res = await POST(req("/v1/store/config", undefined, { space_id: "acme/site" }));
    expect(res.status).toBe(401);
  });

  it("refuses a write whose bearer is not live (userinfo says no)", async () => {
    server.use(http.get(USERINFO, () => new HttpResponse(null, { status: 401 })));
    const res = await POST(
      req("/v1/store/config", tokenFor("orga"), { space_id: "acme/site" }),
    );
    expect(res.status).toBe(401);
  });

  it("refuses binding a project to SOMEONE ELSE's org", async () => {
    server.use(iamLive());
    const res = await POST(
      req("/v1/store/config", tokenFor("orga"), {
        space_id: "acme/site",
        org: "victim-org",
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: "org_forbidden" });
  });

  it("requires space_id — a binding with no project is unreachable", async () => {
    server.use(iamLive());
    const res = await POST(req("/v1/store/config", tokenFor("orga"), {}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "space_id_required" });
  });

  it("rejects an unknown mode rather than storing it", async () => {
    server.use(iamLive());
    const res = await POST(
      req("/v1/store/config", tokenFor("orga"), {
        space_id: "acme/site",
        mode: "wholesale",
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "invalid_mode" });
  });

  it("GET requires space_id", async () => {
    const res = await GET(req("/v1/store/config"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "space_id_required" });
  });
});
