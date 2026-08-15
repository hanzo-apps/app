/**
 * @jest-environment node
 *
 * BFF tests for /v1/git/accounts and /v1/git/repos — the real import seam.
 *
 * The contract these hold, and the reason it changed: hanzo.app used to read a
 * provider access token out of IAM account properties
 * (`oauth_GitHub_accessToken`) and call api.github.com with it. IAM writes no
 * such property — there is no `oauth_` anywhere in it, and a live account read
 * carries none — so that path resolved to null for every user and the panel
 * could only ever show git.hanzo.ai. A third-party git credential lives in ONE
 * place: cloud's connectors, sealed in KMS.
 *
 * So the security-critical contract is now:
 *  - no verified IAM session → honest not-connected (accounts) / 401 (repos),
 *    never fabricated rows and never a service token;
 *  - the connector plane is called AS THE USER, with their own IAM bearer, and
 *    that bearer is the only credential this process holds;
 *  - a provider the org has not connected does not appear;
 *  - `connectable` is what cloud says it can connect, so the UI never dead-clicks;
 *  - GitHub and GitLab go through the SAME rule — one path, two route names.
 *
 * IAM + cloud are stubbed with MSW so we can inspect exactly what the BFF sent.
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { clearJwksCache } from "@hanzo/iam/auth";

import { server } from "../../../jest.setup";
import { IAM as IAM_HOST, CLIENT_ID, iamHandlers, mint } from "../../iam-fixture";

import { GET as getAccounts } from "@/app/v1/git/accounts/route";
import { GET as getRepos } from "@/app/v1/git/repos/route";

const CLOUD = "https://cloud.test";

function req(url: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${AUTH}`);
  return new NextRequest(url, { headers });
}

/** Cloud's connector catalog: what is configured, and what this org connected. */
function catalog(rows: Record<string, { available?: boolean; connected?: boolean; account?: string }>) {
  return http.get(`${CLOUD}/v1/integrations`, () =>
    HttpResponse.json({
      providers: Object.entries(rows).map(([id, r]) => ({
        id,
        available: r.available ?? true,
        connected: r.connected ?? false,
        ...(r.account ? { connection: { account: r.account } } : {}),
      })),
    }),
  );
}

const REPO = {
  name: "app",
  fullName: "octo/app",
  private: true,
  description: "the app",
  defaultBranch: "main",
  pushedAt: "2026-07-01T00:00:00Z",
  cloneUrl: "https://github.com/octo/app.git",
  htmlUrl: "https://github.com/octo/app",
};

// A token is only a caller if IAM signed it, so these suites mint real ones
// against an in-process IAM (tests/iam-fixture).
let AUTH: string;
beforeEach(async () => {
  process.env.IAM_URL = IAM_HOST;
  process.env.IAM_CLIENT_ID = CLIENT_ID;
  process.env.CLOUD_API_URL = CLOUD;
  clearJwksCache();
  server.use(...(await iamHandlers()));
  AUTH = await mint();
});

