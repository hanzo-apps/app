import { withTag } from "@/lib/publishing/tag";

/**
 * The hosted tag is the ONE telemetry wire a published site carries, and these
 * pin the properties that would fail silently: a page that never emits (tag
 * dropped), a double tag (republish), or a broken site (tag injected into a
 * page that must pass through untouched).
 */
describe("withTag", () => {
  const KEY = "pk-abc_123";

  it("injects before </head>, deferred, with the key encoded", () => {
    const out = withTag("<html><head><title>x</title></head><body></body></html>", KEY);
    expect(out).toContain('src="https://api.hanzo.ai/v1/event.js?key=pk-abc_123"');
    expect(out).toContain("defer");
    expect(out.indexOf("event.js")).toBeLessThan(out.indexOf("</head>"));
  });

  it("falls back to </body>, then to appending — every page leaves tagged", () => {
    const noHead = withTag("<body><p>hi</p></body>", KEY);
    expect(noHead.indexOf("event.js")).toBeLessThan(noHead.indexOf("</body>"));
    const fragment = withTag("<p>hi</p>", KEY);
    expect(fragment).toMatch(/event\.js/);
  });

  it("is idempotent — republishing never doubles the tag", () => {
    const once = withTag("<html><head></head></html>", KEY);
    const twice = withTag(once, KEY);
    expect(twice.match(/event\.js/g)?.length).toBe(1);
  });

  it("no key → the page passes through byte-identical", () => {
    const page = "<html><head></head><body></body></html>";
    expect(withTag(page, "")).toBe(page);
  });

  it("encodes a hostile key rather than letting it close the attribute", () => {
    const out = withTag("<html><head></head></html>", 'pk-"a&b');
    expect(out).not.toContain('key=pk-"');
    expect(out).toContain("key=pk-%22a%26b");
  });
});
