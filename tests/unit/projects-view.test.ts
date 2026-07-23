import assert from "node:assert/strict";
import {
  projectName,
  toDashboardProject,
  relativeTime,
} from "../../lib/projects-view.ts";

test("projectName derives a title from the space_id repo segment", () => {
  assert.equal(projectName("zooqueen/landing-page-builder"), "Landing Page Builder");
  assert.equal(projectName("acme/ai_chat_widget"), "Ai Chat Widget");
  assert.equal(projectName(undefined), "Untitled project");
});

test("toDashboardProject sources every field from the real row", () => {
  const p = toDashboardProject({
    id: "rec_1",
    space_id: "user/my-cool-app",
    created: "2026-06-20T00:00:00.000Z",
    updated: "2026-06-26T10:00:00.000Z",
  });
  assert.equal(p.id, "rec_1");
  assert.equal(p.name, "My Cool App");
  assert.equal(p.spaceId, "user/my-cool-app");
  assert.equal(p.updatedAt, "2026-06-26T10:00:00.000Z");
});

test("relativeTime is honest and stable (no randomness)", () => {
  const now = Date.parse("2026-06-26T12:00:00.000Z");
  assert.equal(relativeTime("2026-06-26T11:59:30.000Z", now), "just now");
  assert.equal(relativeTime("2026-06-26T10:00:00.000Z", now), "2 hours ago");
  assert.equal(relativeTime("2026-06-25T12:00:00.000Z", now), "1 day ago");
  assert.equal(relativeTime(null, now), "—");
  assert.equal(relativeTime("not-a-date", now), "—");
});
