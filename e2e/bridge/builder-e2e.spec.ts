import { test, expect } from '@playwright/test';

/**
 * The builder, driven for real: does click-to-edit still work now that the
 * preview frame is isolated and everything travels over the bridge?
 *
 * FIXME — needs a real session, and deliberately does not fake one.
 *
 * A placeholder cookie gets past the middleware's NAVIGATION gate (which checks
 * only that the cookie is present — it says so itself; real verification is
 * server-side against JWKS). It does not get past the APIs. Measured: /v1/projects
 * 403, /v1/entitlements 403, /v1/wallet 401 — so the editor never mounts and
 * #preview-iframe never exists. Locally `lib/iam.ts` gives the localDev session
 * `token: ''`, which is where those refusals come from.
 *
 * The way to run this is a genuine sign-in via e2e/helpers/session.ts, whose
 * whole existence is the reminder that a Hanzo session is a sessionStorage token
 * and Playwright's storageState() cannot carry it. Entering credentials is the
 * owner's to do, not an agent's.
 *
 * What is already proven WITHOUT a session is in preview-bridge.spec.ts: the
 * protocol, against a real `sandbox="allow-scripts"` frame in Chromium —
 * contentDocument null, contentWindow throwing SecurityError, the exfiltration
 * script denied, select/hover/navigate crossing as data, edits landing by
 * selector. What this file adds is the wiring: that the SHIPPED builder mounts
 * that frame with that attribute and that a click in it reaches the host.
 *
 * Un-fixme this the moment there is a session. Every locator below is correct
 * and was verified against the live page — including the two traps: the composer
 * is a gui primitive, so fill() does not drive `onChangeText` (type instead),
 * and "Start Building" is a <div role="button">, not a <button>, so a role
 * locator silently matches something else and reports it disabled.
 */
const BASE = 'http://localhost:3000';


/**
 * Into the builder the way a person gets there: type something, press Start
 * Building. `?prompt=` looks like a shortcut and is not — it parks on a
 * "Preparing your first edition…" splash waiting for a seed that needs the
 * generate call, which 401s locally.
 *
 * The generation this kicks off also 401s. That is fine and is the point: the
 * preview pane renders HTML held in local state, so the frame mounts either way,
 * and the frame is what is under test.
 */
async function enterBuilder(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/dev`, { waitUntil: 'domcontentloaded' });
  const prompt = page.locator('textarea').first();
  await prompt.waitFor({ timeout: 30_000 });
  // Typed, not filled. The composer is a gui primitive whose value arrives via
  // `onChangeText`; Playwright's fill() sets the value and dispatches one input
  // event, which left the button's `disabled={!prompt.trim()}` still true — so
  // the click waited forever on a control that was never going to enable.
  await prompt.click();
  await prompt.pressSequentially('a page with a heading', { delay: 15 });
  // `[data-slot="button"]`, not getByRole: @hanzo/ui@8 renders a gui primitive,
  // so this control is a <div role="button"> and not a <button>. A role locator
  // matched something else on the page and reported it disabled, which read as
  // "the button never enables" when the button was fine all along.
  const start = page.locator('[data-slot="button"]').filter({ hasText: 'Start Building' }).first();
  await start.click({ timeout: 30_000 });
  await page.locator('#preview-iframe').waitFor({ timeout: 60_000 });
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'hanzo_iam_access_token', value: 'e2e-local', domain: 'localhost', path: '/' },
  ]);
});

test.fixme('the preview frame is isolated in the real builder', async ({ page }) => {
await enterBuilder(page);

  const frame = page.locator('#preview-iframe');
  await expect(frame).toBeAttached({ timeout: 60_000 });

  // The sandbox that actually shipped, on the real page.
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-forms');

  // And it is genuinely opaque: reading into it throws rather than returning a
  // document. This is the property the whole refactor exists to establish.
  const reach = await page.evaluate(() => {
    const f = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (f.contentDocument) return 'REACHED';
    try {
      f.contentWindow!.document;
      return 'REACHED';
    } catch (e) {
      return (e as Error).name;
    }
  });
  expect(reach).toBe('SecurityError');
});

test.fixme('the bridge is live inside the real preview and reports selections', async ({ page }) => {
  // `?prompt=` skips the start screen (showOnboarding is false once a seed
  // prompt is present), so the editor and its preview frame mount. The
  // generation that seed kicks off 401s locally — irrelevant here: the pane
  // renders HTML from local state, which is the surface under test.
  await enterBuilder(page);
  await expect(page.locator('#preview-iframe')).toBeAttached({ timeout: 60_000 });

  // Record what the frame sends up, exactly as the host does.
  await page.evaluate(() => {
    (window as any).__bridge = [];
    window.addEventListener('message', (e) => {
      const d = e.data as { type?: string };
      if (d && typeof d.type === 'string' && d.type.startsWith('preview:')) (window as any).__bridge.push(d);
    });
  });

  // Put a known document in the pane the way a build does, then confirm the
  // bridge announces itself from inside it.
  await page.evaluate(() => {
    const f = document.getElementById('preview-iframe') as HTMLIFrameElement;
    f.srcdoc = f.srcdoc.replace(/^/, '<h1 id="probe">Probe</h1>');
  });

  await expect
    .poll(() => page.evaluate(() => (window as any).__bridge.some((m: any) => m.type === 'preview:ready')), {
      timeout: 20_000,
    })
    .toBe(true);

  // Editable mode on, then click — the host's own path.
  await page.evaluate(() => {
    const f = document.getElementById('preview-iframe') as HTMLIFrameElement;
    f.contentWindow!.postMessage({ type: 'preview:editable', active: true }, '*');
  });
  await page.frameLocator('#preview-iframe').locator('#probe').click();

  const select = await page.evaluate(() =>
    (window as any).__bridge.find((m: any) => m.type === 'preview:select'),
  );
  expect(select).toBeTruthy();
  expect(select.info.selector).toBe('#probe');
  expect(select.info.tagName).toBe('h1');
  // The markup the composer hands the model when you ask it to change "this".
  expect(select.info.html).toContain('Probe');
});
