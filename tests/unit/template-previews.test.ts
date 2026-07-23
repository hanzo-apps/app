/**
 * lib/template-previews — the ONE registry of local, self-contained preview
 * documents for gallery slugs whose upstream screenshot is not a faithful
 * "existing app" view. The /v1/templates/:slug/html loader consults it FIRST
 * and serves the document verbatim, so we assert the contract the loader
 * relies on: a registered slug yields one standalone theme-aware HTML document
 * with no external fetches (CSP-safe), and everything else yields null.
 */
import {
  getLocalTemplatePreview,
  hasLocalTemplatePreview,
} from '@/lib/template-previews';

describe('getLocalTemplatePreview', () => {
  it('returns a full standalone document for a registered slug', () => {
    const doc = getLocalTemplatePreview('metrics');
    expect(doc).not.toBeNull();
    expect(doc).toMatch(/^<!DOCTYPE html>/i);
    expect(doc).toMatch(/<\/html>\s*$/i);
  });

  it('is case/whitespace-insensitive on the slug', () => {
    expect(getLocalTemplatePreview('  METRICS ')).toBe(
      getLocalTemplatePreview('metrics'),
    );
  });

  it('returns null for unregistered or blank slugs', () => {
    expect(getLocalTemplatePreview('unknown-kit')).toBeNull();
    expect(getLocalTemplatePreview('')).toBeNull();
  });

  it('ships CSP-safe documents — no external CSS/JS/font/img loads', () => {
    const doc = getLocalTemplatePreview('metrics')!;
    // Self-contained: no http(s) src/href asset references anywhere.
    expect(doc).not.toMatch(/\b(?:src|href)\s*=\s*["']https?:\/\//i);
  });

  it('ships theme-aware documents — dark via media query AND explicit hook', () => {
    const doc = getLocalTemplatePreview('metrics')!;
    expect(doc).toMatch(/prefers-color-scheme:\s*dark/);
    expect(doc).toMatch(/data-theme="dark"|\.dark\b/);
  });
});

describe('hasLocalTemplatePreview', () => {
  it('mirrors the registry', () => {
    expect(hasLocalTemplatePreview('metrics')).toBe(true);
    expect(hasLocalTemplatePreview('nope')).toBe(false);
  });
});
