import {
  parsePages,
  parseSinglePage,
  extractHtmlContent,
  stripThinkBlocks,
} from "@/lib/format-pages";

// The multi-file format the builder system prompt asks for.
const MULTI_FILE = `<<<<<<< START_TITLE index.html >>>>>>> END_TITLE
\`\`\`html
<!DOCTYPE html>
<html lang="en"><head><title>Max</title></head><body><h1>MaxPower</h1></body></html>
\`\`\`
<<<<<<< START_TITLE about.html >>>>>>> END_TITLE
\`\`\`html
<!DOCTYPE html>
<html><body><h2>About</h2></body></html>
\`\`\``;

// What zen-flash actually streams back: a bare document, no markers, no fence.
const BARE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Bean</title></head>
<body><h1>Bean Co.</h1></body>
</html>`;

describe("parsePages", () => {
  it("parses the multi-file START_TITLE format into clean pages", () => {
    const pages = parsePages(MULTI_FILE);
    expect(pages.map((p) => p.path)).toEqual(["index.html", "about.html"]);
    // No fences or title markers leak into the rendered html.
    for (const p of pages) {
      expect(p.html).not.toContain("```");
      expect(p.html).not.toContain("START_TITLE");
      expect(p.html.startsWith("<!DOCTYPE html>")).toBe(true);
      expect(p.html).toContain("</html>");
    }
  });

  it("parses a bare single-file HTML document (the real zen-flash shape)", () => {
    const pages = parsePages(BARE_HTML);
    expect(pages).toHaveLength(1);
    expect(pages[0].path).toBe("index.html");
    expect(pages[0].html).toContain("Bean Co.");
    expect(pages[0].html).not.toContain("```");
  });

  it("parses bare HTML wrapped in a ```html fence with no doctype", () => {
    const fenced = "```html\n<html><body><p>hi</p></body></html>\n```";
    const pages = parsePages(fenced);
    expect(pages).toHaveLength(1);
    expect(pages[0].html).not.toContain("```");
    expect(pages[0].html).toContain("<p>hi</p>");
  });

  it("strips a leading <think> block and still yields the page", () => {
    const pages = parsePages(`<think>let me plan this</think>\n${BARE_HTML}`);
    expect(pages).toHaveLength(1);
    expect(pages[0].html).not.toContain("<think>");
    expect(pages[0].html).toContain("Bean Co.");
  });

  it("strips a <think> block before the multi-file markers", () => {
    const pages = parsePages(`<think>planning</think>\n${MULTI_FILE}`);
    expect(pages.map((p) => p.path)).toEqual(["index.html", "about.html"]);
  });

  it("returns [] for a JSON error envelope (never a page)", () => {
    expect(parsePages(JSON.stringify({ ok: false, message: "boom" }))).toEqual(
      []
    );
  });

  it("never throws on empty / whitespace / marker-only / partial input", () => {
    const edge = [
      "",
      "   \n  ",
      undefined,
      null,
      "<<<<<<< START_TITLE index.html >>>>>>> END_TITLE",
      "<<<<<<< START_TITLE index.html >>>>>>> END_TITLE\n```html\n",
      "<<<<<<< START_TITLE index.html >>>>>>> END_TITLE\nplain text no doctype",
      "<think>still thinking with no close and no html",
      "{ not: valid json",
    ];
    for (const input of edge) {
      expect(() => parsePages(input as any)).not.toThrow();
      expect(Array.isArray(parsePages(input as any))).toBe(true);
    }
  });

  it("previews bare HTML mid-stream by closing open tags", () => {
    const partial = "<!DOCTYPE html>\n<html><head><title>x</title></head><body><h1>Building";
    const pages = parsePages(partial);
    expect(pages).toHaveLength(1);
    expect(pages[0].html).toContain("</body>");
    expect(pages[0].html).toContain("</html>");
  });
});

describe("parseSinglePage", () => {
  it("keeps a bare single-file edit on the page being edited", () => {
    const page = parseSinglePage(BARE_HTML, "about.html");
    expect(page).not.toBeNull();
    expect(page!.path).toBe("about.html");
    expect(page!.html).toContain("Bean Co.");
  });

  it("honours an explicit START_TITLE path over the current page", () => {
    const page = parseSinglePage(MULTI_FILE, "about.html");
    expect(page).not.toBeNull();
    // about.html is present in the multi-file payload, so it is chosen.
    expect(page!.path).toBe("about.html");
  });

  it("returns null when there is no renderable HTML", () => {
    expect(parseSinglePage("", "index.html")).toBeNull();
    expect(parseSinglePage("just some prose", "index.html")).toBeNull();
  });
});

describe("extractHtmlContent / stripThinkBlocks", () => {
  it("extractHtmlContent returns '' for undefined/empty and strips fences", () => {
    expect(extractHtmlContent(undefined)).toBe("");
    expect(extractHtmlContent("")).toBe("");
    expect(extractHtmlContent("no html here")).toBe("");
    const out = extractHtmlContent("```html\n<!DOCTYPE html><html></html>\n```");
    expect(out).not.toContain("```");
    expect(out.startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("stripThinkBlocks removes closed and open think blocks", () => {
    expect(stripThinkBlocks("<think>a</think>hi")).toBe("hi");
    expect(stripThinkBlocks("<think>unterminated")).toBe("");
    expect(stripThinkBlocks("")).toBe("");
  });
});
