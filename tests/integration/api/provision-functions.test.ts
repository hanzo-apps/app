/**
 * @jest-environment node
 *
 * /v1/provision — the Functions tier of a project's Base backend.
 *
 * Base is one backend with several tiers, and this suite covers the tier that
 * RUNS: handlers the generated app declares are deployed to Hanzo Functions
 * (`/v1/functions` on the cloud gateway) under the project's slug.
 *
 * The contract asserted here:
 *  - no verified IAM session → 401, before any upstream call
 *  - a declared handler reaches the REGISTRY, with the caller's bearer and the
 *    project as its namespace — the shape the registry actually accepts
 *  - `X-Org-Id` is NOT sent for an ordinary caller, so tenancy stays
 *    gateway-minted from the token
 *  - a name the registry reserves never reaches the network, and is reported
 *  - a registry refusal is reported with the upstream's own reason, and is
 *    NEVER rounded up into `provisioned`
 *  - declaring nothing calls nothing
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { clearJwksCache } from "@hanzo/iam/auth";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { server } from "../../../jest.setup";
import { IAM, CLIENT_ID, iamHandlers, mint } from "../../iam-fixture";

import { POST } from "@/app/v1/provision/route";

const REGISTRY = "https://api.hanzo.ai/v1/functions";

let AUTH: string;

beforeAll(() => {
  // The store tier writes real files; keep them out of the repo.
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "provision-"));
});

beforeEach(async () => {
  process.env.IAM_URL = IAM;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  delete process.env.CLOUD_API_URL;
  delete process.env.HANZO_API_URL;
  clearJwksCache();
  server.use(...(await iamHandlers()));
  AUTH = await mint({ owner: "acme" });
});

function req(body: unknown, token?: string) {
  const headers = new Headers({ host: "hanzo.app", "content-type": "application/json" });
  headers.set("origin", "https://hanzo.app");
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new NextRequest("https://hanzo.app/v1/provision", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const hello = { name: "hello", code: "export default () => new Response('hi')" };

describe("/v1/provision — Functions tier", () => {
  it("refuses a caller with no session", async () => {
    let called = false;
    server.use(http.post(REGISTRY, () => { called = true; return HttpResponse.json({}); }));

    const res = await POST(req({ projectId: "my-app", functions: [hello] }));

    expect(res.status).toBe(401);
    expect(called).toBe(false);
  });

  it("deploys a declared handler to the registry, namespaced by project", async () => {
    let seen: { body: Record<string, unknown>; auth: string | null; org: string | null } | null = null;
    server.use(
      http.post(REGISTRY, async ({ request }) => {
        seen = {
          body: (await request.json()) as Record<string, unknown>,
          auth: request.headers.get("authorization"),
          org: request.headers.get("x-org-id"),
        };
        return HttpResponse.json({ name: "hello" }, { status: 201 });
      }),
    );

    const res = await POST(req({ projectId: "my-app", functions: [hello] }, AUTH));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.functions).toEqual({ deployed: ["hello"], failed: [] });
    expect(json.provisioned).toContain("Functions");

    expect(seen).not.toBeNull();
    expect(seen!.body.name).toBe("hello");
    // The project groups its handlers; the org remains the isolation key.
    expect(seen!.body.namespace).toBe("my-app");
    // A runtime the registry's closed set accepts.
    expect(seen!.body.runtime).toBe("node");
    expect(seen!.body.code).toBe(hello.code);
    // The caller's own bearer — the gateway derives the org from it.
    expect(seen!.auth).toBe(`Bearer ${AUTH}`);
    // Not sent: a proxy that stamps tenancy is a proxy asking to be trusted about it.
    expect(seen!.org).toBeNull();
  });

  it("reports a name the registry reserves without calling it", async () => {
    let called = false;
    server.use(http.post(REGISTRY, () => { called = true; return HttpResponse.json({}); }));

    const res = await POST(
      req({ projectId: "my-app", functions: [{ name: "metrics", code: "x" }] }, AUTH),
    );
    const json = await res.json();

    expect(called).toBe(false);
    expect(json.functions.deployed).toEqual([]);
    expect(json.functions.failed).toEqual([{ name: "metrics", error: "name is reserved" }]);
    expect(json.provisioned).not.toContain("Functions");
  });

  it("passes a registry refusal through with its own reason, never as success", async () => {
    server.use(
      http.post(REGISTRY, () =>
        HttpResponse.json({ error: "unsupported runtime" }, { status: 400 }),
      ),
    );

    const res = await POST(req({ projectId: "my-app", functions: [hello] }, AUTH));
    const json = await res.json();

    expect(json.functions.deployed).toEqual([]);
    expect(json.functions.failed).toEqual([{ name: "hello", error: "unsupported runtime" }]);
    expect(json.provisioned).not.toContain("Functions");
    expect(json.pending.map((p: { name: string }) => p.name)).toContain("Functions");
  });

  it("calls nothing when the app declares nothing", async () => {
    let called = false;
    server.use(http.post(REGISTRY, () => { called = true; return HttpResponse.json({}); }));

    const res = await POST(req({ projectId: "my-app" }, AUTH));
    const json = await res.json();

    expect(called).toBe(false);
    expect(json.functions).toEqual({ deployed: [], failed: [] });
    expect(json.provisioned).not.toContain("Functions");
  });
});
