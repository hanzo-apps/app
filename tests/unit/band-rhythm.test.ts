
import { read, root } from "../source";

/**
 * The landing bands give a PHONE its own vertical rhythm.
 *
 * All eight declared `paddingVertical="$10"` at the base AND `$10` again under
 * `$md` — the same token on both sides, so the responsive override was a no-op
 * and a phone had never had a value of its own. Every band sat at 64px, which
 * on a 390px screen is tight: the CTA stacks a two-line 40px heading, a
 * two-line subline, the composer and another two-line subline into it, so the
 * heading crowds the hairline above it and the subline crowds the one below.
 *
 * The media in this config are MIN-width ("and up"), so a phone-only value is
 * the BASE with `$md` switching it back — written the intuitive way round it
 * would land on desktop and miss the phone entirely.
 *
 * $11 is 80px against $10's 64 (measured off the running app's --c-space-*;
 * the ramp is not linear, so do not compute it — $4 is 16px and $10 is 64px).
 */
const FILES = [
  "app/page.tsx",
  "components/landing/hanzo-models.tsx",
  "components/landing/cloud-integration.tsx",
  "components/landing/comparison.tsx",
  "components/landing/logo-wall.tsx",
  "components/landing/how-it-works.tsx",
  "components/landing/models-strip.tsx",
  "components/landing/walkthrough.tsx",
];

describe("a landing band's vertical rhythm", () => {
  const sources = FILES.map((f) => [f, read(f)] as const);

  it("gives the phone more room than the shipped 64px", () => {
    const bands = sources.flatMap(([f, s]) =>
      [...s.matchAll(/paddingVertical="(\$\d+)"\s+\$md=\{\{[^}]*paddingVertical:\s*"(\$\d+)"/g)].map(
        (m) => ({ f, base: m[1], md: m[2] }),
      ),
    );
    expect(bands.length).toBe(9);
    for (const b of bands) expect(b.base).toBe("$11");
  });

  it("leaves the desktop value alone", () => {
    // The ask was mobile. A band that also moved on desktop is a change nobody
    // asked for, and on a wide screen the content is shorter anyway.
    const bands = sources.flatMap(([f, s]) =>
      [...s.matchAll(/paddingVertical="(\$\d+)"\s+\$md=\{\{[^}]*paddingVertical:\s*"(\$\d+)"/g)].map(
        (m) => ({ f, md: m[2] }),
      ),
    );
    for (const b of bands) expect(b.md).toBe("$10");
  });

  it("never lets base and $md say the same thing again", () => {
    // That equality IS the original defect: a responsive override that reads
    // correct in a diff and resolves to one value in every browser.
    const same = sources.flatMap(([f, s]) =>
      [...s.matchAll(/paddingVertical="(\$\d+)"\s+\$md=\{\{[^}]*paddingVertical:\s*"(\$\d+)"/g)]
        .filter((m) => m[1] === m[2])
        .map(() => f),
    );
    expect(same).toEqual([]);
  });
});
