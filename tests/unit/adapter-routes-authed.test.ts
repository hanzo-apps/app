import { readFileSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";

const root = join(__dirname, "../..");

/**
 * Every route that opens the server adapter requires a session.
 *
 * `createServerAdapter()` reaches the deployment/project store directly. It
 * takes no request and carries no tenancy, so the ONLY thing standing between a
 * caller and that store is the route's own check — and three routes had none:
 * `/v1/deployments` (GET, POST), `/v1/deployments/[id]` (GET, PUT, DELETE) and
 * `/v1/sync/status`. Their siblings `/v1/sync/projects` and `/v1/sync/files`
 * did, which is what made it an oversight rather than a policy.
 *
 * What hid it is worth stating, because it will hide the next one too: probed
 * on production, `GET /v1/deployments` answered **200 []** and
 * `/v1/deployments/does-not-exist` answered **404 "Deployment not found"** —
 * not 401. Both look like healthy, empty, well-behaved endpoints. They were
 * reaching the store and finding nothing. An existing id would have been
 * handed to anyone who asked, and DELETE was on the same route.
 *
 * Empty is not protected. This test asserts the guard, not the emptiness.
 */
function adapterRoutes(): string[] {
  const out = execFileSync(
    "git",
    ["grep", "-l", "createServerAdapter", "--", "app/v1"],
    { cwd: root, encoding: "utf8" },
  );
  return out.split("\n").filter(Boolean);
}

describe("routes that reach the server adapter", () => {
  it("are found at all — an empty sweep would pass silently", () => {
    expect(adapterRoutes().length).toBeGreaterThanOrEqual(5);
  });

  it.each(adapterRoutes())("%s requires a session", (file) => {
    // TWO spellings are correct and both are in use: `requireSession`, which
    // throws the UNAUTHORIZED sentinel for the catch to map, and `session()`
    // followed by an explicit 401. Asserting only the first would have flagged
    // app/v1/me/projects, which gates perfectly well the other way — a test
    // that demands one spelling reports style as a defect.
    const src = readFileSync(join(root, file), "utf8");
    const gated =
      src.includes("requireSession") ||
      (/\bsession\(request\)/.test(src) && /status:\s*401/.test(src));
    expect(gated).toBe(true);
  });

  it.each(adapterRoutes())("%s answers 401, not 500, when refused", (file) => {
    // A catch that maps everything to 500 turns "sign in" into "we are broken"
    // — the confusion lib/gateway.ts exists to end on the other side of the app.
    const src = readFileSync(join(root, file), "utf8");
    expect(src).toMatch(/status:\s*401/);
  });
});
