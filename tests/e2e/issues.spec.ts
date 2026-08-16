/**
 * /dev/:org/:project/issues — the work-item board, rendered.
 *
 * A screenshot test with the two upstreams intercepted. That is deliberate, not
 * a shortcut: the board's job is to JOIN two planes — the board's issues and
 * the session registry's live agent status — and the only way to prove the join
 * renders (a row whose extRef names a running session shows `running`) is to fix
 * both sides. Against real data the interesting rows may simply not exist today.
 *
 * The session cookie is set directly because the middleware gate is a LIVENESS
 * check on cookie presence (middleware.ts); authorization happens per request in
 * lib/iam.ts, and every request this page makes is intercepted here.
 */
import { test, expect } from "@playwright/test";

const BOARD = [
  {
    id: "p_1",
    org: "acme",
    key: "ENG",
    name: "platform",
    description: "The build surface",
    createdAt: 1,
    updatedAt: 1,
  },
];

const issue = (
  number: number,
  title: string,
  status: string,
  extra: Record<string, unknown> = {},
) => ({
  id: `i_${number}`,
  identifier: `ENG-${number}`,
  projectKey: "ENG",
  number,
  kind: "issue",
  source: "team",
  title,
  status,
  priority: "none",
  labels: [],
  createdAt: 1,
  updatedAt: 1,
  ...extra,
});

const ISSUES = [
  issue(14, "Board reads the board, not a second table", "in_progress", {
    assignee: "z@hanzo.ai",
    labels: ["tracker"],
    priority: "high",
  }),
  issue(13, "Expose work items as MCP tools so agents self-report", "in_progress", {
    source: "agent",
    extRef: "session:sess_running",
    labels: ["mcp", "agents"],
  }),
  issue(12, "Link a work item to the agent session doing it", "todo", {
    source: "agent",
    extRef: "session:sess_paused",
  }),
  issue(11, "Catch-all BFF keeps its prefix under traversal", "done", {
    assignee: "z@hanzo.ai",
    labels: ["security"],
  }),
  issue(10, "Agent run that failed its build", "backlog", {
    source: "agent",
    extRef: "session:sess_error",
  }),
  issue(9, "Boards resolve by key or by name, never by guess", "backlog"),
];

const SESSIONS = {
  sessions: [
    { id: "sess_running", org: "acme", agent: "hanzo", status: "running", rootSessionId: "sess_running", events: 12, children: 0, startedAt: "", updatedAt: "" },
    { id: "sess_paused", org: "acme", agent: "hanzo", status: "paused", rootSessionId: "sess_paused", events: 4, children: 0, startedAt: "", updatedAt: "" },
    { id: "sess_error", org: "acme", agent: "hanzo", status: "error", rootSessionId: "sess_error", events: 30, children: 0, startedAt: "", updatedAt: "" },
  ],
};

test.beforeEach(async ({ context, page, baseURL }) => {
  const origin = new URL(baseURL || "http://localhost:3000");
  await context.addCookies([
    {
      name: "hanzo_iam_access_token",
      value: "e2e-liveness-cookie",
      domain: origin.hostname,
      path: "/",
    },
  ]);

  await page.route("**/v1/todo/projects", (r) =>
    r.fulfill({ json: BOARD, headers: { "content-type": "application/json" } }),
  );
  await page.route("**/v1/todo/projects/ENG/issues*", (r) =>
    r.fulfill({ json: ISSUES, headers: { "content-type": "application/json" } }),
  );
  await page.route("**/v1/agents/sessions*", (r) =>
    r.fulfill({ json: SESSIONS, headers: { "content-type": "application/json" } }),
  );
});

/** Every row is on screen and the agent join has resolved. */
async function settled(page: import("@playwright/test").Page) {
  await expect(page.getByText("ENG-14")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("ENG-9")).toBeVisible();
  // The join: an issue whose extRef names a running session says so.
  await expect(page.getByText("running")).toBeVisible();
  await page.waitForTimeout(400); // let webfonts settle before the shot
}

test("the board renders at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dev/acme/platform/issues");
  await settled(page);

  // The board resolved by NAME (`platform`), and says which key it resolved to.
  await expect(page.getByText("ENG ·", { exact: false })).toBeVisible();
  await expect(page.getByText("paused")).toBeVisible();
  await expect(page.getByText("error")).toBeVisible();

  await page.screenshot({ path: "tests/e2e/test-results/issues-1440.png", fullPage: true });
});

test("the board renders on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/acme/ENG/issues");
  await settled(page);

  // No horizontal overflow: the page body never scrolls sideways.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.screenshot({ path: "tests/e2e/test-results/issues-390.png", fullPage: true });
});

test("a board that does not exist offers to start one", async ({ page }) => {
  await page.route("**/v1/todo/projects", (r) =>
    r.fulfill({ json: [], headers: { "content-type": "application/json" } }),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dev/acme/my-site/issues");

  await expect(page.getByText("No board yet")).toBeVisible({ timeout: 30_000 });
  // The proposed key follows cloud's own derivation rule for "my-site".
  await expect(page.locator('input[value="MYSI"]')).toBeVisible();

  await page.screenshot({ path: "tests/e2e/test-results/issues-empty-1440.png" });
});
