import {
  PUBLIC_STATUSES,
  publicFilter,
  orderForPublic,
  type CommunityProject,
  type CommunityStatus,
} from "@/lib/community";

// The safety invariant: the community feed is a POSITIVE ALLOW-LIST. Only
// `published` and `pinned` may ever reach the public feed — `pending` (freshly
// ingested, unreviewed) and `hidden` (moderated out) must NEVER surface. These
// tests lock that contract so a refactor can't silently leak unmoderated content.

const mk = (status: CommunityStatus, over: Partial<CommunityProject> = {}): CommunityProject => ({
  key: `github:${status}-${over.title ?? "x"}`,
  source: "github",
  title: over.title ?? "proj",
  status,
  ...over,
});

describe("community feed — moderation safety invariant", () => {
  it("public statuses are EXACTLY published + pinned (nothing else)", () => {
    expect([...PUBLIC_STATUSES].sort()).toEqual(["pinned", "published"]);
    expect(PUBLIC_STATUSES).not.toContain("pending");
    expect(PUBLIC_STATUSES).not.toContain("hidden");
  });

  it("publicFilter selects only the allow-listed statuses", () => {
    const f = publicFilter();
    expect(f).toContain('status="published"');
    expect(f).toContain('status="pinned"');
    // Must be a positive allow-list, never a blocklist of pending/hidden.
    expect(f).not.toContain("pending");
    expect(f).not.toContain("hidden");
    expect(f).not.toContain("!=");
  });

  describe("orderForPublic", () => {
    it("floats pinned above published, highest weight first", () => {
      const items = [
        mk("published", { title: "p1", updatedAt: "2026-01-02" }),
        mk("pinned", { title: "pin-lo", weight: 1, updatedAt: "2026-01-01" }),
        mk("pinned", { title: "pin-hi", weight: 9, updatedAt: "2026-01-01" }),
      ];
      const out = orderForPublic(items).map((p) => p.title);
      expect(out).toEqual(["pin-hi", "pin-lo", "p1"]);
    });

    it("orders same-status by most-recently-updated", () => {
      const items = [
        mk("published", { title: "old", updatedAt: "2026-01-01" }),
        mk("published", { title: "new", updatedAt: "2026-06-01" }),
      ];
      expect(orderForPublic(items).map((p) => p.title)).toEqual(["new", "old"]);
    });

    it("is pure — does not mutate its input", () => {
      const items = [mk("published", { title: "a" }), mk("pinned", { title: "b", weight: 5 })];
      const snapshot = items.map((p) => p.title);
      orderForPublic(items);
      expect(items.map((p) => p.title)).toEqual(snapshot);
    });
  });
});
