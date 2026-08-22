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
    expect(out).toContain('src="https://api.hanzo.ai/v1/event/tag.js?key=pk-abc_123"');
    expect(out).toContain("defer");
    expect(out.indexOf("event/tag.js")).toBeLessThan(out.indexOf("</head>"));
  });

  // The tag moved from /v1/event.js (a sibling of the /v1/event prefix, which the
  // fleet routed nowhere) to /v1/event/tag.js. A page published before the move
  // carries the dead address, and republishing must leave ONE working tag — never
  // the dead one beside a live one.
  it("replaces a superseded tag rather than adding a second", () => {
    const stale =
      '<html><head><script src="https://api.hanzo.ai/v1/event.js?key=pk-old" defer></script></head><body></body></html>';
    const out = withTag(stale, KEY);
    expect(out).not.toContain("/v1/event.js?");
    expect(out.match(/api\.hanzo\.ai/g)).toHaveLength(1);
    expect(out).toContain('src="https://api.hanzo.ai/v1/event/tag.js?key=pk-abc_123"');
  });

  it("falls back to </body>, then to appending — every page leaves tagged", () => {
    const noHead = withTag("<body><p>hi</p></body>", KEY);
    expect(noHead.indexOf("event/tag.js")).toBeLessThan(noHead.indexOf("</body>"));
    const fragment = withTag("<p>hi</p>", KEY);
    expect(fragment).toMatch(/event\/tag\.js/);
  });

  it("is idempotent — republishing never doubles the tag", () => {
    const once = withTag("<html><head></head></html>", KEY);
    const twice = withTag(once, KEY);
    expect(twice.match(/event\/tag\.js/g)?.length).toBe(1);
  });

  it("never emits the retired sibling address, which 404s", () => {
    // Every customer site published while this read "/v1/event.js" carries a
    // script tag the door does not answer. The tag is a child of the door now.
    expect(withTag("<html><head></head></html>", KEY)).not.toContain("/v1/event.js");
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
