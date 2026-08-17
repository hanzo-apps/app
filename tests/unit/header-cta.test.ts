import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Nothing in this header links to the page it is on.
 *
 * `@hanzogui/shell`'s registry describes hanzo.app from the OUTSIDE, so several
 * of its entries point at `https://hanzo.app` — everywhere else a link TO the
 * builder, here a link to the page you are already on. A self-link is a dead
 * control, and it is worst BEFORE hydration, which is exactly when a static
 * export is read.
 *
 * This used to be enforced by refusing the primary action outright
 * (`primaryCTA: undefined`), which cost the surface its one filled pill and
 * still did not finish the job: the BRAND MARK was the same bare
 * `<a href="https://hanzo.app">`, so the header kept a self-link either way.
 *
 * From `@hanzogui/shell` 8.1.22 the shell answers it properly — any control
 * naming the current place (either CTA, a nav row, a mobile sheet row, the
 * brand mark) renders `aria-current="page"` with no href, keeping its exact
 * appearance. So the action is back and the invariant moves to the mechanism
 * that makes it safe: the header must TELL the shell where it is.
 */
const header = readFileSync(join(process.cwd(), 'components/layout/header.tsx'), 'utf8');

describe('header self-links', () => {
  it('tells the shell which place this is, so it can mark it current', () => {
    // A ROUTE, not an absolute URL: the shell matches entries against this to
    // decide which one names the page being rendered. Without it every entry is
    // just a link and the brand mark points at itself again.
    //
    // `{pathname}` and a `"/…"` literal both satisfy that, and the expression is
    // the stronger of the two — a literal `"/"` marked the home page and only
    // ever the home page, so every OTHER route kept the self-link this file
    // exists to prevent. Pinning the literal alone therefore failed the header
    // for getting better, and in this repo a red `test` job skips `build-amd64`
    // outright: no image, no deploy, and nothing in the run saying so.
    expect(header).toMatch(/currentHref=(\{pathname\}|"\/)/);
  });

  it('does not refuse the primary action any more', () => {
    // The pill is the registry's, and the shell renders it as a BUTTON here.
    // Re-introducing this override would silently drop the one filled control
    // in the bar for a problem the shell already solves.
    expect(header).not.toMatch(/primaryCTA:\s*undefined/);
  });

  it('never writes an absolute self URL of its own', () => {
    // The shell can only neutralize entries it OWNS. A hardcoded hanzo.app href
    // at this call site is invisible to it and self-links again.
    expect(header).not.toMatch(/href:\s*["']https:\/\/hanzo\.app["']/);
  });
});
