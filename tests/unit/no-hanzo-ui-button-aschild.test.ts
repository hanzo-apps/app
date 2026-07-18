import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression guard for the React.Children.only / Radix Slot crash.
 *
 * The @hanzo/ui (ui-shadcn) Button ALWAYS renders its child as a 2-element
 * array (a loading-spinner slot + the real children). When `asChild` is set,
 * that Button uses Radix `<Slot>`, which calls `React.Children.only` on the
 * array and throws:
 *   "React.Children.only expected to receive a single React element child".
 *
 * The local `@/components/ui/button` does NOT inject that array, so it is
 * asChild-safe. This test fails if any component re-introduces the footgun:
 * a `<Button ... asChild>` in a file that imports `Button` from `@hanzo/ui`.
 *
 * Fix pattern (see components/project-manager/ProjectCard.tsx and
 * components/editor/cross-surface-links.tsx): render a plain anchor styled
 * with `buttonVariants(...)`, or import Button from `@/components/ui/button`.
 */

const ROOTS = ["components", "app"];
const EXT = /\.(tsx|jsx)$/;

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.test(name)) out.push(full);
  }
  return out;
}

/** True if the file imports the symbol `Button` from the '@hanzo/ui' package. */
function importsButtonFromHanzoUi(src: string): boolean {
  // Match `import { ... Button ... } from '@hanzo/ui'` (and "@hanzo/ui/...").
  const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]@hanzo\/ui(?:\/[^'"]*)?['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(src))) {
    const named = m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim());
    if (named.includes("Button")) return true;
  }
  return false;
}

/** Strip line and block comments so prose that mentions the pattern can't
 *  trip the scan (JSX `{/* ... *​/}` and `// ...` are both removed). */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/** True if the source contains a `<Button ... asChild ...>` opening tag. */
function hasButtonAsChild(src: string): boolean {
  return /<Button\b[^>]*\basChild\b/.test(stripComments(src));
}

const repoRoot = join(__dirname, "..", "..");

describe("no @hanzo/ui <Button asChild> (React.Children.only crash guard)", () => {
  const files = ROOTS.flatMap((r) => walk(join(repoRoot, r)));

  it("scans a non-trivial number of component files", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("has no <Button asChild> where Button comes from @hanzo/ui", () => {
    const offenders = files.filter((f) => {
      const src = readFileSync(f, "utf8");
      return importsButtonFromHanzoUi(src) && hasButtonAsChild(src);
    });
    expect(offenders.map((f) => f.replace(repoRoot + "/", ""))).toEqual([]);
  });
});
