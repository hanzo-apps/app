/** @jest-environment jsdom */

/**
 * The launcher IS the ensō. One circle, drawn once.
 *
 * A plate behind the mark — filled disc, border, shadow — reads as a second
 * ring wrapped around the first. This pins the trigger to the bare mark so the
 * plate can never come back.
 */

import fs from 'node:fs';
import path from 'node:path';

const script = fs.readFileSync(path.join(process.cwd(), 'public/edit.js'), 'utf8');

function mount() {
  global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch;
  document.head.innerHTML = '<meta name="hanzo:repo" content="hanzoai/app">';
  document.body.innerHTML = '';
  window.eval(script);
  const host = document.querySelector('[data-hanzo-edit]') as HTMLElement;
  return host.shadowRoot as ShadowRoot;
}

function trigger(root: ShadowRoot) {
  return root.querySelector('button.fab') as HTMLButtonElement;
}

/**
 * The parsed base `.fab` declarations — real CSSOM, not a substring match.
 * jsdom only builds a sheet for a style element in the document, so the
 * widget's own sheet text is re-parsed there.
 */
function fabStyle(root: ShadowRoot) {
  const parser = document.createElement('style');
  parser.textContent = (root.querySelector('style') as HTMLStyleElement).textContent;
  document.head.appendChild(parser);
  const rule = Array.prototype.find.call(
    (parser.sheet as CSSStyleSheet).cssRules,
    (r: CSSRule) => (r as CSSStyleRule).selectorText === '.fab',
  ) as CSSStyleRule;
  return rule.style;
}

describe('edit widget mark', () => {
  afterEach(() => {
    delete (window as typeof window & { __hanzoEdit?: boolean }).__hanzoEdit;
    jest.restoreAllMocks();
  });

  it('draws one circle — the mark, not a mark inside a plate', () => {
    expect(trigger(mount()).querySelectorAll('circle')).toHaveLength(1);
  });

  it('gives the trigger no ring, no plate and no shadow of its own', () => {
    const style = fabStyle(mount());
    expect(style.getPropertyValue('border')).toBe('0');
    expect(style.getPropertyValue('background')).toBe('transparent');
    expect(style.getPropertyValue('box-shadow')).toBe('');
  });

  it('keeps the trigger a button with an accessible name', () => {
    const fab = trigger(mount());
    expect(fab.tagName).toBe('BUTTON');
    expect(fab.getAttribute('aria-label')).toBeTruthy();
  });
});
