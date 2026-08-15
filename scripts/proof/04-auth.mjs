import { browser, ctx, shot, watch, settle, BASE, AUTH, log } from './drive.mjs';

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error('E2E_EMAIL / E2E_PASSWORD required');

const size = process.env.SIZE || 'desktop';
const b = await browser();
const c = await ctx(b, { size });
const page = await c.newPage();
const errs = watch(page);
const hops = [];
page.on('framenavigated', (f) => {
  if (f === page.mainFrame()) hops.push(f.url());
});

// 1. Land, then take the ONE way in from the header.
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await settle(page, 2500);

if (size === 'phone') {
  await page.mouse.click(352, 30); // hamburger
  await settle(page, 900);
  log('menu shot:', await shot(page, `04-auth-${size}-0-menu`));
}
const cta = page.getByText(/^(Get started|Sign in|Log in)$/).first();
log('CTA text:', await cta.innerText().catch(() => 'NOT FOUND'));
await cta.click({ timeout: 8000 });

await page.waitForURL(/hanzo\.id|login|signin|signup/i, { timeout: 25_000 }).catch(() => {});
await settle(page, 3000);
log('after CTA url:', page.url());
log('shot:', await shot(page, `04-auth-${size}-1-idp`));

// 2. The IAM form. Wait for its own config before typing (a submit that beats
//    `get-app-login` is answered 400 with the form silently unchanged).
await page
  .waitForResponse((r) => r.url().includes('get-app-login') && r.ok(), { timeout: 12_000 })
  .catch(() => {});
await settle(page, 1200);

const identity = page
  .getByLabel(/email|username/i)
  .or(page.locator('input[type="email"]'))
  .or(page.locator('input[type="text"]'))
  .first();
await identity.waitFor({ state: 'visible', timeout: 15_000 });
await identity.fill(EMAIL);
const secret = page.getByLabel(/password/i).or(page.locator('input[type="password"]')).first();
await secret.fill(PASSWORD);
log('form carries credentials:', (await identity.inputValue()) === EMAIL, (await secret.inputValue()).length > 0);
log('filled shot:', await shot(page, `04-auth-${size}-2-form`));

const submit = page.getByRole('button', { name: 'Continue', exact: true }).or(page.getByRole('button', { name: /^(Sign in|Log in)$/i })).first();
await submit.click({ timeout: 10_000 });

// 3. Where does it land? Count IAM hops — a second authorize round-trip is a
//    double login.
await page.waitForURL((u) => !/hanzo\.id/.test(u.toString()), { timeout: 40_000 }).catch(() => {});
await settle(page, 4000);
log('landed url:', page.url());
log('shot:', await shot(page, `04-auth-${size}-3-landed`));

const idpHops = hops.filter((h) => /hanzo\.id/.test(h));
log('\nNAV TRAIL:');
hops.forEach((h) => log('  ', h.slice(0, 140)));
log('hanzo.id hops:', idpHops.length, '(authorize forms:', idpHops.filter((h) => /login\/oauth\/authorize/.test(h)).length, ')');

// 4. Is the session real? Ask the app who we are.
const me = await page.evaluate(async () => {
  const r = await fetch('/v1/me', { headers: { Accept: 'application/json' } });
  return { status: r.status, body: (await r.text()).slice(0, 400) };
});
log('\n/v1/me =>', me.status, me.body);

if (me.status === 200 && /"authenticated":\s*true/.test(me.body)) {
  await c.storageState({ path: AUTH });
  log('saved session ->', AUTH);
}
if (errs.length) log('\nERRORS:', errs.slice(0, 15));
await b.close();
