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
 * Tokens are signed by an in-process IAM (tests/iam-fixture) and verified for
 * real, so "not a live bearer" is expressed the way an attacker would meet it:
 * a forged signature, not a stubbed userinfo 401.
 */
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
import { clearJwksCache } from "@hanzo/iam/auth";

import { server } from "../../../jest.setup";
import { IAM, CLIENT_ID, iamHandlers, mint, forge } from "../../iam-fixture";

import { GET, POST } from "@/app/v1/store/config/route";

beforeEach(async () => {
  process.env.IAM_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  clearJwksCache();
  server.use(...(await iamHandlers()));
});

/** A genuinely IAM-signed bearer whose `owner` claim (the org) is `org`. */
const tokenFor = (org: string) => mint({ owner: org, name: "someone", email: "someone@example.com" });

/** A non-localhost request, so the localhost dev affordance can never apply. */
function req(url: string, token?: string, body?: unknown): NextRequest {
  const headers = new Headers({ host: "hanzo.app" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(`https://hanzo.app${url}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}


describe("/v1/store/config", () => {
  it("refuses an unauthenticated write — nobody binds a store anonymously", async () => {
    const res = await POST(req("/v1/store/config", undefined, { space_id: "acme/site" }));
    expect(res.status).toBe(401);
  });

  it("refuses a write whose bearer IAM did not sign", async () => {
    const res = await POST(
      req("/v1/store/config", forge(await tokenFor("orga")), { space_id: "acme/site" }),
    );
    expect(res.status).toBe(401);
  });

  it("refuses binding a project to SOMEONE ELSE's org", async () => {
    const res = await POST(
      req("/v1/store/config", await tokenFor("orga"), {
        space_id: "acme/site",
        org: "victim-org",
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: "org_forbidden" });
  });

  it("requires space_id — a binding with no project is unreachable", async () => {
    const res = await POST(req("/v1/store/config", await tokenFor("orga"), {}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "space_id_required" });
  });

  it("rejects an unknown mode rather than storing it", async () => {
    const res = await POST(
      req("/v1/store/config", await tokenFor("orga"), {
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
