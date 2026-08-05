/**
 * The app does not promise credit it cannot grant.
 *
 * /signup told every visitor "$5 free cloud credits to start", badged the card
 * "Free", and ruled a line under it reading "No credit card required". All
 * three described a flow that no longer exists — onboarding picks a paid plan
 * at hanzo.id — and nothing in this app ever granted the $5 either. Entitlements
 * here are a pure forward to the gateway (`app/v1/entitlements/route.ts`), so
 * the promise was copy from the start, and the first thing a new user met was
 * the product being wrong about itself.
 *
 * This is the same call /billing already made when it deleted the USDC rail
 * that "advertised bonus credits no backend grants". Second time, so it gets a
 * test instead of a comment.
 *
 * What is NOT banned, and must not be — the ban is on promising a grant, not on
 * the word "credit":
 *
 *   - A PAID plan that includes credits is a real fact about a real product.
 *     pro-modal's "Get free credits across all Inference Providers" is a line
 *     item of the $9/month subscription, not a giveaway.
 *   - A third party's own free tier is that third party's fact. hf-auth-panel's
 *     "$0.10/month free credits" belongs to HuggingFace.
 *   - An honest balance is honest. /billing reads `/v1/billing/balance` and
 *     shows what is there, including zero.
 *
 * So the patterns below name the retired PROMISES exactly, and each is checked
 * against the two legitimate sentences above to be sure it does not catch them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next" || name === ".claude") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const files = ["app", "components", "lib"].flatMap((r) => walk(join(root, r)));
const rel = (f: string) => f.replace(root + "/", "");

/** The retired promises, each named exactly. */
const RETIRED: Array<[string, RegExp]> = [
  ["a free starter credit by name", /starter credit/i],
  ["a free cloud-credit grant", /free cloud credits?/i],
  ["credit handed over at signup", /free credits? to start/i],
  ["signing up without a card", /no credit card required|no card needed/i],
];

/** The credit sentences that are true and must keep passing. */
const LEGITIMATE = [
  "Get free credits across all Inference Providers", // paid $9/mo plan feature
  "Use your HuggingFace account for free AI inference ($0.10/month free credits).",
  "Spendable credit across every Hanzo service", // honest balance readout
];

describe("credit the app cannot grant", () => {
  it("scans a non-trivial number of source files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(RETIRED)("is never promised — %s", (_label, pattern) => {
    const offenders = files.filter((f) => pattern.test(readFileSync(f, "utf8"))).map(rel);
    expect(offenders).toEqual([]);
  });

  it.each(RETIRED)("leaves the true credit facts alone — %s", (_label, pattern) => {
    // A ban this broad is one careless character from deleting a real product
    // fact, so each pattern proves it cannot reach one.
    for (const sentence of LEGITIMATE) expect(pattern.test(sentence)).toBe(false);
  });

  it("still lets /billing show a real balance", () => {
    // Killing the framing must not kill the readout: the number comes from the
    // gateway and stays, including when it is zero.
    const billing = readFileSync(join(root, "app/billing/page.tsx"), "utf8");
    expect(billing).toMatch(/Credit Balance/);
    expect(billing).toMatch(/useCloudBalance|spendableCents/);
  });
});
