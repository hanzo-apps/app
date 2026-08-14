import { provisionBaseFromDDL, type ProvisionBaseResult } from "@/lib/base/provision";
import type { BaseClient } from "@hanzo/base";

/**
 * "Enable backend" reports a REFUSAL once, not once per table.
 *
 * Measured in hanzoai/base v1.5.25 — the version this deployment runs — the
 * whole collections group is gated:
 *
 *   apis/collection.go:17   rg.Group("/collections").Bind(RequireSuperuserAuth())
 *
 * and `RequireSuperuserAuth` admits only an auth record in `_superusers`
 * (apis/middlewares.go:127-131). A bearer validated through JWKS is mapped to
 * `_superusers` ONLY when the token carries platform sudo — otherwise it is
 * mapped to `users` (apis/middlewares.go:422-428). So every ordinary customer
 * credential is refused 403 on both the list and the create, permanently.
 *
 * Before this, that refusal was swallowed on the list and then re-collected
 * once per table into `failed`, and the route answered HTTP 200. N identical
 * permission errors read like N flaky tables, so the one honest reading — "this
 * credential cannot write schema" — was the one nobody could see.
 *
 * These pin the shape of the answer, not the plumbing: a refusal stops, says so
 * once, and creates nothing; a per-table failure is still per-table.
 */

const DDL = `
  CREATE TABLE todos (id TEXT PRIMARY KEY, title TEXT NOT NULL);
  CREATE TABLE notes (id TEXT PRIMARY KEY, body TEXT);
`;

/** An upstream rejection carrying an HTTP status, the shape @hanzo/base throws. */
function upstream(status: number, message = "refused"): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

/**
 * A stand-in client that records every path it was asked for, so a test can
 * assert what was NOT attempted — which is the whole point of stopping early.
 */
function clientThatThrows(err: unknown, calls: string[]): BaseClient {
  return {
    send: async (path: string) => {
      calls.push(path);
      throw err;
    },
  } as unknown as BaseClient;
}

describe("provisionBaseFromDDL — a refusal is one fact about the request", () => {
  it("stops on a 403 list and never attempts a single create", async () => {
    const calls: string[] = [];
    const result = await provisionBaseFromDDL(clientThatThrows(upstream(403), calls), DDL);

    expect(result.refused).toBeTruthy();
    expect(result.created).toEqual([]);
    expect(result.failed).toEqual([]);
    // One call — the list. Two tables would have meant two more.
    expect(calls).toEqual(["/v1/collections"]);
  });

  it("names the reason rather than echoing the upstream message", async () => {
    const result = await provisionBaseFromDDL(clientThatThrows(upstream(403), []), DDL);
    // The customer-facing sentence has to say WHY it can never work, so nobody
    // is sent back to retry a permanent refusal.
    expect(result.refused).toMatch(/may not create Base collections/i);
  });

  it("treats a 401 as a session problem, which IS worth retrying", async () => {
    const result = await provisionBaseFromDDL(clientThatThrows(upstream(401), []), DDL);
    expect(result.refused).toMatch(/sign in again/i);
  });

  it("refuses on a 403 CREATE too, without repeating it for the second table", async () => {
    const calls: string[] = [];
    const client = {
      send: async (path: string, opts?: { method?: string }) => {
        calls.push(`${opts?.method ?? "GET"} ${path}`);
        if (opts?.method === "POST") throw upstream(403);
        return { items: [] };
      },
    } as unknown as BaseClient;

    const result = await provisionBaseFromDDL(client, DDL);
    expect(result.refused).toBeTruthy();
    expect(result.failed).toEqual([]);
    // list + the FIRST create. The second table is never attempted.
    expect(calls).toEqual(["GET /v1/collections", "POST /v1/collections"]);
  });
});

describe("provisionBaseFromDDL — a per-table failure is still per-table", () => {
  it("keeps going after a 400 and records only that table", async () => {
    const client = {
      send: async (path: string, opts?: { method?: string; body?: string }) => {
        if (opts?.method !== "POST") return { items: [] };
        const name = JSON.parse(String(opts.body)).name;
        if (name === "todos") throw upstream(400, "bad field");
        return {};
      },
    } as unknown as BaseClient;

    const result: ProvisionBaseResult = await provisionBaseFromDDL(client, DDL);
    expect(result.refused).toBeUndefined();
    expect(result.created).toEqual(["notes"]);
    expect(result.failed).toEqual([{ collection: "todos", error: "bad field" }]);
  });

  it("still provisions normally when nothing refuses", async () => {
    const client = {
      send: async (_path: string, opts?: { method?: string }) =>
        opts?.method === "POST" ? {} : { items: [{ name: "todos" }] },
    } as unknown as BaseClient;

    const result = await provisionBaseFromDDL(client, DDL);
    expect(result.refused).toBeUndefined();
    expect(result.existing).toEqual(["todos"]);
    expect(result.created).toEqual(["notes"]);
  });

  it("a non-decisive list failure does not stop the creates", async () => {
    // A 500 on the list says nothing about whether a create is permitted, so
    // the old behaviour is preserved: try, and report per table.
    const client = {
      send: async (_path: string, opts?: { method?: string }) => {
        if (opts?.method !== "POST") throw upstream(500, "listing broke");
        return {};
      },
    } as unknown as BaseClient;

    const result = await provisionBaseFromDDL(client, DDL);
    expect(result.refused).toBeUndefined();
    expect(result.created).toEqual(["todos", "notes"]);
  });
});
