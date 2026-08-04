/**
 * Only failures that are CERTAIN from the markup. Real layout needs a browser,
 * and a checker that reports maybes gets ignored on the day it is right.
 */
import { responsiveIssues, PHONE_PX } from '@/lib/pages/responsive';

const doc = (body: string, head = '<meta name="viewport" content="width=device-width, initial-scale=1">') =>
  `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;

describe('responsiveIssues', () => {
  it('passes a document with a viewport and fluid widths', () => {
    const html = doc('<div style="width:100%"><style>.a{max-width:1200px;width:90vw}</style></div>');
    expect(responsiveIssues([{ path: 'index.html', html }])).toEqual([]);
  });

  it('flags a missing viewport meta', () => {
    const issues = responsiveIssues([{ path: 'index.html', html: doc('<p>x</p>', '') }]);
    expect(issues).toHaveLength(1);
    expect(issues[0].problem).toMatch(/viewport/i);
  });

  it('flags a fixed width wider than a phone', () => {
    const html = doc('<style>.hero{width:1200px}</style>');
    const issues = responsiveIssues([{ path: 'index.html', html }]);
    expect(issues).toHaveLength(1);
    expect(issues[0].detail).toBe('width: 1200px');
  });

  it('flags min-width, which forces sideways scrolling', () => {
    const html = doc('<style>.wrap{min-width:900px}</style>');
    const issues = responsiveIssues([{ path: 'index.html', html }]);
    expect(issues[0].problem).toMatch(/sideways/i);
  });

  it('does NOT flag a width inside a media query — it is conditional', () => {
    const html = doc('<style>@media (min-width: 768px){ .hero{width:1200px} }</style>');
    expect(responsiveIssues([{ path: 'index.html', html }])).toEqual([]);
  });

  it('handles nested braces inside a media query without losing the rest', () => {
    const html = doc(
      '<style>@media (min-width:768px){ .a{width:1200px} .b{width:900px} } .c{min-width:1000px}</style>',
    );
    const issues = responsiveIssues([{ path: 'index.html', html }]);
    // The media block is skipped; the rule AFTER it is still seen.
    expect(issues).toHaveLength(1);
    expect(issues[0].detail).toBe('min-width: 1000px');
  });

  it('catches an inline style too', () => {
    const html = doc('<div style="width: 800px">x</div>');
    expect(responsiveIssues([{ path: 'index.html', html }])).toHaveLength(1);
  });

  it('ignores widths a phone can honour', () => {
    const html = doc(`<style>.a{width:${PHONE_PX}px}.b{width:320px}</style>`);
    expect(responsiveIssues([{ path: 'index.html', html }])).toEqual([]);
  });

  it('does not demand a viewport tag from a fragment', () => {
    // Follow-up edits legitimately return fragments with no <head> to put it in.
    expect(responsiveIssues([{ path: 'index.html', html: '<section><h2>x</h2></section>' }])).toEqual([]);
  });
});
