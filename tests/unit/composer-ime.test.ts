import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * No composer decides on its own whether the IME owns a keystroke.
 *
 * A keystroke an input method has claimed belongs to the input method. Get it
 * wrong and a Japanese, Chinese or Korean writer loses a half-typed word every
 * time they accept a candidate — the composer submits the turn instead. It is
 * invisible to anyone typing Latin script, which is why five composers here
 * carried five different Enter rules and only some of them checked.
 *
 * `sends` from @hanzo/ui/chat is the one place that knows the answer, and it
 * knows it three ways: `isComposing`, `key === "Process"`, and Safari's legacy
 * keyCode 229 — which Safari sets on the keydown that accepts a candidate while
 * leaving `isComposing` unset. A hand-rolled `!e.nativeEvent.isComposing` looks
 * like the fix and still drops the word on Safari. That is why this test bans
 * the bare comparison rather than asking for a flag check.
 *
 * It does NOT require every surface to share one send RULE. chat-panel wants
 * Cmd/Ctrl+Enter where the others take a bare Enter, and that is a product
 * decision each surface may keep — it reads `sends` and narrows the result.
 * What may not vary is who decides the IME question.
 */
const root = join(__dirname, "..", "..");

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Files that decide, on a keystroke, whether to submit a composer draft. */
function composers(): { file: string; src: string }[] {
  const out: { file: string; src: string }[] = [];
  for (const file of sources(join(root, "components")).concat(sources(join(root, "app")))) {
    // Templates under app/templates are GENERATED APP source — someone else's
    // program that we render, not this app's chrome. Their key handling is
    // their own.
    if (file.includes(`${"app"}/templates/`)) continue;
    const src = readFileSync(file, "utf8");
    // A submit-on-key decision, not a button activated by Enter/Space.
    if (!/key\s*===\s*['"]Enter['"]/.test(src)) continue;
    if (/key\s*===\s*['"] ['"]|key\s*===\s*['"]Space['"]/.test(src)) continue;
    out.push({ file: file.slice(root.length + 1), src });
  }
  return out;
}

describe("who decides a keystroke belongs to the IME", () => {
  it("finds the composers at all, so an empty pass means something", () => {
    // A scanner that matched nothing would satisfy every assertion below for
    // entirely the wrong reason.
    expect(composers().length).toBeGreaterThan(0);
  });

  it("never hand-rolls the check — isComposing alone misses Safari", () => {
    const handRolled = composers()
      .filter(({ src }) => /isComposing/.test(src) && !/\bsends\s*\(/.test(src))
      .map(({ file }) => file);
    expect(handRolled).toEqual([]);
  });

  it("asks sends() wherever a keystroke submits a draft", () => {
    // Every surviving Enter-to-submit decision routes through the shared
    // predicate. Narrowing its answer afterwards is fine; replacing it is not.
    const deciding = composers().filter(({ src }) =>
      /preventDefault\(\)/.test(src) && /key\s*===\s*['"]Enter['"]/.test(src),
    );
    const without = deciding.filter(({ src }) => !/\bsends\s*\(/.test(src)).map(({ file }) => file);
    expect(without).toEqual([]);
  });
});
