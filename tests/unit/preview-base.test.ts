import { withBase, withBridge } from "@/components/editor/preview/bridge";

/**
 * The preview frame has no address, so the document needs to be told one.
 *
 * Measured against the live builder: MEGA Shop is a deployed Vite build whose
 * body is `<div id="root"></div>` and whose bundle is `/assets/index-*.js`.
 * Inside `srcDoc` that path resolved to hanzo.app, which answered 404 with
 * 26,208 bytes of its own HTML, so the frame rendered blank white — the "it
 * looks like absolute shit" screenshot. With a base pointing at the project's
 * own origin the same request came back 200 and 1.6 MB of JavaScript.
 *
 * These pin the parts that a regex gets wrong: WHERE the base lands (before the
 * first asset tag, or it governs nothing), and what must be left alone.
 */

const LIVE = "https://megashop.hanzo.app";

describe("withBase", () => {
  it("puts the base first inside <head>, AHEAD of the assets it has to govern", () => {
    const html = `<!doctype html><html><head><title>x</title><script type="module" src="/assets/i.js"></script></head><body></body></html>`;
    const out = withBase(html, LIVE);
    expect(out).toContain(`<base href="https://megashop.hanzo.app/">`);
    // Order is the whole point: a base after the tag does not apply to the tag.
    expect(out.indexOf("<base")).toBeLessThan(out.indexOf("/assets/i.js"));
    expect(out.indexOf("<base")).toBeLessThan(out.indexOf("<title>"));
  });

  it("keeps the document's own bytes intact", () => {
    const html = `<!doctype html><html><head></head><body><div id="root"></div></body></html>`;
    const out = withBase(html, LIVE);
    expect(out.replace(/<base[^>]*>/, "")).toBe(html);
  });

  it("uses the ORIGIN only — a path, query or hash on the live URL is not a base", () => {
    const out = withBase(`<html><head></head></html>`, "https://megashop.hanzo.app/deep/page?a=1#b");
    expect(out).toContain(`<base href="https://megashop.hanzo.app/">`);
  });

  it("does nothing without a URL — most of a build has nothing deployed yet", () => {
    const html = `<html><head></head><body>hi</body></html>`;
    expect(withBase(html, null)).toBe(html);
    expect(withBase(html, undefined)).toBe(html);
    expect(withBase(html, "")).toBe(html);
  });

  it("never overrules a document that already declares its own base", () => {
    const html = `<html><head><base href="https://elsewhere.example/"></head></html>`;
    expect(withBase(html, LIVE)).toBe(html);
  });

  it("does not inject when there is no <head> — a base before the doctype means quirks mode", () => {
    // A streaming document mid-generation. Silently correct beats subtly broken.
    const partial = `<!doctype html><html`;
    expect(withBase(partial, LIVE)).toBe(partial);
    expect(withBase(`<div>fragment</div>`, LIVE)).toBe(`<div>fragment</div>`);
  });

  it("does not mistake <header> for <head>", () => {
    // The trap: /<head[^>]*>/ matches <header> and would put a <base> inside the
    // BODY, where it is both too late to matter and visible markup.
    const html = `<html><body><header>nav</header></body></html>`;
    expect(withBase(html, LIVE)).toBe(html);
  });

  it("matches a <head> that carries attributes", () => {
    const out = withBase(`<html><head lang="en" data-x="1"><title>t</title></head></html>`, LIVE);
    expect(out).toContain(`<head lang="en" data-x="1"><base href="https://megashop.hanzo.app/">`);
  });

  it("refuses anything that is not an http(s) address", () => {
    // The value lands in an href inside a frame that runs scripts, so the set of
    // accepted schemes is stated, not filtered.
    const html = `<html><head></head></html>`;
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>x</script>", "file:///etc/passwd", "not a url", "//evil.example"]) {
      expect(withBase(html, bad)).toBe(html);
    }
  });
});

describe("withBridge", () => {
  it("still appends the bridge, and composes with the base", () => {
    const out = withBridge(`<html><head></head><body></body></html>`, LIVE);
    expect(out).toContain("<base href=");
    expect(out).toContain("preview:ready");
    // bridge last, base first — the document sits between them
    expect(out.indexOf("<base")).toBeLessThan(out.indexOf("preview:ready"));
  });

  it("is unchanged for a project with nothing deployed", () => {
    const html = `<html><head></head><body></body></html>`;
    expect(withBridge(html)).toBe(withBridge(html, null));
    expect(withBridge(html)).not.toContain("<base");
  });

  it("passes empty html straight through", () => {
    expect(withBridge("", LIVE)).toBe("");
  });
});