describe("BFF: GET /v1/git/accounts", () => {
  it("no session → connected:false, accounts:[] (the honest CTA state)", async () => {
    const res = await getAccounts(req("http://localhost/v1/git/accounts"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ connected: false, accounts: [] });
    // The route also advertises which providers CAN be connected (the CTA list).
    expect(body.providers.map((p: { provider: string }) => p.provider)).toEqual([
      "hanzo",
      "github",
      "gitlab",
    ]);
  });

  it("a session with nothing connected → connected:false", async () => {
    server.use(catalog({ github: {}, gitlab: {} }));
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ connected: false, accounts: [] });
  });

  it("a connector this deployment has no credentials for is NOT connectable", async () => {
    server.use(catalog({ github: { available: true }, gitlab: { available: false } }));
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    const byProvider = Object.fromEntries(
      (await res.json()).providers.map((p: { provider: string; connectable: boolean }) => [
        p.provider,
        p.connectable,
      ]),
    );
    expect(byProvider).toMatchObject({ github: true, gitlab: false });
  });

  it("calls cloud AS THE USER and lists the accounts the connection reaches", async () => {
    let catalogAuth: string | null = null;
    let reposAuth: string | null = null;
    server.use(
      http.get(`${CLOUD}/v1/integrations`, ({ request }) => {
        catalogAuth = request.headers.get("authorization");
        return HttpResponse.json({
          providers: [{ id: "github", available: true, connected: true, connection: { account: "octo" } }],
        });
      }),
      http.get(`${CLOUD}/v1/integrations/github/repos`, ({ request }) => {
        reposAuth = request.headers.get("authorization");
        return HttpResponse.json({ repos: [REPO, { ...REPO, fullName: "hanzoai/iam" }] });
      }),
    );

    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    const body = await res.json();

    expect(res.status).toBe(200);
    // The user's OWN bearer, never a service token — cloud scopes the answer to
    // the org that bearer names.
    expect(catalogAuth).toBe(`Bearer ${AUTH}`);
    expect(reposAuth).toBe(`Bearer ${AUTH}`);
    expect(body.connected).toBe(true);
    // The connected account is the user; anything else it reaches is an org.
    expect(body.accounts).toEqual([
      { login: "hanzoai", avatarUrl: "", provider: "github", type: "org" },
      { login: "octo", avatarUrl: "", provider: "github", type: "user" },
    ]);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("GitLab takes the same path, at its own route", async () => {
    let seen = "";
    server.use(
      catalog({ gitlab: { connected: true, account: "acme-dev" } }),
      http.get(`${CLOUD}/v1/integrations/gitlab/projects`, ({ request }) => {
        seen = new URL(request.url).pathname;
        return HttpResponse.json({ projects: [{ ...REPO, fullName: "acme/widgets" }] });
      }),
    );
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    const body = await res.json();
    expect(seen).toBe("/v1/integrations/gitlab/projects");
    expect(body.accounts).toEqual([
      { login: "acme", avatarUrl: "", provider: "gitlab", type: "org" },
    ]);
  });

  it("a revoked connection (cloud 401) collapses to connected:false", async () => {
    server.use(
      catalog({ github: { connected: true, account: "octo" } }),
      http.get(`${CLOUD}/v1/integrations/github/repos`, () => new HttpResponse(null, { status: 401 })),
    );
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    expect((await res.json()).connected).toBe(false);
  });

  it("cloud unreachable does not sink the answer", async () => {
    server.use(http.get(`${CLOUD}/v1/integrations`, () => HttpResponse.error()));
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });
});

describe("BFF: GET /v1/git/repos", () => {
  it("no session → 401, no repos, no service token", async () => {
    const res = await getRepos(req("http://localhost/v1/git/repos"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ repos: [], connected: false });
  });

  it("narrows to the account asked for, filtered by q, newest first", async () => {
    server.use(
      catalog({ github: { connected: true, account: "octo" } }),
      http.get(`${CLOUD}/v1/integrations/github/repos`, () =>
        HttpResponse.json({
          repos: [
            REPO,
            { ...REPO, name: "docs", fullName: "octo/docs", private: false, description: "guides" },
            { ...REPO, name: "iam", fullName: "hanzoai/iam" },
          ],
        }),
      ),
    );

    const res = await getRepos(req("http://localhost/v1/git/repos?account=octo&q=app", "iam-bearer"));
    const body = await res.json();

    expect(res.status).toBe(200);
    // hanzoai/iam is another account's; octo/docs does not match q.
    expect(body.repos).toHaveLength(1);
    expect(body.repos[0]).toMatchObject({
      fullName: "octo/app",
      private: true,
      cloneUrl: "https://github.com/octo/app.git",
      defaultBranch: "main",
      provider: "github",
    });
  });

  it("an org account reads that owner's repositories", async () => {
    server.use(
      catalog({ github: { connected: true, account: "octo" } }),
      http.get(`${CLOUD}/v1/integrations/github/repos`, () =>
        HttpResponse.json({ repos: [REPO, { ...REPO, name: "iam", fullName: "hanzoai/iam" }] }),
      ),
    );
    const res = await getRepos(req("http://localhost/v1/git/repos?account=hanzoai", "iam-bearer"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.repos.map((r: { fullName: string }) => r.fullName)).toEqual(["hanzoai/iam"]);
  });

  it("a provider whose listing this cloud does not serve yet → not connected, never an empty account", async () => {
    server.use(
      catalog({ gitlab: { connected: true, account: "acme-dev" } }),
      http.get(`${CLOUD}/v1/integrations/gitlab/projects`, () => new HttpResponse(null, { status: 404 })),
    );
    const res = await getRepos(req("http://localhost/v1/git/repos?provider=gitlab", "iam-bearer"));
    expect(res.status).toBe(401);
    expect((await res.json()).connected).toBe(false);
  });

  it("a revoked connection → 401 not connected", async () => {
    server.use(
      catalog({ github: { connected: true, account: "octo" } }),
      http.get(`${CLOUD}/v1/integrations/github/repos`, () => new HttpResponse(null, { status: 401 })),
    );
    const res = await getRepos(req("http://localhost/v1/git/repos?account=octo", "iam-bearer"));
    expect(res.status).toBe(401);
    expect((await res.json()).connected).toBe(false);
  });
});
