/**
 * A refusal's own sentence must reach the reader.
 *
 * The server half was already careful — `refusal()` puts the gateway's stated
 * reason in `message` — and the client half threw it away: four call sites
 * returned a hardcoded "You're out of credits." with the response body still
 * unread. So a cap, a wrong payer and a genuinely empty wallet all read
 * identically, and the modal said "You've reached your limit" over a balance
 * of $149,744.16.
 *
 * Two things are pinned, because either one alone restores the bug:
 * `said()` must READ the body, and no 402 site may fabricate a message.
 */
import { said, CREDIT, reason } from "@/lib/gateway";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const body = (o: unknown, status = 402) =>
  new Response(JSON.stringify(o), { status });

describe("said()", () => {
  it("returns the sentence the refusal stated", async () => {
    expect(
      await said(body({ msg: "Monthly spend cap reached for org acme." }), CREDIT)
    ).toBe("Monthly spend cap reached for org acme.");
  });

  it("reads the OpenAI-compatible shapes too", async () => {
    expect(await said(body({ error: { message: "Insufficient balance." } }), CREDIT)).toBe(
      "Insufficient balance."
    );
  });

  it("falls back when the body states nothing", async () => {
    expect(await said(body({}), CREDIT)).toBe(CREDIT);
    expect(await said(new Response("<html>502</html>", { status: 402 }), CREDIT)).toBe(CREDIT);
  });

  it("redacts a key the upstream echoed, like the server half does", async () => {
    const out = await said(body({ msg: "Key hk-902abdEFGH1234 has no credit." }), CREDIT);
    expect(out).toContain("hk-902abd…");
    expect(out).not.toContain("EFGH1234");
  });

  it("shares its parsing with reason() — one treatment, both sides", async () => {
    const detail = JSON.stringify({ msg: "Cap reached." });
    expect(await said(body(JSON.parse(detail)), CREDIT)).toBe(reason(detail));
  });
});

describe("no 402 site fabricates a message", () => {
  // Comment-stripped: the prose above a fix must not be able to satisfy the
  // check that guards it. (This repo has shipped that mistake.)
  const source = (rel: string) =>
    readFileSync(join(process.cwd(), rel), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it("useCallAi reads the body at every one of them", () => {
    const code = source("hooks/useCallAi.ts");
    const sites = [...code.matchAll(/status === 402\)\s*\{[\s\S]*?\n\s{6}\}/g)].map((m) => m[0]);
    expect(sites.length).toBeGreaterThanOrEqual(4);
    for (const site of sites) {
      expect(site).toContain("said(request, CREDIT)");
      expect(site).not.toMatch(/message:\s*"/);
    }
  });

  it("the modal states no cause when the refusal stated none", () => {
    const code = source("components/usage/UsageLimitDialog.tsx");
    expect(code).toMatch(/reason \? `\$\{reason\}/);
    expect(code).not.toContain("reached your limit");
  });

  it("the raise carries it — a dropped argument is the same bug one layer up", () => {
    expect(source("components/editor/ask-ai/index.tsx")).toContain("raiseUsageLimit(message)");
    expect(source("components/usage/usage-limit.tsx")).toMatch(/raise:\s*\(reason\?: string\)/);
  });
});
