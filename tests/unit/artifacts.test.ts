import { artifactUrl, artifacts, previewable } from "@/components/editor/files/artifacts";

const page = (path: string) => ({ path, html: "" });

/**
 * The Sandbox group shows what the pod holds BEYOND the app. The exclusion is
 * the part that rots invisibly — one normalisation difference and every page
 * quietly reappears as an artifact — so it is a pure function with the cases
 * spelled out.
 */
describe("artifacts", () => {
  it("excludes the app's own pages", () => {
    expect(artifacts(["index.html", "deck.pptx"], [page("index.html")])).toEqual(["deck.pptx"]);
  });

  it("excludes them across the ./ normalisation gap", () => {
    // Sandbox listings arrive find(1)-style; pages are stored bare. These are
    // the same file.
    expect(artifacts(["./index.html", "./out/deck.pptx"], [page("index.html")])).toEqual([
      "out/deck.pptx",
    ]);
  });

  it("dedupes and sorts", () => {
    expect(artifacts(["b.csv", "a.csv", "./b.csv"], [])).toEqual(["a.csv", "b.csv"]);
  });

  it("drops empty entries rather than rendering blank rows", () => {
    expect(artifacts(["", "  ", "x.txt"], [])).toEqual(["x.txt"]);
  });
});

describe("artifactUrl", () => {
  it("addresses the sandbox-file door, both parts encoded", () => {
    expect(artifactUrl("sb 1", "out/my deck.pptx")).toBe(
      "/v1/shell/files?sandbox=sb%201&file=out%2Fmy%20deck.pptx",
    );
  });
});

describe("previewable", () => {
  it("images render, text renders, binaries are offered honestly", () => {
    expect(previewable("shot.png")).toBe("image");
    expect(previewable("notes.md")).toBe("text");
    expect(previewable("deck.pptx")).toBeNull();
    expect(previewable("archive.zip")).toBeNull();
  });
});
