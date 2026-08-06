/**
 * The preview rewrite, proven against the shape a real multi-file template has:
 * a stylesheet in `css/`, a responsive image in `srcset`, a background and a
 * face declared with `url(…)`. Each of those is a case the two hand-written
 * copies of this rewrite used to miss, and each is why such a template came up
 * unstyled or short of images in the frame.
 */
import { resolveAssets, resolveUrls } from '@/lib/preview/rewrite';

/** A compiled project: the files a fixture template owns, as blob URLs. */
const blobs = new Map<string, string>([
  ['/css/style.css', 'blob:https://hanzo.app/css-1'],
  ['/js/app.js', 'blob:https://hanzo.app/js-1'],
  ['/images/hero.png', 'blob:https://hanzo.app/hero-1'],
  ['/images/hero@2x.png', 'blob:https://hanzo.app/hero-2'],
  ['/images/bg.jpg', 'blob:https://hanzo.app/bg-1'],
  ['/fonts/satoshi.woff2', 'blob:https://hanzo.app/font-1'],
  ['/video/reel.mp4', 'blob:https://hanzo.app/reel-1'],
  ['/poster.jpg', 'blob:https://hanzo.app/poster-1'],
  // A real page of the project, which the frame navigates rather than loads.
  ['/about.html', 'blob:https://hanzo.app/about-1'],
]);

describe('resolveAssets', () => {
  it('points a css/ stylesheet link at its blob', () => {
    const out = resolveAssets('<link rel="stylesheet" href="css/style.css">', blobs);
    expect(out).toBe('<link rel="stylesheet" href="blob:https://hanzo.app/css-1">');
  });

  it('resolves every candidate in a srcset, keeping the descriptors', () => {
    const out = resolveAssets(
      '<img src="images/hero.png" srcset="images/hero.png 1x, images/hero@2x.png 2x">',
      blobs,
    );
    expect(out).toContain('src="blob:https://hanzo.app/hero-1"');
    expect(out).toContain(
      'srcset="blob:https://hanzo.app/hero-1 1x, blob:https://hanzo.app/hero-2 2x"',
    );
  });

  it('resolves a width-descriptor srcset', () => {
    const out = resolveAssets('<img srcset="images/hero.png 640w, images/hero@2x.png 1280w">', blobs);
    expect(out).toBe(
      '<img srcset="blob:https://hanzo.app/hero-1 640w, blob:https://hanzo.app/hero-2 1280w">',
    );
  });

  it('resolves a srcset candidate that carries no descriptor', () => {
    const out = resolveAssets('<img srcset="images/hero.png">', blobs);
    expect(out).toBe('<img srcset="blob:https://hanzo.app/hero-1">');
  });

  it('resolves url() for a background and a @font-face inside a <style> block', () => {
    const out = resolveAssets(
      `<style>
        body { background: url('images/bg.jpg') no-repeat; }
        @font-face { font-family: Satoshi; src: url("fonts/satoshi.woff2") format('woff2'); }
      </style>`,
      blobs,
    );
    expect(out).toContain('url("blob:https://hanzo.app/bg-1")');
    expect(out).toContain('url("blob:https://hanzo.app/font-1")');
    // The format() hint is not a reference and must survive untouched.
    expect(out).toContain("format('woff2')");
  });

  it('resolves poster and a <source> inside video', () => {
    const out = resolveAssets(
      '<video poster="poster.jpg"><source src="video/reel.mp4" type="video/mp4"></video>',
      blobs,
    );
    expect(out).toContain('poster="blob:https://hanzo.app/poster-1"');
    expect(out).toContain('src="blob:https://hanzo.app/reel-1"');
  });

  it('understands ./ and / as the same file', () => {
    expect(resolveAssets('<img src="./images/hero.png">', blobs)).toContain('/hero-1');
    expect(resolveAssets('<img src="/images/hero.png">', blobs)).toContain('/hero-1');
    expect(resolveAssets('<img src="images/hero.png">', blobs)).toContain('/hero-1');
  });

  it('handles single-quoted attributes', () => {
    expect(resolveAssets("<script src='js/app.js'></script>", blobs)).toBe(
      "<script src='blob:https://hanzo.app/js-1'></script>",
    );
  });

  it('leaves references that already resolve exactly as written', () => {
    const settled = [
      '<link rel="stylesheet" href="https://cdn.example.com/a.css">',
      '<img src="//cdn.example.com/a.png">',
      '<img src="data:image/gif;base64,R0lGOD">',
      '<img src="blob:https://hanzo.app/existing">',
      '<a href="#section">jump</a>',
      '<a href="about.html">about</a>',
    ];
    for (const html of settled) expect(resolveAssets(html, blobs)).toBe(html);
  });

  it('leaves a page link alone even when the project has that page', () => {
    // The frame navigates this; a blob URL here would replace the navigation
    // with a dead end that loads the page's markup out of its own project.
    const html = '<a href="about.html">about</a>';
    expect(resolveAssets(html, blobs)).toBe(html);
  });

  it('leaves a reference the project has no file for', () => {
    const html = '<img src="images/missing.png" srcset="images/missing.png 2x">';
    expect(resolveAssets(html, blobs)).toBe(html);
  });

  it('rewrites a whole document without disturbing its text', () => {
    const doc = [
      '<!DOCTYPE html><html><head>',
      '<link rel="stylesheet" href="css/style.css">',
      '<style>.hero{background:url(images/bg.jpg)}</style>',
      '</head><body>',
      '<img src="images/hero.png" srcset="images/hero@2x.png 2x" alt="A hero, 2x wide">',
      '<script src="js/app.js"></script>',
      '</body></html>',
    ].join('');
    const out = resolveAssets(doc, blobs);

    expect(out).not.toMatch(/href="css\//);
    expect(out).not.toMatch(/src="images\//);
    expect(out).not.toMatch(/srcset="images\//);
    expect(out).not.toMatch(/url\(images\//);
    expect(out).toContain('alt="A hero, 2x wide"');
    expect(out).toContain('<!DOCTYPE html>');
  });
});

describe('resolveUrls', () => {
  it('resolves quoted, unquoted and spaced url() forms', () => {
    expect(resolveUrls('a{background:url(images/bg.jpg)}', blobs)).toContain('url("blob:https://hanzo.app/bg-1")');
    expect(resolveUrls("a{background:url('images/bg.jpg')}", blobs)).toContain('url("blob:https://hanzo.app/bg-1")');
    expect(resolveUrls('a{background:url( "images/bg.jpg" )}', blobs)).toContain('url("blob:https://hanzo.app/bg-1")');
  });

  it('leaves a data: face alone', () => {
    const css = '@font-face{src:url(data:font/woff2;base64,AAA)}';
    expect(resolveUrls(css, blobs)).toBe(css);
  });
});
