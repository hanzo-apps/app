import { basename, byFolder, folder } from "@/lib/path";

/**
 * The order two pickers now share.
 *
 * `byFolder` replaced `groupPages` and `groupFiles`, which were the same twenty
 * lines over two item types — so this is the first test the law has had, and the
 * order is the whole of it: the root before any folder, folders alphabetically,
 * and the index page leading its own folder. A picker that lists `about.html`
 * above `index.html` is not broken in any way a reader could name; it is just
 * subtly wrong every time.
 */
describe("paths grouped by folder", () => {
  it("puts the root first, then folders, index leading each", () => {
    const items = [
      { path: "/blog/post.html" },
      { path: "about.html" },
      { path: "/blog/index.html" },
      { path: "index.html" },
      { path: "shop/cart.html" },
    ];
    expect(byFolder(items)).toEqual([
      { folder: "", items: [{ path: "index.html" }, { path: "about.html" }] },
      { folder: "blog", items: [{ path: "/blog/index.html" }, { path: "/blog/post.html" }] },
      { folder: "shop", items: [{ path: "shop/cart.html" }] },
    ]);
  });

  it("reads a name and a folder off either spelling of a path", () => {
    // Bare and rooted are the same path. Both spellings reach these pickers: the
    // builder stores pages bare, the VFS roots them.
    expect(["index.html", "/index.html"].map(basename)).toEqual(["index.html", "index.html"]);
    expect(["blog/a.html", "/blog/a.html"].map(folder)).toEqual(["blog", "blog"]);
    expect(folder("index.html")).toBe("");
  });
});
