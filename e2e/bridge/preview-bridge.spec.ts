import { test, expect } from '@playwright/test';
import { withBridge } from '../../components/editor/preview/bridge';

/**
 * The bridge, exercised in a real browser against a REAL sandboxed frame — the
 * one without `allow-same-origin`. jsdom cannot stand in for this: the whole
 * property under test is what the browser denies across an opaque origin, and
 * jsdom denies nothing.
 *
 * The first test is the security property itself. The rest prove the editor can
 * still do its job through messages once it can no longer reach the DOM.
 */

/** A host page: the sandboxed frame plus a recorder for what it sends up. */
const host = (frameHtml: string) => `
<!doctype html><html><body>
<script>
  window.__events = [];
  window.addEventListener('message', (e) => {
    if (e.source === document.getElementById('f').contentWindow) window.__events.push(e.data);
  });
  window.__send = (m) => document.getElementById('f').contentWindow.postMessage(m, '*');
</script>
<iframe id="f" sandbox="allow-scripts" srcdoc="${frameHtml.replace(/"/g, '&quot;')}"></iframe>
</body></html>`;

const PAGE = withBridge('<h1 id="title">Hello</h1><p class="lede">Body</p><a href="/next">Next</a>');

const ready = async (page: import('@playwright/test').Page) => {
  await page.setContent(host(PAGE));
  await expect
    .poll(() => page.evaluate(() => (window as any).__events.some((e: any) => e.type === 'preview:ready')))
    .toBe(true);
};

test('the frame cannot reach this origin — the whole point', async ({ page }) => {
  await ready(page);

  // What the host gives up: the DOM handle the editor used to reach through.
  // This is exactly why the instrumentation had to move into the bridge.
  expect(
    await page.evaluate(() => (document.getElementById('f') as HTMLIFrameElement).contentDocument),
  ).toBeNull();

  // And it is denied, not merely absent — reading through the window throws.
  const reach = await page.evaluate(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (document.getElementById('f') as HTMLIFrameElement).contentWindow!.document;
      return 'REACHED';
    } catch (e) {
      return (e as Error).name;
    }
  });
  expect(reach).toBe('SecurityError');
});

test('an exfiltration attempt from inside the frame fails', async ({ page }) => {
  const hostile = withBridge(`<script>
    var out = 'clean';
    try { out = String(top.localStorage.getItem('x')); } catch (e) { out = 'DENIED:' + e.name; }
    window.parent.postMessage({ type: 'preview:navigate', path: out }, '*');
  </script>`);
  await page.setContent(host(hostile));

  const got = await page
    .waitForFunction(() => (window as any).__events.find((e: any) => e.type === 'preview:navigate')?.path)
    .then((h) => h.jsonValue());

  // A SecurityError, not a value. Before the sandbox change this read the token.
  expect(String(got)).toContain('DENIED');
});

test('hover and click cross as selectors, not nodes', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => (window as any).__send({ type: 'preview:editable', active: true }));

  await page.frameLocator('#f').locator('#title').hover();
  await expect
    .poll(() => page.evaluate(() => (window as any).__events.find((e: any) => e.type === 'preview:hover')?.selector))
    .toBe('#title');

  // Geometry travels too. The host draws its hover overlay from a rect it used
  // to read off the node with getBoundingClientRect() — the one call that cannot
  // cross an origin — so without this the overlay would silently stop drawing.
  const hover = await page.evaluate(
    () => (window as any).__events.find((e: any) => e.type === 'preview:hover'),
  );
  expect(hover.tagName).toBe('h1');
  expect(hover.rect.width).toBeGreaterThan(0);
  expect(hover.rect.height).toBeGreaterThan(0);

  await page.frameLocator('#f').locator('#title').click();
  const info = await page.evaluate(
    () => (window as any).__events.find((e: any) => e.type === 'preview:select')?.info,
  );
  expect(info.selector).toBe('#title');
  expect(info.tagName).toBe('h1');
  expect(info.text).toContain('Hello');
  // Serialisable: a live node would not survive the structured clone at all.
  expect(typeof info.styles.color).toBe('string');
});

test('style and text edits still land, by selector', async ({ page }) => {
  await ready(page);

  await page.evaluate(() =>
    (window as any).__send({ type: 'preview:style', selector: '#title', property: 'color', value: 'rgb(1, 2, 3)' }),
  );
  await expect(page.frameLocator('#f').locator('#title')).toHaveCSS('color', 'rgb(1, 2, 3)');

  await page.evaluate(() =>
    (window as any).__send({ type: 'preview:text', selector: '.lede', text: 'Edited' }),
  );
  await expect(page.frameLocator('#f').locator('.lede')).toHaveText('Edited');
});

test('a link navigates through the host instead of loading in place', async ({ page }) => {
  await ready(page);
  await page.frameLocator('#f').locator('a').click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__events.find((e: any) => e.type === 'preview:navigate')?.path))
    .toBe('/next');
});

test('the frame ignores commands that did not come from its embedder', async ({ page }) => {
  await ready(page);

  // A sibling frame CAN get a handle to ours — `parent.frames[0]` is reachable
  // across origins for postMessage, which is the whole reason the bridge checks
  // `e.source !== window.parent` rather than trusting anything that arrives.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const evil = document.createElement('iframe');
        evil.setAttribute('sandbox', 'allow-scripts');
        evil.srcdoc = `<script>
          parent.frames[0].postMessage(
            { type: 'preview:style', selector: '#title', property: 'color', value: 'rgb(6, 6, 6)' }, '*');
          parent.postMessage({ sent: true }, '*');
        <\/script>`;
        window.addEventListener('message', function once(e: MessageEvent) {
          if ((e.data as { sent?: boolean })?.sent) {
            window.removeEventListener('message', once);
            resolve();
          }
        });
        document.body.appendChild(evil);
      }),
  );

  // The forged command must have changed nothing. Then a real one must still
  // work, so this cannot pass by the bridge being deaf to everything.
  await expect(page.frameLocator('#f').locator('#title')).not.toHaveCSS('color', 'rgb(6, 6, 6)');
  await page.evaluate(() =>
    (window as any).__send({ type: 'preview:style', selector: '#title', property: 'color', value: 'rgb(9, 9, 9)' }),
  );
  await expect(page.frameLocator('#f').locator('#title')).toHaveCSS('color', 'rgb(9, 9, 9)');
});
