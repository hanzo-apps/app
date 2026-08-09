import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "../../components/editor/more/index.tsx"),
  "utf8",
);

/**
 * The More pane's readers claim only what an answer proved. Source pins in the
 * site-restore idiom — each property is one expression a refactor could drop.
 */
describe("PaymentsBody", () => {
  it("treats 409 as the meaningful no-store state, not an error", () => {
    expect(src).toMatch(/r\.status === 409.*setState\(\{ kind: 'unbound' \}\)/);
    expect(src).toMatch(/No store bound to this project/);
  });

  it("distinguishes an empty catalog from an unreadable one", () => {
    expect(src).toMatch(/Store bound — catalog is empty/);
    expect(src).toMatch(/The catalog could not be read/);
  });
});

describe("DatabaseBody", () => {
  it("reads the SHAPE of the refusal — 404 proves the chain", () => {
    expect(src).toMatch(/__door_probe__/);
    expect(src).toMatch(/r\.status === 404\) setDoor\('answers'\)/);
  });

  it("names the session case apart from unreachable", () => {
    expect(src).toMatch(/setDoor\('session'\)/);
    expect(src).toMatch(/Base did not answer/);
  });
});

describe("UsageBody", () => {
  it("renders the endpoint's own honesty — metrics plus its not-metered note", () => {
    expect(src).toMatch(/fetch\('\/v1\/usage'/);
    expect(src).toMatch(/read\.note/);
  });

  it("draws a limit only when one exists — no invented caps", () => {
    expect(src).toMatch(/m\.limit !== null \? ` \/ \$\{m\.limit\}` : ''/);
  });

  it("unreachable is named, not rendered as zeros", () => {
    expect(src).toMatch(/Usage did not answer/);
  });
});

describe("LogsBody", () => {
  it("keeps the three-valued contract: null, unreachable, and answered-empty", () => {
    expect(src).toMatch(/Reading the request log…/);
    expect(src).toMatch(/The log did not answer/);
    expect(src).toMatch(/Nothing logged yet/);
  });

  it("only a well-formed answer may claim emptiness", () => {
    // A body that is not an array under any known name is 'unreachable',
    // never an empty list.
    expect(src).toMatch(/if \(!list\) \{\s*setRows\('unreachable'\)/);
  });
});

describe("AnalyticsBody", () => {
  it("reads the lens's OWN honesty — available/items, not a guessed shape", () => {
    // The bug this pins: the reader once parsed topPages.buckets/.total, which
    // the cloud contract never returns — Breakdown is {available, items, reason}
    // with each item {key, pageviews, visitors, pct}. That reader showed empty
    // even with real data.
    expect(src).toMatch(/topPages\?: \{ available\?: boolean; items\?: unknown\[\] \}/);
    expect(src).toMatch(/lens\.available === false \|\| !Array\.isArray\(lens\.items\)/);
    expect(src).not.toMatch(/topPages\?.*buckets/);
  });

  it("keeps the three-valued contract with the plane's flag as the source of truth", () => {
    expect(src).toMatch(/Reading traffic…/);
    expect(src).toMatch(/Analytics did not answer/);
    expect(src).toMatch(/No pageviews yet/);
  });

  it("shows share honestly and invents no grand total", () => {
    expect(src).toMatch(/p\.pct\.toFixed\(1\)/);
    expect(src).not.toMatch(/read\.total/);
  });
});
