import { locate } from "@/lib/source-locate";

/**
 * The visual-edit round trip: click an element, get back the file and line that
 * wrote it. These pin the two things the previous locator got wrong, so a
 * regression shows up here rather than as an agent editing the wrong document.
 */

const pages = [
  {
    path: "index.html",
    html: [
      "<!doctype html>",
      "<html>",
      "  <body>",
      "    <h1 class='site-title'>Welcome to the shop</h1>",
      "    <button id=\"buy\" class=\"btn primary\">Buy</button>",
      "    <a href='/about'>About</a>",
      "  </body>",
      "</html>",
    ].join("\n"),
  },
  {
    path: "about.html",
    html: ["<html>", "  <body>", "    <h1 class='site-title'>About us</h1>", "  </body>", "</html>"].join("\n"),
  },
];

describe("locate — which file and line wrote the thing I clicked", () => {
  it("answers with the RIGHT FILE, not a hardcoded index.html", () => {
    // The element lives in about.html. The old locator searched one buffer and
    // labelled every answer "index.html", so this is the multi-page bug.
    const hit = locate({ tagName: "H1", text: "About us" }, pages);
    expect(hit?.file).toBe("about.html");
    expect(hit?.line).toBe(3);
  });

  it("finds an id even though the browser re-quotes attributes", () => {
    const hit = locate({ tagName: "BUTTON", id: "buy" }, pages);
    expect(hit).toEqual({ file: "index.html", line: 5, column: 13, via: "id" });
  });

  it("matches a SINGLE-quoted source attribute from a double-quoted DOM report", () => {
    // The DOM always reports class="site-title"; the source wrote class='site-title'.
    // A naive equality check misses this, which is most of why the old match failed.
    const hit = locate(
      { tagName: "A", html: '<a href="/about">About</a>' },
      pages,
    );
    expect(hit?.file).toBe("index.html");
    expect(hit?.via).toBe("attribute");
  });

  it("REFUSES to answer when the anchor is ambiguous", () => {
    // `site-title` appears in both pages. A location that could be either is not
    // a location — returning one would send an edit to a coin-flip file.
    const hit = locate({ tagName: "H1", className: "site-title" }, pages);
    expect(hit).toBeUndefined();
  });

  it("does not resolve short text, which repeats", () => {
    expect(locate({ tagName: "BUTTON", text: "Buy" }, pages)).toBeUndefined();
  });

  it("returns undefined rather than guessing when nothing anchors", () => {
    expect(locate({ tagName: "SPAN" }, pages)).toBeUndefined();
    expect(locate({ tagName: "SPAN", id: "nope" }, [])).toBeUndefined();
  });
});

describe("the serialization gap the old matcher fell into", () => {
  it("browser outerHTML does NOT equal the source that wrote it", () => {
    // This is the premise, stated as a test so it cannot quietly stop being true.
    // The old locator regex-matched outerHTML.substring(0,100) against source.
    const source = `<button id='buy'   class='btn primary' >Buy</button>`;
    const serialized = `<button id="buy" class="btn primary">Buy</button>`;
    expect(source.includes(serialized)).toBe(false);

    // The ladder still finds it, because it anchors on a property that survives.
    const hit = locate({ tagName: "BUTTON", id: "buy", html: serialized }, [
      { path: "page.html", html: source },
    ]);
    expect(hit?.file).toBe("page.html");
    expect(hit?.via).toBe("id");
  });
});

describe("text is matched as element CONTENT, never as a substring", () => {
  const trap = [
    { path: "t.html", html: '<div id="Buyers">\n  <span>Purchase</span>\n</div>' },
  ];

  it("does not resolve text that only occurs inside an attribute", () => {
    // "Buyer" appears in `id="Buyers"` and nowhere as content. A substring
    // matcher reports line 1 — an attribute — and an agent then edits an id.
    expect(locate({ tagName: "SPAN", text: "Buyer" }, trap)).toBeUndefined();
  });

  it("resolves real element content to its own line", () => {
    const hit = locate({ tagName: "SPAN", text: "Purchase" }, trap);
    expect(hit?.line).toBe(2);
    expect(hit?.via).toBe("text");
  });
});

/**
 * The rungs above are fed hand-written strings, which encodes MY belief about
 * what a browser emits. These feed `locate` what a real DOM actually produces:
 * the source goes through the parser, and the anchor is read back off the live
 * node exactly as the preview bridge reads it. If a browser serializes
 * differently than assumed, this is where it shows.
 */
describe("against a REAL DOM's serialization, not a hand-written one", () => {
  const SOURCE = [
    "<div id='wrap'>",
    "  <button id='buy'   class='btn primary'   data-testid='buy-cta'>Add to cart</button>",
    "  <p class='note'>Ships in 2 days</p>",
    "</div>",
  ].join("\n");

  const anchorFromDom = (sel: string) => {
    document.body.innerHTML = SOURCE;
    const el = document.querySelector(sel) as HTMLElement;
    return {
      id: el.id || undefined,
      className: el.className || undefined,
      tagName: el.tagName,
      html: el.outerHTML,          // the browser's own serialization
      text: el.textContent ?? undefined,
    };
  };

  it("the DOM really does rewrite the source (the premise, measured)", () => {
    const a = anchorFromDom("#buy");
    // Single quotes became double and the run of spaces collapsed, so the
    // source text does NOT contain what the DOM handed us.
    expect(SOURCE.includes(a.html!)).toBe(false);
    expect(a.html).toContain('id="buy"');
  });

  it("still locates the button, from real outerHTML", () => {
    const hit = locate(anchorFromDom("#buy"), [{ path: "shop.html", html: SOURCE }]);
    expect(hit).toMatchObject({ file: "shop.html", line: 2, via: "id" });
  });

  it("locates an element with no id, via its real class list", () => {
    const hit = locate(anchorFromDom("p.note"), [{ path: "shop.html", html: SOURCE }]);
    expect(hit?.file).toBe("shop.html");
    expect(hit?.line).toBe(3);
  });

  it("locates by data-testid when id and class are absent", () => {
    const a = anchorFromDom("#buy");
    const hit = locate(
      { tagName: a.tagName, html: a.html },   // attribute rung only
      [{ path: "shop.html", html: SOURCE }],
    );
    expect(hit?.via).toBe("attribute");
    expect(hit?.line).toBe(2);
  });
});
