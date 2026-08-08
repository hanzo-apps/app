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
