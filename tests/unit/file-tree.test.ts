import { ancestors, buildTree, type DirNode } from "@/components/editor/file-tree/tree";
import { glyph } from "@/components/editor/file-tree/glyph";

const page = (path: string) => ({ path, html: "" });

/**
 * The browser rendered one row per page, so `src/components/Header.html` was a
 * single row whose NAME was the whole path and every file sat at depth zero
 * whatever its real depth. The folders were in the data the whole time.
 *
 * Tested here rather than in the component because the shape of a tree is easy
 * to get subtly wrong — a lone child, a root file beside a folder, two paths
 * that diverge late — and impossible to see in a screenshot.
 */
describe("buildTree", () => {
  it("nests a path into folders", () => {
    const [dir] = buildTree([page("src/components/Header.html")]) as DirNode[];
    expect(dir.kind).toBe("dir");
    expect(dir.name).toBe("src");
    const inner = dir.children[0] as DirNode;
    expect(inner.name).toBe("components");
    expect(inner.children[0]).toEqual({
      kind: "file",
      name: "Header.html",
      path: "src/components/Header.html",
    });
  });

  it("keeps a root file at the root", () => {
    const nodes = buildTree([page("index.html")]);
    expect(nodes).toEqual([{ kind: "file", name: "index.html", path: "index.html" }]);
  });

  it("puts folders before files, each sorted by name", () => {
    const nodes = buildTree([
      page("index.html"),
      page("about.html"),
      page("src/app.html"),
      page("public/logo.html"),
    ]);
    expect(nodes.map((n) => `${n.kind}:${n.name}`)).toEqual([
      "dir:public",
      "dir:src",
      "file:about.html",
      "file:index.html",
    ]);
  });

  it("merges siblings under one folder rather than repeating it", () => {
    // Two passes over `src` must not create two `src` nodes — the bug that
    // makes a tree grow a duplicate folder per file added to it.
    const nodes = buildTree([page("src/a.html"), page("src/b.html")]);
    expect(nodes).toHaveLength(1);
    expect((nodes[0] as DirNode).children).toHaveLength(2);
  });

  it("survives a path that is nothing but slashes", () => {
    expect(buildTree([page("///")])).toEqual([]);
  });
});

describe("ancestors", () => {
  it("names every folder on the way to a file", () => {
    expect(ancestors("src/components/Header.html")).toEqual(["src", "src/components"]);
  });

  it("is empty for a root file — there is nothing to reveal", () => {
    expect(ancestors("index.html")).toEqual([]);
  });
});

describe("glyph", () => {
  // It returns the drawn ELEMENT now, so the identity these assertions are
  // about — which icon a name resolves to — is the element's `type`. React
  // reconciles by that same field, so asserting it is asserting the thing that
  // decides whether a row redraws or remounts.
  const iconOf = (name: string) => glyph(name, 14).type;

  it("gives different types different glyphs", () => {
    // The whole point: one icon for everything carried no information.
    const seen = new Set(
      ["a.html", "a.css", "a.ts", "a.json", "a.md", "a.png"].map(iconOf),
    );
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it("reads a dotfile's last segment, not its first", () => {
    // `.env`.split('.') is ['', 'env'] — taking the first segment would make
    // every dotfile unknown.
    expect(iconOf(".env")).toBe(iconOf("config.env"));
  });

  it("falls back rather than throwing on an unknown type", () => {
    expect(iconOf("LICENSE")).toBeTruthy();
    expect(iconOf("")).toBeTruthy();
  });

  it("draws at the size it is asked for", () => {
    // The size moved from the call site's `<Glyph size={14} />` into the
    // argument, so it is now this module's job to pass it on.
    expect(glyph("a.ts", 14).props.size).toBe(14);
  });
});
