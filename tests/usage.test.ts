import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUsage } from "../lib/usage.ts";

test("usage is honest: not metered, real project count, no fabricated caps", () => {
  const u = buildUsage(3);
  assert.equal(u.metered, false);
  assert.ok(u.note && /coming soon/i.test(u.note));
  const projects = u.metrics.find((m) => m.label === "Projects");
  assert.ok(projects);
  assert.equal(projects.value, 3);
  assert.equal(projects.limit, null); // never an invented limit
});

test("usage is deterministic (no Math.random) and clamps to real counts", () => {
  assert.deepEqual(buildUsage(0).metrics, buildUsage(0).metrics);
  assert.equal(buildUsage(-5).metrics[0].value, 0);
  // No fabricated API-call / compute-hour / storage numbers exist.
  const labels = buildUsage(2).metrics.map((m) => m.label);
  assert.deepEqual(labels, ["Projects"]);
});
