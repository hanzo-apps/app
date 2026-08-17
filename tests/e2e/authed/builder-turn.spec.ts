import { test } from '@playwright/test';

/**
 * Diagnostic: a REAL builder turn, the size a person actually sends.
 *
 * The short probes beside this one (gateway-probe, generate-probe) answer 200
 * in seconds and prove nothing about the turn that fails — a build asks for a
 * whole site, so it is the LONG generation that meets whatever ceiling is being
 * met. This drives /dev the way a person does and prints every `/v1/*` response
 * with its status and duration, plus what the screen ends up saying.
 *
 * The status is recorded the moment the headers arrive and the body is filled
 * in afterwards: `response.text()` on a streamed answer resolves only when the
 * stream ENDS, so awaiting it inside the handler drops exactly the call this
 * exists to watch.
 */
test('a real builder turn', async ({ page }) => {
  type Call = { url: string; status: number; ms: number; body: string };
  const seen: Call[] = [];
  const started = new Map<string, number>();
  const mine = (u: string) => new URL(u).pathname.startsWith('/v1/');

  page.on('request', (r) => started.set(r.url(), Date.now()));
  page.on('response', (r) => {
    if (!mine(r.url())) return;
    const t0 = started.get(r.url()) ?? Date.now();
    const call: Call = {
      url: new URL(r.url()).pathname,
      status: r.status(),
      ms: Date.now() - t0,
      body: '<streaming>',
    };
    seen.push(call);
    r.text().then(
      (t) => {
        call.body = t.slice(0, 400);
        call.ms = Date.now() - t0;
      },
      (e) => {
        call.body = `<unreadable: ${String(e).slice(0, 120)}>`;
      },
    );
  });
  page.on('requestfailed', (r) => {
    if (!mine(r.url())) return;
    seen.push({
      url: new URL(r.url()).pathname,
      status: -1,
      ms: Date.now() - (started.get(r.url()) ?? Date.now()),
      body: `FAILED: ${r.failure()?.errorText}`,
    });
  });

  await page.goto('/dev');

  const box = page
    .getByPlaceholder(/ask|build|describe|what/i)
    .or(page.locator('textarea'))
    .first();
  await box.waitFor({ state: 'visible', timeout: 30_000 });
  await box.fill(
    'Build a marketing site for speak2hear, a company that makes real-time ' +
      'captioning for deaf and hard-of-hearing people: a hero, a section on how ' +
      'the captioning works, three pricing tiers, an about page and a contact ' +
      'form. Warm plain tone, calm palette.',
  );
  await box.press('Enter');

  // Long enough for a whole site. The point is to WATCH, not to assert.
  await page.waitForTimeout(240_000);

  console.log('[calls]');
  for (const c of seen) {
    console.log(` ${c.status} ${c.ms}ms ${c.url}`);
    console.log(`   ${c.body.replace(/\s+/g, ' ').slice(0, 300)}`);
  }
  const said = (await page.locator('body').innerText())
    .split('\n')
    .filter((l) => /unavailable|respond|error|failed|credit|sign in/i.test(l));
  console.log('[screen says]');
  for (const l of said.slice(0, 12)) console.log(' ' + l);
  await page.screenshot({ path: 'tests/e2e/test-results/builder-turn.png', fullPage: true });
});
