/**
 * @jest-environment node
 *
 * BFF tests for /v1/git/accounts and /v1/git/repos — the real GitHub import seam.
 *
 * The security-critical contract:
 *  - no `hanzo_token` cookie → honest not-connected (accounts) / 401 (repos),
 *    never fabricated rows and never a service token;
 *  - the user's IAM bearer resolves their linked GitHub token from IAM
 *    get-account (self ⇒ unmasked), and that GitHub token — NOT the IAM bearer —
 *    is what calls the GitHub API;
 *  - the GitHub token NEVER appears in the response body;
 *  - a revoked GitHub token (GitHub 401) collapses to not-connected;
 *  - repos are the account's own (`/user/repos` for self, `/orgs/:org/repos` for
 *    an org), server-side filtered by `q`, newest-push first.
 *
 * IAM + GitHub are stubbed with MSW so we can inspect exactly what the BFF sent.
 */
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "../../../jest.setup";

import { GET as getAccounts } from "@/app/v1/git/accounts/route";
import { GET as getRepos } from "@/app/v1/git/repos/route";

const IAM = "https://hanzo.id/v1/iam/get-account";
const GH = "https://api.github.com";
const GH_TOKEN = "gho_realgithubtoken";

function req(url: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set("cookie", `hanzo_token=${token}`);
  return new NextRequest(url, { headers });
}

/** IAM get-account for a user WITH a linked GitHub token (self ⇒ unmasked). */
function iamLinked() {
  return http.get(IAM, () =>
    HttpResponse.json({
      status: "ok",
      data: {
        github: "octo",
        properties: {
          oauth_GitHub_accessToken: GH_TOKEN,
          oauth_GitHub_username: "octo",
        },
      },
    }),
  );
}

describe("BFF: GET /v1/git/accounts", () => {
  it("no token cookie → connected:false, accounts:[] (honest CTA state)", async () => {
    const res = await getAccounts(req("http://localhost/v1/git/accounts"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ connected: false, accounts: [] });
  });

  it("token but no GitHub linked in IAM → connected:false", async () => {
    server.use(
      http.get(IAM, () =>
        HttpResponse.json({ status: "ok", data: { properties: {} } }),
      ),
    );
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ connected: false, accounts: [] });
  });

  it("masked token ('***') is treated as not connected", async () => {
    server.use(
      http.get(IAM, () =>
        HttpResponse.json({
          status: "ok",
          data: { properties: { oauth_GitHub_accessToken: "***" } },
        }),
      ),
    );
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    expect((await res.json()).connected).toBe(false);
  });

  it("resolves the linked token from IAM and lists user + orgs; GitHub sees the GH token, not the IAM bearer", async () => {
    let iamAuth: string | null = null;
    let ghAuth: string | null = null;
    server.use(
      http.get(IAM, ({ request }) => {
        iamAuth = request.headers.get("authorization");
        return HttpResponse.json({
          status: "ok",
          data: {
            github: "octo",
            properties: { oauth_GitHub_accessToken: GH_TOKEN },
          },
        });
      }),
      http.get(`${GH}/user`, ({ request }) => {
        ghAuth = request.headers.get("authorization");
        return HttpResponse.json({ login: "octo", avatar_url: "https://a/octo.png" });
      }),
      http.get(`${GH}/user/orgs`, () =>
        HttpResponse.json([{ login: "hanzoai", avatar_url: "https://a/h.png" }]),
      ),
    );

    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(iamAuth).toBe("Bearer iam-bearer"); // IAM called as the user
    expect(ghAuth).toBe(`Bearer ${GH_TOKEN}`); // GitHub called with the GH token
    expect(body.connected).toBe(true);
    expect(body.accounts).toEqual([
      { login: "octo", avatarUrl: "https://a/octo.png", provider: "github", type: "user" },
      { login: "hanzoai", avatarUrl: "https://a/h.png", provider: "github", type: "org" },
    ]);
    // The GitHub token must NEVER be serialized to the browser.
    expect(JSON.stringify(body)).not.toContain(GH_TOKEN);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("a revoked GitHub token (GitHub 401) collapses to connected:false", async () => {
    server.use(
      iamLinked(),
      http.get(`${GH}/user`, () => new HttpResponse(null, { status: 401 })),
    );
    const res = await getAccounts(req("http://localhost/v1/git/accounts", "iam-bearer"));
    expect((await res.json()).connected).toBe(false);
  });
});

describe("BFF: GET /v1/git/repos", () => {
  it("no token cookie → 401, no repos, no service token", async () => {
    const res = await getRepos(req("http://localhost/v1/git/repos"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ repos: [], connected: false });
  });

  it("self account → /user/repos, filtered by q, private flagged, mapped", async () => {
    let seenPath = "";
    server.use(
      iamLinked(),
      http.get(`${GH}/user/repos`, ({ request }) => {
        seenPath = new URL(request.url).pathname;
        return HttpResponse.json([
          {
            name: "app", full_name: "octo/app", private: true,
            description: "the app", language: "TypeScript",
            pushed_at: "2026-07-01T00:00:00Z", default_branch: "main",
            clone_url: "https://github.com/octo/app.git", html_url: "https://github.com/octo/app",
          },
          {
            name: "docs", full_name: "octo/docs", private: false,
            description: "guides", language: "MDX",
            pushed_at: "2026-06-01T00:00:00Z", default_branch: "main",
            clone_url: "https://github.com/octo/docs.git", html_url: "https://github.com/octo/docs",
          },
        ]);
      }),
    );

    const res = await getRepos(req("http://localhost/v1/git/repos?account=octo&q=app", "iam-bearer"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(seenPath).toBe("/user/repos");
    expect(body.repos).toHaveLength(1); // q=app filters out docs (server-side)
    expect(body.repos[0]).toMatchObject({
      fullName: "octo/app",
      private: true,
      language: "TypeScript",
      cloneUrl: "https://github.com/octo/app.git",
      defaultBranch: "main",
    });
    expect(JSON.stringify(body)).not.toContain(GH_TOKEN);
  });

  it("org account → /orgs/:org/repos", async () => {
    let seenPath = "";
    server.use(
      iamLinked(),
      http.get(`${GH}/orgs/hanzoai/repos`, ({ request }) => {
        seenPath = new URL(request.url).pathname;
        return HttpResponse.json([
          {
            name: "iam", full_name: "hanzoai/iam", private: false,
            description: "identity", language: "Go",
            pushed_at: "2026-07-02T00:00:00Z", default_branch: "main",
            clone_url: "https://github.com/hanzoai/iam.git", html_url: "https://github.com/hanzoai/iam",
          },
        ]);
      }),
    );

    const res = await getRepos(req("http://localhost/v1/git/repos?account=hanzoai", "iam-bearer"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(seenPath).toBe("/orgs/hanzoai/repos");
    expect(body.repos[0].fullName).toBe("hanzoai/iam");
  });

  it("revoked GitHub token → 401 not connected", async () => {
    server.use(
      iamLinked(),
      http.get(`${GH}/user/repos`, () => new HttpResponse(null, { status: 401 })),
    );
    const res = await getRepos(req("http://localhost/v1/git/repos?account=octo", "iam-bearer"));
    expect(res.status).toBe(401);
    expect((await res.json()).connected).toBe(false);
  });
});
