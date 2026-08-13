/**
 * What the composer accepts when you drop a file on it.
 *
 * The rules that matter here are the ones a browser makes you learn the hard
 * way: the MIME type on a drop is not trustworthy, so the extension decides;
 * a file that is turned away has to SAY so, because a dropped file that quietly
 * vanishes reads as a broken page; and a legal 20 MB attachment is still an
 * illegal prompt, so the inlined text is cut and the cut is announced.
 */
import { ACCEPT, INLINE, KINDS, LIMIT, inline, kindOf, take } from "@/lib/attach";

// `lastModified` is pinned: it defaults to Date.now(), so two files built in the
// same test disagreed whenever the clock ticked between them — the identity test
// passed or failed on timing. A real file's mtime does not move while you drag it.
const file = (name: string, type = "", size = 10, lastModified = 1_700_000_000_000) =>
  Object.defineProperty(new File(["x".repeat(size)], name, { type, lastModified }), "size", {
    value: size,
  });

describe("the ten kinds", () => {
  it("is ten, and every one is distinct", () => {
    expect(KINDS).toHaveLength(10);
    expect(new Set(KINDS.map((k) => k.ext)).size).toBe(10);
  });

  it("offers the picker exactly what a drop takes", () => {
    for (const k of KINDS) {
      expect(ACCEPT).toContain(k.ext);
      expect(ACCEPT).toContain(k.mime);
    }
  });
});

describe("naming a file's kind", () => {
  it("trusts the extension over the type the browser guessed", () => {
    // Windows reports "" for .md; Safari reports text/plain for .csv.
    expect(kindOf(file("notes.md"))?.read).toBe("text");
    expect(kindOf(file("rows.csv", "text/plain"))?.read).toBe("text");
    expect(kindOf(file("shot.PNG"))?.read).toBe("image");
  });

  it("falls back to the MIME type when there is no extension", () => {
    expect(kindOf(file("screenshot", "image/png"))?.read).toBe("image");
  });

  it("treats .jpeg as .jpg, the one alias worth carrying", () => {
    expect(kindOf(file("holiday.jpeg"))?.ext).toBe(".jpg");
  });

  it("does not recognise what it cannot carry", () => {
    expect(kindOf(file("archive.zip"))).toBeUndefined();
    expect(kindOf(file("app.exe"))).toBeUndefined();
  });
});

describe("taking a drop", () => {
  it("says why it refused, rather than dropping it silently", () => {
    const { kept, refused } = take([file("a.md"), file("b.zip")]);
    expect(kept).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toContain("b.zip");
  });

  it("refuses anything over 20 MB, and says which", () => {
    const { kept, refused } = take([file("huge.json", "", LIMIT + 1)]);
    expect(kept).toEqual([]);
    expect(refused[0]).toContain("over 20 MB");
  });

  it("keeps a file exactly at the limit", () => {
    expect(take([file("edge.json", "", LIMIT)]).kept).toHaveLength(1);
  });

  it("identifies a file by name+size+mtime, so the same drop twice is one file", () => {
    const one = take([file("a.md")]).kept[0];
    const again = take([file("a.md")]).kept[0];
    expect(again.id).toBe(one.id);
    // A different name, a different size, or a different mtime is a different file.
    expect(take([file("b.md")]).kept[0].id).not.toBe(one.id);
    expect(take([file("a.md", "", 11)]).kept[0].id).not.toBe(one.id);
    expect(take([file("a.md", "", 10, 2)]).kept[0].id).not.toBe(one.id);
  });
});

describe("what reaches the prompt", () => {
  it("inlines what it can read, under its own name", async () => {
    const text = await inline(take([file("notes.md")]).kept);
    expect(text).toContain("--- notes.md ---");
    expect(text).toContain("x");
  });

  it("names what it cannot open, instead of pretending to have read it", async () => {
    const text = await inline(take([file("spec.pdf")]).kept);
    expect(text).toBe("[attached: spec.pdf]");
  });

  it("cuts a long file and SAYS it cut it", async () => {
    const text = await inline(take([file("big.json", "", INLINE + 5000)]).kept);
    expect(text).toContain(`(first ${INLINE} characters)`);
    // The body is capped; the header is the only thing beyond it.
    expect(text.length).toBeLessThan(INLINE + 200);
  });

  it("leaves a file just under the cut unannounced", async () => {
    const text = await inline(take([file("small.json", "", 50)]).kept);
    expect(text).not.toContain("characters)");
  });
});
